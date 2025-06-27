package com.sharelink.util;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

public class QRCodeUtil {

    public static byte[] generateQRCodeImage(String url) throws Exception {
        int width = 250;
        int height = 250;

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(url, BarcodeFormat.QR_CODE, width, height);

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                image.setRGB(x, y, bitMatrix.get(x, y) ? 0x000000 : 0xFFFFFF);
            }
        }

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", stream);
        return stream.toByteArray();
    }
}
