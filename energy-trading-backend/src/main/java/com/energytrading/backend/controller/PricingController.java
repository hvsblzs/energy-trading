package com.energytrading.backend.controller;

import com.energytrading.backend.dto.PricingRequest;
import com.energytrading.backend.dto.PricingResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricings")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/{resourceType}")
    public ResponseEntity<PricingResponse> getCurrentPrice(@PathVariable("resourceType") String resourceType){
        return ResponseEntity.ok(pricingService.getCurrentPrice(resourceType));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping
    public ResponseEntity<PricingResponse> setPrice(@RequestBody PricingRequest request, @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(pricingService.setPrice(request, currentUser));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/all")
    public ResponseEntity<List<PricingResponse>> getAllCurrentPrices(){
        return ResponseEntity.ok(pricingService.getAllCurrentPrices());
    }
}
