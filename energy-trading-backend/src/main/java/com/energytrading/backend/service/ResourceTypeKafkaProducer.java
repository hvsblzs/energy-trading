package com.energytrading.backend.service;

import com.energytrading.backend.dto.kafka.ResourceTypeMessage;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceTypeKafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ResourceTypeRepository resourceTypeRepository;
    private final PricingRepository pricingRepository;
    private final ObjectMapper objectMapper;

    @Value("${kafka.topic.resource-types}")
    private String resourceTypesTopic;

    // Induláskor az összes nyersanyagot elküldi
    public void sendAllResourceTypes() {
        List<ResourceType> all = resourceTypeRepository.findAll();
        sendMessage("INIT", all);
        log.info("Sent INIT resource types to Kafka: {} items", all.size());
    }

    // Új nyersanyag létrehozáskor hívódik
    public void sendCreated(ResourceType resourceType) {
        sendMessage("CREATED", List.of(resourceType));
        log.info("Sent CREATED resource type to Kafka: {}", resourceType.getName());
    }

    // Törléskor hívódik
    public void sendDeleted(ResourceType resourceType) {
        sendMessage("DELETED", List.of(resourceType));
        log.info("Sent DELETED resource type to Kafka: {}", resourceType.getName());
    }

    private void sendMessage(String action, List<ResourceType> resourceTypes) {
        List<ResourceTypeMessage.ResourceTypeInfo> infos = resourceTypes.stream()
                .map(rt -> {
                    BigDecimal buyPrice = pricingRepository
                            .findTopByResourceTypeOrderByCreatedAtDesc(rt)
                            .map(p -> p.getBuyPrice())
                            .orElse(BigDecimal.ZERO);

                    BigDecimal sellPrice = pricingRepository
                            .findTopByResourceTypeOrderByCreatedAtDesc(rt)
                            .map(p -> p.getSellPrice())
                            .orElse(BigDecimal.ZERO);

                    return ResourceTypeMessage.ResourceTypeInfo.builder()
                            .id(rt.getId())
                            .name(rt.getName())
                            .unit(rt.getUnit())
                            .color(rt.getColor())
                            .active(rt.isActive())
                            .currentBuyPrice(buyPrice)
                            .currentSellPrice(sellPrice)
                            .build();
                })
                .toList();

        ResourceTypeMessage message = ResourceTypeMessage.builder()
                .action(action)
                .resourceTypes(infos)
                .build();

        try {
            String json = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(resourceTypesTopic, action, json);
        } catch (Exception e) {
            log.error("Failed to send resource type message to Kafka: {}", e.getMessage());
        }
    }
}
