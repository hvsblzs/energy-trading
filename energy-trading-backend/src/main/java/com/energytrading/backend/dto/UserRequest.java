package com.energytrading.backend.dto;

import com.energytrading.backend.model.enums.Role;
import lombok.Data;

@Data
public class UserRequest {
    private String email;
    private String password;
    private Role role;
    private Long companyId;
}
