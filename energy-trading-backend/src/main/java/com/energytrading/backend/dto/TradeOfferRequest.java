package com.energytrading.backend.dto;

import com.energytrading.backend.model.enums.OfferType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TradeOfferRequest {
    private String resourceType;
    private OfferType offerType;
    private BigDecimal quantity;
}
