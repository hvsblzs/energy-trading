package com.energytrading.backend.listener;

import com.energytrading.backend.service.ResourceTypeKafkaProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationStartupListener {

    private final ResourceTypeKafkaProducer resourceTypeKafkaProducer;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Application ready - sending initial resource types to Kafka...");
        resourceTypeKafkaProducer.sendAllResourceTypes();
    }
}
