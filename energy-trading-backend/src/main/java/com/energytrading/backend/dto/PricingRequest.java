package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PricingRequest {
    private String resourceType;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
}
