package com.energytrading.backend.repository;

import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.OfferType;
import com.energytrading.backend.model.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TradeOffersRepository extends JpaRepository<TradeOffers, Long> {
    List<TradeOffers> findByCompany(Company company);
    List<TradeOffers> findByStatus(Status status);
    List<TradeOffers> findByResourceType(ResourceType resourceType);
    @Query("""
    SELECT t FROM TradeOffers t
    WHERE (:companyId IS NULL OR t.company.id = :companyId)
    AND (:status IS NULL OR t.status = :status)
    AND (:offerType IS NULL OR t.offerType = :offerType)
    AND (:resourceType IS NULL OR LOWER(t.resourceType.name) LIKE LOWER(CONCAT('%', :resourceType, '%')))
    AND (:search IS NULL OR LOWER(t.company.name) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<TradeOffers> findHistory(
            @Param("companyId") Long companyId,
            @Param("status") Status status,
            @Param("offerType") OfferType offerType,
            @Param("resourceType") String resourceType,
            @Param("search") String search,
            Pageable pageable
    );
}
