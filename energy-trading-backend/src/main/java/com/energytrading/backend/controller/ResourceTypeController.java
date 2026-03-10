package com.energytrading.backend.controller;

import com.energytrading.backend.dto.ResourceTypeResponse;
import com.energytrading.backend.service.ResourceTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
