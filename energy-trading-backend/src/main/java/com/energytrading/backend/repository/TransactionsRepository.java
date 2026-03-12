package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.CompanyResources;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionsRepository extends JpaRepository<Transactions, Long> {
    List<Transactions> findTop20ByOrderByCreatedAtDesc();
    List<Transactions> findByCreatedAtAfter(LocalDateTime date);
    List<Transactions> findByCompany(Company company);
    List<Transactions> findByResourceType(ResourceType resourceType);
}
