package com.energytrading.backend.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceTypeMessage {
    private String action; // INIT, CREATED, DELETED
    private List<ResourceTypeInfo> resourceTypes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceTypeInfo {
        private Long id;
        private String name;
        private String unit;
        private String color;
        private boolean active;
        private BigDecimal currentBuyPrice;
        private BigDecimal currentSellPrice;
    }
}
