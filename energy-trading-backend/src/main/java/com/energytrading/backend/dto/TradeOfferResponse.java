package com.energytrading.backend.dto;

import com.energytrading.backend.model.enums.OfferType;
import com.energytrading.backend.model.enums.Status;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
public class TradeOfferResponse {
    private Long id;
    private Long companyId;
    private String companyName;
    private String resourceType;
    private OfferType offerType;
    private BigDecimal quantity;
    private BigDecimal pricePerUnit;
    private BigDecimal totalPrice;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long resolvedByUserId;
    private String notes;
    private String resourceTypeColor;
    private String resourceTypeUnit;
}
