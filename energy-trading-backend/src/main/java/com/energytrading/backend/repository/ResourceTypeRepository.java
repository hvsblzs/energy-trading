package com.energytrading.backend.repository;

import com.energytrading.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResourceTypeRepository extends JpaRepository<ResourceType, Long> {
    Optional<ResourceType> findByName(String name);
}
