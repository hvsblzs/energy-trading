package com.energytrading.backend.dto;

import com.energytrading.backend.model.enums.Role;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Long companyId;
    private String companyName;
    private String companyPhone;
    private String companyAddress;
    private BigDecimal creditBalance;
    private boolean isActive;
    private LocalDateTime createdAt;
}
