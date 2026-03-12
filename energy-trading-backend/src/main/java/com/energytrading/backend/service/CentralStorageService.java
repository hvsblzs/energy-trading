package com.energytrading.backend.service;

import com.energytrading.backend.dto.CentralStorageRequest;
import com.energytrading.backend.dto.CentralStorageResponse;
import com.energytrading.backend.exception.AccessDeniedException;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.CentralStorage;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CentralStorageRepository;
import com.energytrading.backend.repository.CompanyResourcesRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CentralStorageService {

    private final CentralStorageRepository centralStorageRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final CompanyResourcesRepository companyResourcesRepository;
    private final DispatcherBalanceService dispatcherBalanceService;

    public CentralStorageResponse getStorage(String resourceTypeName, User currentUser){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + resourceTypeName));
        if(currentUser.getRole() == Role.COMPANY_USER){
            companyResourcesRepository.findByCompanyAndResourceType(currentUser.getCompany(), resourceType)
                    .orElseThrow(() -> new AccessDeniedException("Access denied for this resource type"));
        }
        CentralStorage centralStorage = this.centralStorageRepository.findByResourceType(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found in Central Storage: " + resourceTypeName));
        return mapToResponse(centralStorage);
    }

    public CentralStorageResponse updateStorage(String resourceTypeName, CentralStorageRequest request){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + resourceTypeName));
        CentralStorage centralStorage = this.centralStorageRepository.findByResourceType(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found in Central Storage: " + resourceTypeName));
        centralStorage.setQuantity(request.getQuantity());
        centralStorage.setMaxQuantity(request.getMaxQuantity());
        CentralStorage saved = this.centralStorageRepository.save(centralStorage);
        return mapToResponse(saved);
    }

    public List<CentralStorageResponse> getAllStorage(User currentUser){
        if(currentUser.getRole() == Role.COMPANY_USER){
            return companyResourcesRepository.findByCompany(currentUser.getCompany())
                    .stream()
                    .map(cr -> {
                        CentralStorage cs = centralStorageRepository.findByResourceType(cr.getResourceType())
                                .orElseThrow(() -> new ResourceNotFoundException("Central storage not found"));
                        return mapToResponse(cs);
                    })
                    .toList();
        }
        return centralStorageRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CentralStorageResponse addQuantity(String resourceTypeName, BigDecimal amount){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + resourceTypeName));
        CentralStorage centralStorage = centralStorageRepository.findByResourceType(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("Central storage not found for: " + resourceTypeName));

        BigDecimal newQuantity = centralStorage.getQuantity().add(amount);
        if(newQuantity.compareTo(centralStorage.getMaxQuantity()) > 0){
            throw new BusinessException("A mennyiség meghaladná a maximális kapacitást!");
        }
        centralStorage.setQuantity(newQuantity);

        dispatcherBalanceService.recalculate();

        return mapToResponse(centralStorageRepository.save(centralStorage));
    }

    public CentralStorageResponse updateMaxQuantity(String resourceTypeName, BigDecimal maxQuantity){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + resourceTypeName));
        CentralStorage centralStorage = centralStorageRepository.findByResourceType(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("Central storage not found for: " + resourceTypeName));

        if(maxQuantity.compareTo(centralStorage.getQuantity()) < 0){
            throw new BusinessException("A maximum kapacitás nem lehet kisebb a jelenlegi mennyiségnél!");
        }
        centralStorage.setMaxQuantity(maxQuantity);
        return mapToResponse(centralStorageRepository.save(centralStorage));
    }

    public CentralStorageResponse mapToResponse(CentralStorage centralStorage){
        CentralStorageResponse response = new CentralStorageResponse();
        response.setId(centralStorage.getId());
        response.setResourceType(centralStorage.getResourceType().getName());
        response.setResourceTypeId(centralStorage.getResourceType().getId());
        response.setQuantity(centralStorage.getQuantity());
        response.setUnit(centralStorage.getResourceType().getUnit());
        response.setMaxQuantity(centralStorage.getMaxQuantity());
        response.setUpdatedAt(centralStorage.getUpdatedAt());
        return response;
    }
}