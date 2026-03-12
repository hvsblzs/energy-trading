package com.energytrading.backend.service;

import com.energytrading.backend.dto.ResourceTypeRequest;
import com.energytrading.backend.dto.ResourceTypeResponse;
import com.energytrading.backend.dto.UserResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.CentralStorage;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceTypeService {

    private final ResourceTypeRepository resourceTypeRepository;
    private final CentralStorageRepository centralStorageRepository;
    private final PricingRepository pricingRepository;
    private final CompanyResourcesRepository companyResourcesRepository;
    private final CompanyInventoryRepository companyInventoryRepository;
    private final TransactionsRepository transactionsRepository;
    private final TradeOffersRepository tradeOffersRepository;
    private final DispatcherBalanceService dispatcherBalanceService;

    public List<ResourceTypeResponse> getAllResourceTypes(){
        return resourceTypeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ResourceTypeResponse createResourceType(ResourceTypeRequest request, User currentUser){
        System.out.println("Received name: " + request.getName());
        String name = request.getName().trim().toUpperCase().replace(" ", "_");
        System.out.println("Converted name: " + name);

        if(!name.matches("[A-Z0-9_]+")){
            throw new BusinessException("A név csak betűket, számokat és alulvonást tartalmazhat!");
        }

        if(resourceTypeRepository.findByName(name).isPresent()){
            throw new BusinessException("Ez a nyersanyag már létezik!");
        }

        ResourceType resourceType = ResourceType.builder()
                .name(name)
                .unit(request.getUnit())
                .color(request.getColor() != null ? request.getColor() : "#10b981")
                .isActive(true)
                .build();
        ResourceType saved = resourceTypeRepository.save(resourceType);

        // Central storage létrehozása
        CentralStorage centralStorage = CentralStorage.builder()
                .resourceType(saved)
                .quantity(BigDecimal.ZERO)
                .maxQuantity(new BigDecimal("10000"))
                .unit(request.getUnit())
                .build();
        centralStorageRepository.save(centralStorage);

        // Pricing létrehozás
        Pricing pricing = Pricing.builder()
                .resourceType(saved)
                .buyPrice(request.getBuyPrice())
                .sellPrice(request.getSellPrice())
                .setByUser(currentUser)
                .build();
        pricingRepository.save(pricing);

        return mapToResponse(saved);
    }

    public void deleteResourceType(Long id){
        ResourceType resourceType = resourceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found with id: " + id));

        centralStorageRepository.findByResourceType(resourceType)
                .ifPresent(centralStorageRepository::delete);
        pricingRepository.deleteAll(pricingRepository.findByResourceType(resourceType));
        companyResourcesRepository.deleteAll(companyResourcesRepository.findByResourceType(resourceType));
        companyInventoryRepository.deleteAll(companyInventoryRepository.findByResourceType(resourceType));
        transactionsRepository.deleteAll(transactionsRepository.findByResourceType(resourceType));
        tradeOffersRepository.deleteAll(tradeOffersRepository.findByResourceType(resourceType));

        resourceTypeRepository.delete(resourceType);

        dispatcherBalanceService.recalculate();
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
