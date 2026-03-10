package com.energytrading.backend.service;

import com.energytrading.backend.dto.ResourceTypeResponse;
import com.energytrading.backend.dto.UserResponse;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceTypeService {

    private final ResourceTypeRepository resourceTypeRepository;

    public List<ResourceTypeResponse> getAllResourceTypes(){
        return resourceTypeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ResourceTypeResponse mapToResponse(ResourceType resourceType){
        ResourceTypeResponse response = new ResourceTypeResponse();
        response.setId(resourceType.getId());
        response.setName(resourceType.getName());
        response.setUnit(resourceType.getUnit());
        response.setColor(resourceType.getColor());
        response.setActive(resourceType.isActive());
        return response;
    }
}
