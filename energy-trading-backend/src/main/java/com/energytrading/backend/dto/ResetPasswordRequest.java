package com.energytrading.backend.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String newPassword;
}
