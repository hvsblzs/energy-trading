package com.energytrading.backend.repository;

import com.energytrading.backend.model.CentralStorage;
import com.energytrading.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CentralStorageRepository extends JpaRepository<CentralStorage, Long> {
    Optional<CentralStorage> findByResourceType(ResourceType resourceType);
}
