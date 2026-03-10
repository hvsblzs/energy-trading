package com.energytrading.backend.dto;

import lombok.Data;

@Data
public class CompanyResourcesResponse {
    private Long id;
    private String resourceTypeName;
    private String resourceTypeUnit;
    private String resourceTypeColor;
    private boolean isActive;
}
