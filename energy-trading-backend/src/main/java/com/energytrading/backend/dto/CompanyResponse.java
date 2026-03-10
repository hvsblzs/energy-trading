package com.energytrading.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CompanyResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private BigDecimal creditBalance;
    @JsonProperty("isActive")
    private boolean isActive;
    private LocalDateTime createdAt;
}
