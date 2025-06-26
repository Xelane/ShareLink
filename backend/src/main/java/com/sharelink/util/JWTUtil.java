package com.sharelink.util;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.SignedJWT;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class JWTUtil {

    private static String jwksUrl;

    @Value("${cognito.jwksUrl}")
    public void setJwksUrl(String url) {
        JWTUtil.jwksUrl = url;
    }

    public static String extractUsername(String token) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWKSet jwkSet = JWKSet.load(new URL(jwksUrl));
        String kid = signedJWT.getHeader().getKeyID();
        JWK jwk = jwkSet.getKeyByKeyId(kid);
        if (jwk == null) throw new IllegalArgumentException("Invalid key ID");

        RSAPublicKey publicKey = ((RSAKey) jwk).toRSAPublicKey();
        JWSVerifier verifier = new RSASSAVerifier(publicKey);

        if (!signedJWT.verify(verifier)) throw new SecurityException("JWT verification failed");
        return signedJWT.getJWTClaimsSet().getStringClaim("cognito:username");
    }

    public static String extractUsernameFromRequest(HttpServletRequest request) {
        Object usernameAttr = request.getAttribute("username");
        return usernameAttr != null ? usernameAttr.toString() : null;
    }

    @SuppressWarnings({"CallToPrintStackTrace", "UseSpecificCatch"})
    public static Map<String, Object> verifyToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWKSet jwkSet = JWKSet.load(new URL(jwksUrl));
            JWK jwk = jwkSet.getKeyByKeyId(signedJWT.getHeader().getKeyID());
            if (jwk == null) return null;

            RSAPublicKey publicKey = ((RSAKey) jwk).toRSAPublicKey();
            JWSVerifier verifier = new RSASSAVerifier(publicKey);

            return signedJWT.verify(verifier)
                ? signedJWT.getJWTClaimsSet().getClaims()
                : null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
