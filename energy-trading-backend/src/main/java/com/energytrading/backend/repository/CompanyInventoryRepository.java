package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.CompanyInventory;
import com.energytrading.backend.model.CompanyResources;
import com.energytrading.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyInventoryRepository extends JpaRepository<CompanyInventory, Long> {
    Optional<CompanyInventory> findByCompanyAndResourceType(Company company, ResourceType resourceType);
    List<CompanyInventory> findByCompany(Company company);
    List<CompanyInventory> findByResourceType(ResourceType resourceType);
}
