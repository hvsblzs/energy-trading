package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompanyWithUserRequest {
    //Cég adatok
    private String companyName;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private BigDecimal creditBalance;

    // User adatok
    private String userEmail;
    private String password;
}
