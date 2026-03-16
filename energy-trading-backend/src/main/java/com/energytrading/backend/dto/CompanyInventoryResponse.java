package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompanyInventoryResponse {
    private Long id;
    private String resourceTypeName;
    private String resourceTypeUnit;
    private String resourceTypeColor;
    private BigDecimal quantity;
    private boolean isActive;
}
