package com.energytrading.backend.dto;

import com.energytrading.backend.model.enums.Period;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TransactionStatsResponse {
    private Period period;
    private BigDecimal totalCreditVolume;
    private List<ResourceStat> resourceStats;

    @Data
    public static class ResourceStat{
        private String resourceType;
        private String unit;
        private BigDecimal totalQuantity;
        private BigDecimal totalCredit;
    }
}
