package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyResourcesResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CompanyInventoryRepository;
import com.energytrading.backend.repository.CompanyRepository;
import com.energytrading.backend.repository.CompanyResourcesRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CompanyResourcesServiceTest {

    @Mock private CompanyResourcesRepository companyResourcesRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ResourceTypeRepository resourceTypeRepository;
    @Mock private CompanyInventoryRepository companyInventoryRepository;

    @InjectMocks
    private CompanyResourcesService companyResourcesService;

    private Company company;
    private User companyUser;
    private ResourceType resourceType;
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

        companyResources = CompanyResources.builder()
                .id(1L).company(company).resourceType(resourceType)
                .isActive(true)
                .build();
    }

    // getMyResources tesztek

    @Test
    @DisplayName("getMyResources: visszaadja a cég aktív nyersanyagait")
    void getMyResources_returnsActiveResources() {
        when(companyResourcesRepository.findByCompanyAndIsActiveTrue(company))
                .thenReturn(List.of(companyResources));

        List<CompanyResourcesResponse> responses = companyResourcesService.getMyResources(companyUser);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getResourceTypeName()).isEqualTo("GAS");
        assertThat(responses.get(0).isActive()).isTrue();
    }

    @Test
    @DisplayName("getMyResources: üres lista esetén üres listát ad vissza")
    void getMyResources_empty_returnsEmptyList() {
        when(companyResourcesRepository.findByCompanyAndIsActiveTrue(company))
                .thenReturn(Collections.emptyList());

        List<CompanyResourcesResponse> responses = companyResourcesService.getMyResources(companyUser);

        assertThat(responses).isEmpty();
    }

    // getResourcesByCompany tesztek

    @Test
    @DisplayName("getResourcesByCompany: visszaadja a cég összes nyersanyagát")
    void getResourcesByCompany_returnsAll() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(companyResourcesRepository.findByCompany(company))
                .thenReturn(List.of(companyResources));

        List<CompanyResourcesResponse> responses = companyResourcesService.getResourcesByCompany(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getResourceTypeName()).isEqualTo("GAS");
    }

    @Test
    @DisplayName("getResourcesByCompany: nem létező cég -> ResourceNotFoundException")
    void getResourcesByCompany_companyNotFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyResourcesService.getResourcesByCompany(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // addResource tesztek

    @Test
    @DisplayName("addResource: sikeresen hozzárendeli a nyersanyagot a céghez")
    void addResource_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());
        when(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());

        companyResourcesService.addResource(1L, 1L);

        verify(companyResourcesRepository, times(1)).save(any(CompanyResources.class));
        verify(companyInventoryRepository, times(1)).save(any(CompanyInventory.class));
    }

    @Test
    @DisplayName("addResource: már hozzárendelt nyersanyag -> BusinessException")
    void addResource_alreadyAssigned_throwsBusinessException() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));

        assertThatThrownBy(() -> companyResourcesService.addResource(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RESOURCE_ALREADY_ASSIGNED");
    }

    @Test
    @DisplayName("addResource: ha már van inventory rekord, nem hoz létre újat")
    void addResource_existingInventory_doesNotCreateInventory() {
        CompanyInventory existingInventory = CompanyInventory.builder()
                .id(1L).company(company).resourceType(resourceType)
                .quantity(BigDecimal.ZERO)
                .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());
        when(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(existingInventory));

        companyResourcesService.addResource(1L, 1L);

        verify(companyResourcesRepository, times(1)).save(any(CompanyResources.class));
        verify(companyInventoryRepository, never()).save(any(CompanyInventory.class));
    }

    @Test
    @DisplayName("addResource: nem létező cég -> ResourceNotFoundException")
    void addResource_companyNotFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyResourcesService.addResource(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("addResource: nem létező resource type ->  ResourceNotFoundException")
    void addResource_resourceTypeNotFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyResourcesService.addResource(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // removeResource tesztek

    @Test
    @DisplayName("removeResource: sikeresen eltávolítja a nyersanyagot a cégtől")
    void removeResource_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));

        companyResourcesService.removeResource(1L, 1L);

        verify(companyResourcesRepository, times(1)).delete(companyResources);
    }

    @Test
    @DisplayName("removeResource: nem hozzárendelt nyersanyag -> ResourceNotFoundException")
    void removeResource_notAssigned_throwsResourceNotFoundException() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyResourcesService.removeResource(1L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("removeResource: nem létező cég -> ResourceNotFoundException")
    void removeResource_companyNotFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyResourcesService.removeResource(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}



































