package com.energytrading.backend.service;

import com.energytrading.backend.dto.ResourceTypeRequest;
import com.energytrading.backend.dto.ResourceTypeResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.*;
import org.aspectj.lang.annotation.Before;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResourceTypeServiceTest {

    @Mock private ResourceTypeRepository resourceTypeRepository;
    @Mock private CentralStorageRepository centralStorageRepository;
    @Mock private PricingRepository pricingRepository;
    @Mock private CompanyResourcesRepository companyResourcesRepository;
    @Mock private CompanyInventoryRepository companyInventoryRepository;
    @Mock private TransactionsRepository transactionsRepository;
    @Mock private TradeOffersRepository tradeOffersRepository;
    @Mock private DispatcherBalanceService dispatcherBalanceService;
    @Mock private ResourceTypeKafkaProducer resourceTypeKafkaProducer;

    @InjectMocks
    private ResourceTypeService resourceTypeService;

    private ResourceType resourceType;
    private User dispatcher;

    @BeforeEach
    void setUp() {
        resourceType = ResourceType.builder()
                .id(1L).name("GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        dispatcher = User.builder()
                .id(1L).email("dispatcher@test.com").role(Role.DISPATCHER)
                .active(true)
                .build();
    }

    // getAllResourceTypes tesztek

    @Test
    @DisplayName("getAllResourceTypes: visszaadja az összes nyersanyagtípust")
    void getAllResourceTypes_returnsAll() {
        when(resourceTypeRepository.findAll()).thenReturn(List.of(resourceType));

        List<ResourceTypeResponse> responses = resourceTypeService.getAllResourceTypes();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getName()).isEqualTo("GAS");
        assertThat(responses.get(0).getUnit()).isEqualTo("m3");
    }

    @Test
    @DisplayName("getAllResourceTypes: üres lista esetén üres listát ad vissza")
    void getAllResourceTypes_empty_returnsEmptyList() {
        when(resourceTypeRepository.findAll()).thenReturn(Collections.emptyList());

        List<ResourceTypeResponse> responses = resourceTypeService.getAllResourceTypes();

        assertThat(responses).isEmpty();
    }

    // createResourceType tesztek

    @Test
    @DisplayName("createResourceType: sikeresen létrehozza a nyersanyagtípust")
    void createResourceType_success() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("electricity");
        request.setUnit("kWh");
        request.setColor("#3b82f6");
        request.setBuyPrice(new BigDecimal("50.00"));
        request.setSellPrice(new BigDecimal("45.00"));

        ResourceType savedResourceType = ResourceType.builder()
                .id(2L).name("ELECTRICITY").unit("kWh").color("#3b82f6").isActive(true)
                .build();

        when(resourceTypeRepository.findByName("ELECTRICITY")).thenReturn(Optional.empty());
        when(resourceTypeRepository.save(any(ResourceType.class))).thenReturn(savedResourceType);
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(null);
        when(pricingRepository.save(any(Pricing.class))).thenReturn(null);
        doNothing().when(resourceTypeKafkaProducer).sendCreated(any());

        ResourceTypeResponse response = resourceTypeService.createResourceType(request, dispatcher);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("ELECTRICITY");
        verify(resourceTypeRepository, times(1)).save(any(ResourceType.class));
        verify(centralStorageRepository, times(1)).save(any(CentralStorage.class));
        verify(pricingRepository, times(1)).save(any(Pricing.class));
        verify(resourceTypeKafkaProducer, times(1)).sendCreated(any());
    }

    @Test
    @DisplayName("createResourceType: név nagybetűssé és underscore-ra konvertálódik")
    void createResourceType_nameConverted_toUpperCaseWithUnderscore() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("natural gas");
        request.setUnit("m3");
        request.setColor("#10b981");
        request.setBuyPrice(new BigDecimal("100.00"));
        request.setSellPrice(new BigDecimal("90.00"));

        ResourceType savedResourceType = ResourceType.builder()
                .id(2L).name("NATURAL_GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        when(resourceTypeRepository.findByName("NATURAL_GAS")).thenReturn(Optional.empty());
        when(resourceTypeRepository.save(any(ResourceType.class))).thenReturn(savedResourceType);
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(null);
        when(pricingRepository.save(any(Pricing.class))).thenReturn(null);
        doNothing().when(resourceTypeKafkaProducer).sendCreated(any());

        ResourceTypeResponse response = resourceTypeService.createResourceType(request, dispatcher);

        assertThat(response.getName()).isEqualTo("NATURAL_GAS");
    }

    @Test
    @DisplayName("createResource: már létező név -> BusinessException")
    void createResourceType_alreadyExists_throwsBusinessException() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("GAS");
        request.setUnit("m3");
        request.setBuyPrice(new BigDecimal("100.00"));
        request.setSellPrice(new BigDecimal("90.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));

        assertThatThrownBy(() -> resourceTypeService.createResourceType(request, dispatcher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RESOURCE_ALREADY_EXISTS");
    }

    @Test
    @DisplayName("createResourceType: érvénytelen név -> BusinessException")
    void createResourceType_invalidName_throwsBusinessException() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("gas@#!");
        request.setUnit("m3");
        request.setBuyPrice(new BigDecimal("100.00"));
        request.setSellPrice(new BigDecimal("90.00"));

        assertThatThrownBy(() -> resourceTypeService.createResourceType(request, dispatcher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("INVALID_RESOURCE_NAME");
    }

    @Test
    @DisplayName("createResourceType: null color esetén default color kerül beállításra")
    void createResourceType_nullColor_setsDefaultColor() {
        ResourceTypeRequest request = new ResourceTypeRequest();
        request.setName("WATER");
        request.setUnit("L");
        request.setColor(null);
        request.setBuyPrice(new BigDecimal("10.00"));
        request.setSellPrice(new BigDecimal("8.00"));

        ResourceType savedResourceType = ResourceType.builder()
                .id(2L).name("WATER").unit("L").color("#10b981").isActive(true)
                .build();

        when(resourceTypeRepository.findByName("WATER")).thenReturn(Optional.empty());
        when(resourceTypeRepository.save(any(ResourceType.class))).thenReturn(savedResourceType);
        when(centralStorageRepository.save(any(CentralStorage.class))).thenReturn(null);
        when(pricingRepository.save(any(Pricing.class))).thenReturn(null);
        doNothing().when(resourceTypeKafkaProducer).sendCreated(any());

        ResourceTypeResponse response = resourceTypeService.createResourceType(request, dispatcher);

        assertThat(response.getColor()).isEqualTo("#10b981");
    }

    // deleteResourceType tesztek

    @Test
    @DisplayName("deleteResourceType: sikeresen törli a nyersanyagtípust és minden kapcsolódó adatot")
    void deleteResourceType_success() {
        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType)).thenReturn(Optional.empty());
        when(pricingRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(companyResourcesRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(companyInventoryRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(transactionsRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(tradeOffersRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        doNothing().when(resourceTypeKafkaProducer).sendDeleted(any());
        doNothing().when(dispatcherBalanceService).recalculate();

        resourceTypeService.deleteResourceType(1L);

        verify(resourceTypeRepository, times(1)).delete(resourceType);
        verify(resourceTypeKafkaProducer, times(1)).sendDeleted(resourceType);
        verify(dispatcherBalanceService, times(1)).recalculate();
    }

    @Test
    @DisplayName("deleteResourceType: törli a central storage-t is ha létezik")
    void deleteResourceType_deletesRelatedCentralStorage() {
        CentralStorage centralStorage = CentralStorage.builder()
                .id(1L).resourceType(resourceType)
                .quantity(BigDecimal.ZERO)
                .maxQuantity(new BigDecimal("10000"))
                .unit("m3")
                .build();

        when(resourceTypeRepository.findById(1L)).thenReturn(Optional.of(resourceType));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(pricingRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(companyResourcesRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(companyInventoryRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(transactionsRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        when(tradeOffersRepository.findByResourceType(resourceType)).thenReturn(Collections.emptyList());
        doNothing().when(resourceTypeKafkaProducer).sendDeleted(any());
        doNothing().when(dispatcherBalanceService).recalculate();

        resourceTypeService.deleteResourceType(1L);

        verify(centralStorageRepository, times(1)).delete(centralStorage);
    }

    @Test
    @DisplayName("deleteResourceType: nem létező id -> ResourceNotFoundException")
    void deleteResourceType_notFound_throwsResourceNotFoundException() {
        when(resourceTypeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceTypeService.deleteResourceType(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}




































