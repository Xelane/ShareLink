package com.sharelink.controller;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sharelink.model.ShareLink;
import com.sharelink.service.LinkService;
import com.sharelink.service.S3Service;
import com.sharelink.util.JWTUtil;
import com.sharelink.util.QRCodeUtil;
import com.sharelink.util.URLGenerator;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class FileController {

    private final S3Service s3Service;
    private final LinkService linkService;

    @Value("${app.baseUrl}")
    private String baseUrl;

    public FileController(S3Service s3Service, LinkService linkService) {
        this.s3Service = s3Service;
        this.linkService = linkService;
    }

    @PostMapping("/upload")
    @SuppressWarnings("UseSpecificCatch")
    public ResponseEntity<Map<String, String>> uploadFiles(
    @RequestParam("files") MultipartFile[] files,
    @RequestParam(value = "password", required = false) String password,
    @RequestParam(value = "expiryHours", required = false, defaultValue = "24") int expiryHours, HttpServletRequest request){
        try {
            if (files.length > 5) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Maximum of 5 files allowed per upload."));
            }

            long totalSize = 0;
            for (MultipartFile file : files) {
                totalSize += file.getSize();
            }
            if (totalSize > 30 * 1024 * 1024) { // 30 MB in bytes
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Total upload size must not exceed 30 MB."));
            }

            String shortCode = URLGenerator.generateUniqueShortCode(6, linkService);
            long now = System.currentTimeMillis();
            expiryHours = Math.max(1, Math.min(expiryHours, 168)); // Clamp between 1 and 168 hours
            long expiry = now + expiryHours * 60L * 60L * 1000L;

            List<String> s3Keys = new ArrayList<>();
            List<String> filenames = new ArrayList<>();
            List<Long> fileSizes = new ArrayList<>();
            String username = JWTUtil.extractUsernameFromRequest(request);

            if (files.length == 1) {
                // Single file — upload directly
                MultipartFile file = files[0];
                String key = "uploads/" + shortCode + "/" + file.getOriginalFilename();
                s3Service.uploadFile(file, key);
                s3Keys.add(key);
                filenames.add(file.getOriginalFilename());
                fileSizes.add(file.getSize());
                totalSize = file.getSize();
            } else {
                // Multiple files — zip into one
                String archiveName = shortCode + ".zip";
                String key = "uploads/" + shortCode + "/" + archiveName;

                ByteArrayOutputStream zipBytes = new ByteArrayOutputStream();
                try (ZipOutputStream zos = new ZipOutputStream(zipBytes)) {
                    for (MultipartFile file : files) {
                        ZipEntry entry = new ZipEntry(file.getOriginalFilename());
                        zos.putNextEntry(entry);
                        file.getInputStream().transferTo(zos);
                        zos.closeEntry();
                    }
                }
                // Upload zip
                s3Service.uploadFileFromBytes(zipBytes.toByteArray(), key, "application/zip");

                s3Keys.add(key);
                filenames.add(archiveName);
                fileSizes.add((long) zipBytes.size());
                totalSize = zipBytes.size();
            }


            // Save metadata to DynamoDB
            ShareLink link = new ShareLink();
            link.setShortCode(shortCode);
            link.setS3Keys(s3Keys);
            link.setOriginalFilenames(filenames);
            link.setFileSizes(fileSizes);
            link.setTotalSize(totalSize);
            link.setCreatedAt(now);
            link.setExpiresAt(expiry);
            if (username != null) {
                link.setUsername(username);
            }

            if (password != null && !password.isEmpty()) {
                String hashed = new BCryptPasswordEncoder().encode(password);
                link.setPassword(hashed);
                System.out.println("Saving password hash: " + hashed);
                System.out.println("Password on link before save: " + link.getPassword());
            }
            System.out.println("Link being saved: " + link);
            linkService.saveLink(link);

            Map<String, String> response = new HashMap<>();
            response.put("shortLink", baseUrl + "/" + shortCode);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/info/{shortCode}")
    public ResponseEntity<Map<String, Object>> getLinkInfo(@PathVariable String shortCode,  @RequestParam(value = "password", required = false) String password) {
        ShareLink link = linkService.getLink(shortCode);

        if (link == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Link not found"));
        }

        Map<String, Object> info = new HashMap<>();
        info.put("fileNames", link.getOriginalFilenames());
        info.put("fileSizes", link.getFileSizes());
        info.put("totalSize", link.getTotalSize());
        info.put("expiresAt", link.getExpiresAt());
        info.put("createdAt", link.getCreatedAt());
        info.put("downloadCount", link.getDownloadCount());
        long now = System.currentTimeMillis();
        long timeLeft = Math.max(0, link.getExpiresAt() - now);
        long hoursLeft = timeLeft / (60L * 60L * 1000L);
        info.put("expiresInHours", hoursLeft);
        info.put("expired", now > link.getExpiresAt()); // Add this
        info.put("passwordProtected", link.getPassword() != null);

        return ResponseEntity.ok(info);
    }

    @GetMapping("/my-uploads")
    public ResponseEntity<?> getMyUploads(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid token.");
        }

        List<ShareLink> links = linkService.getLinksByUsername(username);

        long now = System.currentTimeMillis();
        List<Map<String, Object>> uploads = new ArrayList<>();
        for (ShareLink link : links) {
            Map<String, Object> map = new HashMap<>();
            map.put("shortCode", link.getShortCode());
            map.put("fileNames", link.getOriginalFilenames());
            map.put("fileSizes", link.getFileSizes());
            map.put("totalSize", link.getTotalSize());
            map.put("createdAt", link.getCreatedAt());
            map.put("expiresAt", link.getExpiresAt());
            map.put("downloadCount", link.getDownloadCount());
            map.put("expired", now > link.getExpiresAt());
            uploads.add(map);
        }

        return ResponseEntity.ok(uploads);
    }


    @DeleteMapping("/link/{shortCode}")
    public ResponseEntity<?> deleteLink(@PathVariable String shortCode, HttpServletRequest request) {
        String username = (String) request.getAttribute("username");

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "You must be logged in to delete links."));
        }

        ShareLink link = linkService.getLink(shortCode);

        if (link == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Link not found."));
        }
        System.out.println("Authenticated user: " + username);
        System.out.println("Link owner: " + link.getUsername());


        if (link.getUsername() == null || !username.equals(link.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You do not have permission to delete this link."));
        }

        // Delete files from S3
        for (String key : link.getS3Keys()) {
            s3Service.deleteFile(key);
        }

        // Delete metadata from DynamoDB
        linkService.deleteLink(shortCode);

        return ResponseEntity.ok(Map.of("message", "Link and associated files deleted successfully."));
    }

    @PostMapping("/{shortCode}/download")
    public ResponseEntity<?> downloadWithPassword(@PathVariable String shortCode,
                                                  @RequestBody(required = false) Map<String, String> body) {
        String password = body != null ? body.get("password") : null;

        ShareLink link = linkService.getLink(shortCode);
        if (link == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Link not found"));
        }

        long now = System.currentTimeMillis();
        if (link.getExpiresAt() != null && now > link.getExpiresAt()) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", "Link expired"));
        }

        if (link.getPassword() != null) {
            if (password == null || !new BCryptPasswordEncoder().matches(password, link.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Incorrect or missing password"));
            }
        }

        if (link.getS3Keys().size() == 1) {
            String url = s3Service.generatePresignedUrl(link.getS3Keys().get(0));
            linkService.incrementDownloadCount(shortCode);
            return ResponseEntity.ok(Map.of("downloadUrl", url));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Multi-file download not yet supported in this endpoint"));
        }
    }

    @GetMapping("/{shortCode}/qr")
    public ResponseEntity<byte[]> getQRCode(@PathVariable String shortCode) {
        try {
            String url = baseUrl + "/" + shortCode;
            byte[] qrImage = QRCodeUtil.generateQRCodeImage(url);
            return ResponseEntity.ok()
                    .header("Content-Type", "image/png")
                    .body(qrImage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}
