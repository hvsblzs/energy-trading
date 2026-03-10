package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyInventoryResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.CompanyInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyInventoryService {

    private final CompanyInventoryRepository companyInventoryRepository;

    public List<CompanyInventoryResponse> getMyInventory(User user) {
        return companyInventoryRepository.findByCompany(user.getCompany())
                .stream()
                .map(inventory -> {
                    CompanyInventoryResponse response = new CompanyInventoryResponse();
                    response.setId(inventory.getId());
                    response.setResourceTypeName(inventory.getResourceType().getName());
                    response.setResourceTypeUnit(inventory.getResourceType().getUnit());
                    response.setResourceTypeColor(inventory.getResourceType().getColor());
                    response.setQuantity(inventory.getQuantity());
                    return response;
                })
                .toList();
    }
}