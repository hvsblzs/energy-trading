package com.energytrading.backend.controller;

import com.energytrading.backend.dto.CompanyResourcesResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.CompanyResourcesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/company-resources")
@RequiredArgsConstructor
public class CompanyResourcesController {

    private final CompanyResourcesService companyResourcesService;

    @PreAuthorize("hasRole('COMPANY_USER')")
    @GetMapping("/me")
    public ResponseEntity<List<CompanyResourcesResponse>> getMyResources(@AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(companyResourcesService.getMyResources(currentUser));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<CompanyResourcesResponse>> getResourcesByCompany(@PathVariable Long companyId){
        return ResponseEntity.ok(companyResourcesService.getResourcesByCompany(companyId));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping("/company/{companyId}/resource/{resourceTypeId}")
    public ResponseEntity<Void> addResource(@PathVariable Long companyId, @PathVariable Long resourceTypeId) {
        companyResourcesService.addResource(companyId, resourceTypeId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @DeleteMapping("/company/{companyId}/resource/{resourceTypeId}")
    public ResponseEntity<Void> removeResource(@PathVariable Long companyId, @PathVariable Long resourceTypeId){
        companyResourcesService.removeResource(companyId, resourceTypeId);
        return ResponseEntity.noContent().build();
    }
}
