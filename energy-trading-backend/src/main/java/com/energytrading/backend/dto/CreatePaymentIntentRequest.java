package com.energytrading.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentIntentRequest {
    private BigDecimal amount;
}
