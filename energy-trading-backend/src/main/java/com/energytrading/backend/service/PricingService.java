package com.energytrading.backend.service;

import com.energytrading.backend.dto.PriceHistoryResponse;
import com.energytrading.backend.dto.PricingRequest;
import com.energytrading.backend.dto.PricingResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final PricingRepository pricingRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final DispatcherBalanceService dispatcherBalanceService;

    public PricingResponse getCurrentPrice(String resourceTypeName){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + resourceTypeName));
        Pricing pricing = this.pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("This resource type was not found: " + resourceType));
        return mapToResponse(pricing);
    }

    public List<PricingResponse> getAllCurrentPrices(){
        List<ResourceType> resourceTypes = resourceTypeRepository.findAll();
        return resourceTypes.stream()
                .map(rt -> pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(rt)
                        .map(this::mapToResponse)
                        .orElse(null))
                .filter(p -> p != null)
                .toList();
    }

    public PricingResponse setPrice(PricingRequest request, User currentUser){
        ResourceType resourceType = resourceTypeRepository.findByName(request.getResourceType())
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + request.getResourceType()));

        // Price check
        if(request.getBuyPrice().compareTo(BigDecimal.ZERO) <= 0 || request.getSellPrice().compareTo(BigDecimal.ZERO) <= 0){
            throw new BusinessException("PRICE_MUST_BE_POSITIVE");
        }

        Pricing pricing = Pricing.builder()
                .resourceType(resourceType)
                .buyPrice(request.getBuyPrice())
                .sellPrice(request.getSellPrice())
                .setByUser(currentUser)
                .build();
        Pricing saved = this.pricingRepository.save(pricing);

        dispatcherBalanceService.recalculate();

        return mapToResponse(saved);
    }

    public List<PriceHistoryResponse> getAllPricesForResourceType(String resourceTypeName){
        ResourceType resourceType = resourceTypeRepository.findByName(resourceTypeName)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with this name: " + resourceTypeName));
        List<Pricing> pricings = pricingRepository.findByResourceTypeOrderByCreatedAtAsc(resourceType);
        return pricings.stream()
                .map(this::mapToPriceHistoryResponse)
                .toList();
    }

    public PricingResponse mapToResponse(Pricing pricing){
        PricingResponse response = new PricingResponse();
        response.setId(pricing.getId());
        response.setResourceType(pricing.getResourceType().getName());
        response.setResourceTypeColor(pricing.getResourceType().getColor());
        response.setBuyPrice(pricing.getBuyPrice());
        response.setSellPrice(pricing.getSellPrice());
        response.setSetByUserId(pricing.getSetByUser().getId());
        response.setSetByUserEmail(pricing.getSetByUser().getEmail());
        response.setCreatedAt(pricing.getCreatedAt());
        return response;
    }

    public PriceHistoryResponse mapToPriceHistoryResponse(Pricing pricing){
        PriceHistoryResponse phr = new PriceHistoryResponse();
        phr.setBuyPrice(pricing.getBuyPrice());
        phr.setSellPrice(pricing.getSellPrice());
        phr.setCreatedAt(pricing.getCreatedAt());
        return phr;
    }
}
