package com.energytrading.backend.dto.nav;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavTransactionMessage {
    private Long transactionId;
    private String companyName;
    private String resourceType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal creditAmount;
    private String direction;
    private LocalDateTime createdAt;
}
