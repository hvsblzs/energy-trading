package com.energytrading.backend.controller;

import com.energytrading.backend.dto.TransactionResponse;
import com.energytrading.backend.dto.TransactionStatsResponse;
import com.energytrading.backend.model.enums.Period;
import com.energytrading.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/recent")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(){
        return ResponseEntity.ok(transactionService.getRecentTransactions());
    }

    @GetMapping("/stats")
    public ResponseEntity<TransactionStatsResponse> getStats(@RequestParam Period period){
        return ResponseEntity.ok(transactionService.getStats(period));
    }

}
