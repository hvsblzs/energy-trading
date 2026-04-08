package com.energytrading.backend.security;

import com.energytrading.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }

    public String generateToken(UserDetails userDetails){
        Map<String, Object> extraClaims = new HashMap<>();
        if(userDetails instanceof User user){
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("userId", user.getId());
            if(user.getPasswordChangedAt() != null){
                extraClaims.put("pwdChangedAt", user.getPasswordChangedAt().toEpochSecond(ZoneOffset.UTC));
            }
        }
        return buildToken(extraClaims, userDetails);
    }

    public boolean isTokenValid(String token, UserDetails userDetails){
        final String username = extractUsername(token);
        if(!username.equals(userDetails.getUsername()) || isTokenExpired(token)){
            return false;
        }

        //password change check
        if(userDetails instanceof User user && user.getPasswordChangedAt() != null){
            Long pwdChangedAt = extractClaim(token, claims -> claims.get("pwdChangedAt", Long.class));
            if(pwdChangedAt == null){
                return false;
            }
            long userChangedAt = user.getPasswordChangedAt().toEpochSecond(ZoneOffset.UTC);
            if(pwdChangedAt < userChangedAt){
                return false;
            }
        }
        return true;
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails){
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private boolean isTokenExpired(String token){
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token){
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver){
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean isInvalidDueToPasswordChange(String token, UserDetails userDetails){
        if(!(userDetails instanceof  User user)) return false;
        if(user.getPasswordChangedAt() == null) return false;
        Long pwdChangedAt = extractClaim(token, claims -> claims.get("pwdChangedAt", Long.class));
        if(pwdChangedAt == null) return true;
        long userChangedAt = user.getPasswordChangedAt().toEpochSecond(ZoneOffset.UTC);
        return pwdChangedAt < userChangedAt;
    }
}
