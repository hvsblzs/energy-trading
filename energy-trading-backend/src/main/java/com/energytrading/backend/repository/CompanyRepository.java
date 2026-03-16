package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    @Query("SELECT c FROM Company c WHERE " +
            "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:active IS NULL OR c.isActive = :active)")
    Page<Company> findAllFiltered(
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
