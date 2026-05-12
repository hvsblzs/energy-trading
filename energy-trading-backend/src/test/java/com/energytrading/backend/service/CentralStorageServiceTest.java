package com.energytrading.backend.service;

import com.energytrading.backend.dto.CentralStorageRequest;
import com.energytrading.backend.dto.CentralStorageResponse;
import com.energytrading.backend.exception.AccessDeniedException;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CentralStorageRepository;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CentralStorageServiceTest {

    @Mock private CentralStorageRepository centralStorageRepository;
    @Mock private ResourceTypeRepository resourceTypeRepository;
    @Mock private CompanyResourcesRepository companyResourcesRepository;
    @Mock private DispatcherBalanceService dispatcherBalanceService;

    @InjectMocks
    private CentralStorageService centralStorageService;

    private ResourceType resourceType;
    private CentralStorage centralStorage;
    private Company company;
    private User dispatcher;
    private User companyUser;
    private CompanyResources companyResources;

    @BeforeEach
    void setUp() {
        resourceType = ResourceType.builder()
                .id(1L).name("GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        centralStorage = CentralStorage.builder()
                .id(1L).resourceType(resourceType)
                .quantity(new BigDecimal("500.00"))
                .maxQuantity(new BigDecimal("5000.00"))
                .unit("m3")
                .build();

        company = Company.builder()
                .id(1L).name("Test Co").email("test@co.com")
                .creditBalance(new BigDecimal("10000.00")).isActive(true)
                .build();

        dispatcher = User.builder()
                .id(1L).email("dispatcher@test.com").role(Role.DISPATCHER)
                .active(true)
                .build();

        companyUser = User.builder()
                .id(2L).email("user@test.com").role(Role.COMPANY_USER)
                .company(company).active(true)
                .build();

        companyResources = CompanyResources.builder()
                .id(1L).company(company).resourceType(resourceType)
                .build();
    }

    // getStorage tesztek

    @Test
    @DisplayName("getStorage: dispatcher sikeresen lekéri a tárolót")
    void getStorage_dispatcher_success() {
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        CentralStorageResponse response = centralStorageService.getStorage("GAS", dispatcher);

        assertThat(response).isNotNull();
        assertThat(response.getResourceType()).isEqualTo("GAS");
        assertThat(response.getQuantity()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("getStorage: company user jogosultsággal sikeresen lekéri a tárolót")
    void getStorage_companyUser_withPermissions_success() {
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        CentralStorageResponse response = centralStorageService.getStorage("GAS", companyUser);

        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("getStorage: company user jogosultság nélkül -> AccessDeniedException")
    void getStorage_companyUser_withoutPermission_throwsAccessDeniedException() {
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> centralStorageService.getStorage("GAS", companyUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("getStorage: nem létező resource type -> ResourceNotFoundException")
    void getStorage_invalidResourceType_throwsResourceNotFoundException() {
        when(resourceTypeRepository.findByName("INVALID")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> centralStorageService.getStorage("INVALID", dispatcher))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // getAllStorage tesztek

    @Test
    @DisplayName("getAllStorage: dispatcher az összes tárolót látja")
    void getAllStorage_dispatcher_returnsAll() {
        when(centralStorageRepository.findAll()).thenReturn(List.of(centralStorage));

        List<CentralStorageResponse> responses = centralStorageService.getAllStorage(dispatcher);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getResourceType()).isEqualTo("GAS");
    }

    @Test
    @DisplayName("getAllStorage: company user csak a saját nyersanyagait látja")
    void getAllStorage_companyUser_returnsOwnResources() {
        when(companyResourcesRepository.findByCompany(company))
                .thenReturn(List.of(companyResources));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        List<CentralStorageResponse> responses = centralStorageService.getAllStorage(companyUser);

        assertThat(responses).hasSize(1);
        verify(companyResourcesRepository, times(1)).findByCompany(company);
    }

    // updateStorage tesztek

    @Test
    @DisplayName("updateStorage: sikeresen frissíti a tárolót")
    void updateStorage_success() {
        CentralStorageRequest request = new CentralStorageRequest();
        request.setQuantity(new BigDecimal("800.00"));
        request.setMaxQuantity(new BigDecimal("6000.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(centralStorage);

        CentralStorageResponse response = centralStorageService.updateStorage("GAS", request);

        assertThat(response).isNotNull();
        verify(centralStorageRepository, times(1)).save(any(CentralStorage.class));
    }

    // addQuantity tesztek

    @Test
    @DisplayName("addQuantity: sikeresen hozzáad mennyiséget")
    void addQuantity_success() {
        // 500 + 200 = 700, max 5000 -> OK
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(centralStorage);
        doNothing().when(dispatcherBalanceService).recalculate();

        CentralStorageResponse response = centralStorageService.addQuantity("GAS", new BigDecimal("200.00"));

        assertThat(response).isNotNull();
        assertThat(centralStorage.getQuantity()).isEqualByComparingTo("700.00");
        verify(dispatcherBalanceService, times(1)).recalculate();
    }

    @Test
    @DisplayName("addQuantity: nulla vagy negatív mennyiség -> BusinessException")
    void addQuantity_zeroAmount_throwsBusinessException() {
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> centralStorageService.addQuantity("GAS", BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("AMOUNT_MUST_BE_POSITIVE");
    }

    @Test
    @DisplayName("addQuantity: túllépi a max kapacitást -> BusinessException")
    void addQuantity_exceedsMaxCapacity_throwsBusinessException() {
        // 500 + 5000 = 5500, max 5000 -> HIBA
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> centralStorageService.addQuantity("GAS", new BigDecimal("5000.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("EXCEEDS_MAX_CAPACITY");
    }

    // updateMaxQuantity tesztek

    @Test
    @DisplayName("updateMaxQuantity: sikeresen frissíti a max kapacitást")
    void updateMaxQuantity_success() {
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(centralStorage);

        CentralStorageResponse response = centralStorageService.updateMaxQuantity("GAS", new BigDecimal("10000.00"));

        assertThat(response).isNotNull();
        assertThat(centralStorage.getMaxQuantity()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("updateMaxQuantity: új max kisebb mint a jelenlegi mennyiség -> BusinessException")
    void updateMaxQuantity_lessThanCurrent_throwsBusinessException() {
        // Jelenlegi: 500, új max: 100 -> hiba
        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> centralStorageService.updateMaxQuantity("GAS", new BigDecimal("100.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("MAX_LESS_THAN_CURRENT");
    }
}




































