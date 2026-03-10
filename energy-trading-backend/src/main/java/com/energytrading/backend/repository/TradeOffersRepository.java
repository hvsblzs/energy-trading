package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.TradeOffers;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TradeOffersRepository extends JpaRepository<TradeOffers, Long> {
    List<TradeOffers> findByCompany(Company company);
    List<TradeOffers> findByStatus(Status status);
}
