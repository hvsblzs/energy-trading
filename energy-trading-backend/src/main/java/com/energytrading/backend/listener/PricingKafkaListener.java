package com.energytrading.backend.listener;

import com.energytrading.backend.dto.kafka.PriceChangeMessage;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import com.energytrading.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class PricingKafkaListener {

    private final PricingRepository pricingRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    @KafkaListener(
            topics = "${kafka.topic.pricing-changes}",
            groupId = "main-app-group"
    )
    public void handlePriceChange(String rawMessage) {
        try{
            PriceChangeMessage message = objectMapper.readValue(
                    rawMessage, PriceChangeMessage.class
            );

            if (message.getBuyPrice().compareTo(BigDecimal.ZERO) <= 0 ||
                message.getSellPrice().compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("Rejected price change. Prices must be positive. Resource={}",
                        message.getResourceType());
                return;
            }

            ResourceType resourceType = resourceTypeRepository
                    .findByName(message.getResourceType())
                    .orElse(null);

            if (resourceType == null) {
                log.warn("Rejected price change. Unknown resource type={}",
                        message.getResourceType());
                return;
            }

            User systemUser = userRepository.findByEmail("system@internal")
                    .orElseThrow(() -> new RuntimeException("System user not found"));

            Pricing pricing = Pricing.builder()
                    .resourceType(resourceType)
                    .buyPrice(message.getBuyPrice())
                    .sellPrice(message.getSellPrice())
                    .setByUser(systemUser)
                    .build();

            pricingRepository.save(pricing);

            log.info("Price updated from Kafka. Resource={} Buy={} Sell={}",
                    message.getResourceType(),
                    message.getBuyPrice(),
                    message.getSellPrice());

        } catch (Exception e){
            log.error("Failed to process price change message: {}", e.getMessage());
        }
    }
}
