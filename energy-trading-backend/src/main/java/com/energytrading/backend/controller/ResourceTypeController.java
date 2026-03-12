package com.energytrading.backend.controller;

import com.energytrading.backend.dto.ResourceTypeRequest;
import com.energytrading.backend.dto.ResourceTypeResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.ResourceTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-types")
@RequiredArgsConstructor
public class ResourceTypeController {

    private final ResourceTypeService resourceTypeService;

    @GetMapping
    public ResponseEntity<List<ResourceTypeResponse>> getAllResourceTypes(){
        return ResponseEntity.ok(resourceTypeService.getAllResourceTypes());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping
    public ResponseEntity<ResourceTypeResponse> createResourceType(@RequestBody ResourceTypeRequest request,
                                                                   @AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(resourceTypeService.createResourceType(request, currentUser));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResourceType(@PathVariable("id") Long id){
        resourceTypeService.deleteResourceType(id);
        return ResponseEntity.noContent().build();
    }
}
