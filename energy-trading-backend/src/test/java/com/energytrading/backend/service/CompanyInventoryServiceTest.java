package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyInventoryResponse;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CompanyInventoryRepository;
import com.energytrading.backend.repository.CompanyResourcesRepository;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CompanyInventoryServiceTest {

    @Mock private CompanyInventoryRepository companyInventoryRepository;
    @Mock private CompanyResourcesRepository companyResourcesRepository;

    @InjectMocks
    private CompanyInventoryService companyInventoryService;

    private Company company;
    private User companyUser;
    private ResourceType resourceType;
    private CompanyInventory companyInventory;
    private CompanyResources companyResources;

    @BeforeEach
    void setUp() {
        resourceType = ResourceType.builder()
                .id(1L).name("GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        company = Company.builder()
                .id(1L).name("Test Co").email("test@co.com")
                .creditBalance(new BigDecimal("10000.00")).isActive(true)
                .build();

        companyUser = User.builder()
                .id(1L).email("user@test.com").role(Role.COMPANY_USER)
                .company(company).active(true)
                .build();

        companyInventory = CompanyInventory.builder()
                .id(1L).company(company).resourceType(resourceType)
                .quantity(new BigDecimal("200.00"))
                .build();

        companyResources = CompanyResources.builder()
                .id(1L).company(company).resourceType(resourceType)
                .isActive(true)
                .build();
    }

    // getMyInventory tesztek

    @Test
    @DisplayName("getMyInventory: visszaadja a cég készletét aktív resource-szal")
    void getMyInventory_withActiveResource_returnsInventory() {
        when(companyInventoryRepository.findByCompany(company))
                .thenReturn(List.of(companyInventory));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));

        List<CompanyInventoryResponse> responses = companyInventoryService.getMyInventory(companyUser);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getResourceTypeName()).isEqualTo("GAS");
        assertThat(responses.get(0).getQuantity()).isEqualByComparingTo("200.00");
        assertThat(responses.get(0).isActive()).isTrue();
    }

    @Test
    @DisplayName("getMyInventory: inaktív resource-nál active=false")
    void getMyInventory_withInactiveResource_returnsInactive() {
        companyResources.setActive(false);
        when(companyInventoryRepository.findByCompany(company))
                .thenReturn(List.of(companyInventory));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));

        List<CompanyInventoryResponse> responses = companyInventoryService.getMyInventory(companyUser);

        assertThat(responses.get(0).isActive()).isFalse();
    }

    @Test
    @DisplayName("getMyInventory: ha nincs CompanyResources rekord, active=false")
    void getMyInventory_withNoCompanyResources_returnsInactive() {
        when(companyInventoryRepository.findByCompany(company))
                .thenReturn(List.of(companyInventory));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());

        List<CompanyInventoryResponse> responses = companyInventoryService.getMyInventory(companyUser);

        assertThat(responses.get(0).isActive()).isFalse();
    }

    @Test
    @DisplayName("getMyInventory: üres készlet esetén üres listát ad vissza")
    void getMyInventory_emptyInventory_returnsEmptyList() {
        when(companyInventoryRepository.findByCompany(company))
                .thenReturn(Collections.emptyList());

        List<CompanyInventoryResponse> responses = companyInventoryService.getMyInventory(companyUser);

        assertThat(responses).isEmpty();
        verify(companyInventoryRepository, times(1)).findByCompany(company);
    }

    @Test
    @DisplayName("getMyInventory: több készletelem esetén mindegyiket visszaadja")
    void getMyInventory_multipleItems_returnsAll() {
        ResourceType resourceType2 = ResourceType.builder()
                .id(2L).name("ELECTRICITY").unit("kWh").color("#3b82f6").isActive(true)
                .build();

        CompanyInventory companyInventory2 = CompanyInventory.builder()
                .id(2L).company(company).resourceType(resourceType2)
                .quantity(new BigDecimal("500.00"))
                .build();

        CompanyResources companyResources2 = CompanyResources.builder()
                .id(2L).company(company).resourceType(resourceType2)
                .isActive(true)
                .build();

        when(companyInventoryRepository.findByCompany(company))
                .thenReturn(List.of(companyInventory, companyInventory2));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType2))
                .thenReturn(Optional.of(companyResources2));

        List<CompanyInventoryResponse> responses = companyInventoryService.getMyInventory(companyUser);

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(CompanyInventoryResponse::getResourceTypeName)
                .containsExactlyInAnyOrder("GAS", "ELECTRICITY");
    }
}




































