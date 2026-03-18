package com.energytrading.backend.dto;

import lombok.Data;

@Data
public class CreatePaymentIntentResponse {
    private String clientSecret;
    private Long creditsToReceive;
    private String paymentIntentId;

    public CreatePaymentIntentResponse(String clientSecret, Long creditsToReceive, String paymentIntentId) {
        this.clientSecret = clientSecret;
        this.creditsToReceive = creditsToReceive;
        this.paymentIntentId = paymentIntentId;
    }
}
