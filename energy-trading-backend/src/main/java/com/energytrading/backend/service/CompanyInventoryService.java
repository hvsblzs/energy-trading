package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyInventoryResponse;
import com.energytrading.backend.model.CompanyResources;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.CompanyInventoryRepository;
import com.energytrading.backend.repository.CompanyResourcesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompanyInventoryService {

    private final CompanyInventoryRepository companyInventoryRepository;
    private final CompanyResourcesRepository companyResourcesRepository;

    public List<CompanyInventoryResponse> getMyInventory(User user) {
        return companyInventoryRepository.findByCompany(user.getCompany())
                .stream()
                .map(inventory -> {
                    CompanyResources cr = companyResourcesRepository.findByCompanyAndResourceType(user.getCompany(), inventory.getResourceType()).orElse(null);
                    CompanyInventoryResponse response = new CompanyInventoryResponse();
                    response.setId(inventory.getId());
                    response.setResourceTypeName(inventory.getResourceType().getName());
                    response.setResourceTypeUnit(inventory.getResourceType().getUnit());
                    response.setResourceTypeColor(inventory.getResourceType().getColor());
                    response.setQuantity(inventory.getQuantity());
                    response.setActive(cr != null && cr.isActive());
                    return response;
                })
                .toList();
    }
}