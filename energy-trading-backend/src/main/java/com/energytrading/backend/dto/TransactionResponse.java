package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {
    private Long id;
    private String companyName;
    private String offerType;
    private String resourceType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal creditAmount;
    private LocalDateTime createdAt;
}
