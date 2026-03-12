package com.energytrading.backend.service;

import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.CentralStorage;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CentralStorageRepository;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DispatcherBalanceService {

    private final UserRepository userRepository;
    private final CentralStorageRepository centralStorageRepository;
    private final PricingRepository pricingRepository;
    private final WebSocketService webSocketService;

    public void recalculate(){
        User dispatcher = userRepository.findFirstByRole(Role.DISPATCHER)
                .orElseThrow(() -> new ResourceNotFoundException("No dispatcher found!"));

        List<CentralStorage> storageItems = centralStorageRepository.findAll();
        BigDecimal totalValue = BigDecimal.ZERO;

        for(CentralStorage storage : storageItems){
            Optional<Pricing> pricing = pricingRepository
                    .findTopByResourceTypeOrderByCreatedAtDesc(storage.getResourceType());
            if(pricing.isPresent()){
                totalValue = totalValue.add(storage.getQuantity().multiply(pricing.get().getBuyPrice()));
            }
        }

        dispatcher.setCreditBalance(totalValue);
        userRepository.save(dispatcher);

        webSocketService.sendCreditUpdate(dispatcher.getId(), Map.of("creditBalance", dispatcher.getCreditBalance()));
    }
}
