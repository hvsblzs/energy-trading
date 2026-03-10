package com.energytrading.backend.controller;

import com.energytrading.backend.dto.CompanyInventoryResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.CompanyInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/company-inventory")
@RequiredArgsConstructor
public class CompanyInventoryController {

    private final CompanyInventoryService companyInventoryService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('COMPANY_USER')")
    public ResponseEntity<List<CompanyInventoryResponse>> getMyInventory(@AuthenticationPrincipal User user){
        return ResponseEntity.ok(companyInventoryService.getMyInventory(user));
    }
}
