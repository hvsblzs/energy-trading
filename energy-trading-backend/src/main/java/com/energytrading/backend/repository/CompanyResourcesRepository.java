package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.CompanyResources;
import com.energytrading.backend.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyResourcesRepository extends JpaRepository<CompanyResources, Long> {
    Optional<CompanyResources> findByCompanyAndResourceType(Company company, ResourceType resourceType);
    List<CompanyResources> findByCompany(Company company);
    List<CompanyResources> findByCompanyAndIsActiveTrue(Company company);
}
