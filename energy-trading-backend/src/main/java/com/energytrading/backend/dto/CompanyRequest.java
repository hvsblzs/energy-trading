package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompanyRequest {
    private String name;
    private String email;
    private String phone;
    private String address;
    private BigDecimal creditBalance;
}
