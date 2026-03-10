package com.energytrading.backend.dto;

import lombok.Data;

@Data
public class ResourceTypeResponse {
    private Long id;
    private String name;
    private String unit;
    private String color;
    private boolean isActive;
}
