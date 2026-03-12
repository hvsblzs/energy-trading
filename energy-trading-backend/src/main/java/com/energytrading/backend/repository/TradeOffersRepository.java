package com.energytrading.backend.repository;

import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TradeOffersRepository extends JpaRepository<TradeOffers, Long> {
    List<TradeOffers> findByCompany(Company company);
    List<TradeOffers> findByStatus(Status status);
    List<TradeOffers> findByResourceType(ResourceType resourceType);
}
