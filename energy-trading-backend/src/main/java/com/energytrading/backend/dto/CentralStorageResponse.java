package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CentralStorageResponse {
    private Long id;
    private String resourceType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal maxQuantity;
    private LocalDateTime updatedAt;
}
