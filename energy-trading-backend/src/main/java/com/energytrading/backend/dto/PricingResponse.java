package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PricingResponse {
    private Long id;
    private String resourceType;
    private String resourceTypeColor;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private Long setByUserId;
    private String setByUserEmail;
    private LocalDateTime createdAt;
}
