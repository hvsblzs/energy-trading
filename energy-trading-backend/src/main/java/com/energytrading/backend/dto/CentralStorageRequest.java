package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CentralStorageRequest {
    private BigDecimal quantity;
    private BigDecimal maxQuantity;
}