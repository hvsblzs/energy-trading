package com.energytrading.backend.listener;

import com.energytrading.backend.service.ResourceTypeKafkaProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResourceTypeRequestListener {

    private final ResourceTypeKafkaProducer resourceTypeKafkaProducer;

    @KafkaListener(
            topics = "${kafka.topic.resource-types-request}",
            groupId = "main-app-request-group"
    )
    public void handleResourceTypeRequest(String message) {
        log.info("Resource type list requested by: {}", message);
        resourceTypeKafkaProducer.sendAllResourceTypes();
    }
}

