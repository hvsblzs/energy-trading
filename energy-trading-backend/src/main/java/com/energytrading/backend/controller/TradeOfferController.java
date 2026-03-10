package com.energytrading.backend.controller;

import com.energytrading.backend.dto.TradeOfferRequest;
import com.energytrading.backend.dto.TradeOfferResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.TradeOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trade-offers")
@RequiredArgsConstructor
public class TradeOfferController {

    private final TradeOfferService tradeOfferService;

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping
    public ResponseEntity<List<TradeOfferResponse>> getAllTradeOffers(){
        return ResponseEntity.ok(tradeOfferService.getAllTradeOffers());
    }

    @PreAuthorize("hasRole('COMPANY_USER')")
    @GetMapping("/my")
    public ResponseEntity<List<TradeOfferResponse>> getMyTradeOffers(@AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(tradeOfferService.getMyTradeOffers(currentUser));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/{id}")
    public ResponseEntity<TradeOfferResponse> getTradeOfferById(@PathVariable("id") Long id){
        return ResponseEntity.ok(tradeOfferService.getTradeOfferById(id));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/pending")
    public ResponseEntity<List<TradeOfferResponse>> getPendingTradeOffers(){
        return ResponseEntity.ok(tradeOfferService.getPendingTradeOffers());
    }

    @PreAuthorize("hasRole('COMPANY_USER')")
    @PostMapping
    public ResponseEntity<TradeOfferResponse> createTradeOffer(@RequestBody TradeOfferRequest tradeOfferRequest,
                                                               @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(tradeOfferService.createTradeOffer(tradeOfferRequest, currentUser));
    }

    @PreAuthorize("hasRole('DISPATCHER')")
    @PutMapping("/{id}/approve")
    public ResponseEntity<TradeOfferResponse> approveTradeOffer(@PathVariable("id") Long id,
                                                                @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(tradeOfferService.approveTradeOffer(id, currentUser));
    }

    @PreAuthorize("hasRole('DISPATCHER')")
    @PutMapping("/{id}/reject")
    public ResponseEntity<TradeOfferResponse> rejectTradeOffer(@PathVariable("id") Long id,
                                                               @AuthenticationPrincipal User currentUser,
                                                               @RequestParam String notes){
        return ResponseEntity.ok(tradeOfferService.rejectTradeOffer(id, currentUser, notes));
    }
}
