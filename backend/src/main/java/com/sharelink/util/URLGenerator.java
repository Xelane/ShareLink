package com.sharelink.util;
import java.security.SecureRandom;

import com.sharelink.service.LinkService;


public class URLGenerator {

    private static final String CHAR_POOL = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom random = new SecureRandom();

    public static String generateUniqueShortCode(int length, LinkService linkService) {
        String code;
        do {
            code = generateShortCode(length);
        } while (linkService.getLink(code) != null);  // retry on collision
        return code;
    }

    private static String generateShortCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHAR_POOL.charAt(random.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }
}

