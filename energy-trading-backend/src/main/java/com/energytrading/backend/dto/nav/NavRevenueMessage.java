package com.energytrading.backend.dto.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavRevenueMessage {
    private LocalDateTime periodFrom;
    private LocalDateTime periodTo;
    private BigDecimal totalCreditVolume;
    private List<ResourceRevenue> breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceRevenue {
        private String resourceType;
        private String unit;
        private BigDecimal totalQuantity;
        private BigDecimal totalCredit;
    }
}
