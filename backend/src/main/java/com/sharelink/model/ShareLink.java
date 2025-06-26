package com.sharelink.model;

import java.util.List;

public class ShareLink {
    private String shortCode;
    private String password;
    private String username;
    private List<String> s3Keys;
    private List<String> originalFilenames;
    private List<Long> fileSizes;
    private Long expiresAt;
    private Long createdAt;
    private Long totalSize;
    private Long downloadCount;

    // Getters and Setters
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }


    public List<String> getS3Keys() { return s3Keys; }
    public void setS3Keys(List<String> s3Keys) { this.s3Keys = s3Keys; }

    public List<String> getOriginalFilenames() { return originalFilenames; }
    public void setOriginalFilenames(List<String> originalFilenames) { this.originalFilenames = originalFilenames; }

    public List<Long> getFileSizes() { return fileSizes; }
    public void setFileSizes(List<Long> fileSizes) { this.fileSizes = fileSizes; }

    public Long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Long expiresAt) { this.expiresAt = expiresAt; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getTotalSize() { return totalSize; }
    public void setTotalSize(Long totalSize) { this.totalSize = totalSize; }

    public Long getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Long downloadCount) { this.downloadCount = downloadCount; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}
