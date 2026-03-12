package com.energytrading.backend.repository;

import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PricingRepository extends JpaRepository<Pricing, Long> {
    Optional<Pricing> findTopByResourceTypeOrderByCreatedAtDesc(ResourceType resourceType);
    List<Pricing> findByResourceType(ResourceType resourceType);
}
