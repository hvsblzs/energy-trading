package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyResourcesResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.repository.CompanyInventoryRepository;
import com.energytrading.backend.repository.CompanyRepository;
import com.energytrading.backend.repository.CompanyResourcesRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyResourcesService {

    private final CompanyResourcesRepository companyResourcesRepository;
    private final CompanyRepository companyRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final CompanyInventoryRepository companyInventoryRepository;

    public List<CompanyResourcesResponse> getMyResources(User currentUser){
        Company company = currentUser.getCompany();
        return companyResourcesRepository.findByCompanyAndIsActiveTrue(company)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<CompanyResourcesResponse> getResourcesByCompany(Long companyId){
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return companyResourcesRepository.findByCompany(company)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void addResource(Long companyId, Long resourceTypeId){
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        ResourceType resourceType = resourceTypeRepository.findById(resourceTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found with id: " + resourceTypeId));

        if(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType).isPresent()){
            throw new BusinessException("A cég már kereskedik ezzel a nyersanyaggal!");
        }

        CompanyResources companyResource = CompanyResources.builder()
                .company(company)
                .resourceType(resourceType)
                .isActive(true)
                .build();
        companyResourcesRepository.save(companyResource);

        if(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType).isEmpty()){
            CompanyInventory inventory = CompanyInventory.builder()
                    .company(company)
                    .resourceType(resourceType)
                    .quantity(BigDecimal.ZERO)
                    .build();
            companyInventoryRepository.save(inventory);
        }
    }

    public void removeResource(Long companyId, Long resourceTypeId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        ResourceType resourceType = resourceTypeRepository.findById(resourceTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found with id: " + resourceTypeId));

        CompanyResources companyResource = companyResourcesRepository.findByCompanyAndResourceType(company, resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("A cég nem kereskedik ezzel a nyersanyaggal!"));
        companyResourcesRepository.delete(companyResource);
    }

    public CompanyResourcesResponse mapToResponse(CompanyResources companyResources){
        CompanyResourcesResponse response = new CompanyResourcesResponse();
        response.setId(companyResources.getId());
        response.setResourceTypeName(companyResources.getResourceType().getName());
        response.setResourceTypeUnit(companyResources.getResourceType().getUnit());
        response.setResourceTypeColor(companyResources.getResourceType().getColor());
        response.setActive(companyResources.isActive());
        return response;
    }
}
