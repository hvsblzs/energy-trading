package com.energytrading.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "company_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "resource_type"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;
}
