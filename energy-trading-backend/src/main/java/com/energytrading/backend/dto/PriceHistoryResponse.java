package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PriceHistoryResponse {
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private LocalDateTime createdAt;

}
