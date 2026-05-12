package com.energytrading.backend.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceChangeMessage {
    private String resourceType;
    private String unit;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private LocalDateTime sentAt;
}
