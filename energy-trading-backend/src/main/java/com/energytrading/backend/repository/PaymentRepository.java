package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.Payment;
import com.energytrading.backend.model.TradeOffers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCompany(Company company);
}
