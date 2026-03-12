package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ResourceTypeRequest {
    private String name;
    private String unit;
    private String color;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
}
