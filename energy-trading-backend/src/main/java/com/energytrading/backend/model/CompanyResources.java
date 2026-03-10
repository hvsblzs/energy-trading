package com.energytrading.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "company_resources", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "resource_type"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResources {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @Column(nullable = false)
    private boolean isActive;
}
