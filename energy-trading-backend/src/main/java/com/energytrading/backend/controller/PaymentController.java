package com.energytrading.backend.controller;

import com.energytrading.backend.dto.CreatePaymentIntentRequest;
import com.energytrading.backend.dto.CreatePaymentIntentResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PreAuthorize("hasRole('COMPANY_USER')")
    @PostMapping("/create-payment-intent")
    public ResponseEntity<CreatePaymentIntentResponse> createPaymentIntent(
            @RequestBody CreatePaymentIntentRequest request,
            @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(
                paymentService.createPaymentIntent(request, currentUser.getCompany())
        );
    }

    // Webhook endpoint Stripenak
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader){
        paymentService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }
}
