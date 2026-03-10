package com.energytrading.backend.controller;

import com.energytrading.backend.dto.CentralStorageRequest;
import com.energytrading.backend.dto.CentralStorageResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.CentralStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/central_storage")
@RequiredArgsConstructor
public class CentralStorageController {

    private final CentralStorageService centralStorageService;

    @GetMapping("/{resourceType}")
    public ResponseEntity<CentralStorageResponse> getStorage(@PathVariable("resourceType") String resourceType,
                                                             @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(centralStorageService.getStorage(resourceType, currentUser));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{resourceType}")
    public ResponseEntity<CentralStorageResponse> updateStorage(@PathVariable("resourceType") String resourceType,
                                                                @RequestBody CentralStorageRequest request){
        return ResponseEntity.ok(centralStorageService.updateStorage(resourceType, request));
    }

    @GetMapping
    public ResponseEntity<List<CentralStorageResponse>> getAllStorage(@AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(centralStorageService.getAllStorage(currentUser));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PatchMapping("/{resourceType}/add")
    public ResponseEntity<CentralStorageResponse> addQuantity(@PathVariable("resourceType") String resourceType,
                                                              @RequestBody CentralStorageRequest request){
        return ResponseEntity.ok(centralStorageService.addQuantity(resourceType, request.getQuantity()));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PatchMapping("/{resourceType}/max-quantity")
    public ResponseEntity<CentralStorageResponse> updateMaxQuantity(@PathVariable("resourceType") String resourceType,
                                                              @RequestBody CentralStorageRequest request){
        return ResponseEntity.ok(centralStorageService.updateMaxQuantity(resourceType, request.getMaxQuantity()));
    }

}
