package com.energytrading.backend.controller;

import com.energytrading.backend.dto.LoginRequest;
import com.energytrading.backend.dto.LoginResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.model.User;
import com.energytrading.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @GetMapping("/hash")
    public String hash(){
        return new BCryptPasswordEncoder().encode("admin123");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request){
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();
            String token = jwtService.generateToken(user);

            return ResponseEntity.ok(new LoginResponse(
                    token,
                    user.getRole().name(),
                    user.getId(),
                    user.getCompany() != null ? user.getCompany().getId() : null
            ));
        } catch (DisabledException e) {
            throw new BusinessException("USER_DISABLED");
        } catch (BadCredentialsException e) {
            throw new BusinessException("BAD_CREDENTIALS");
        }
    }
}
