package com.energytrading.backend.service;

import com.energytrading.backend.dto.PricingRequest;
import com.energytrading.backend.dto.PricingResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.ResourceTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.parameters.P;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PricingServiceTest {

    @Mock
    private PricingRepository pricingRepository;

    @Mock
    private ResourceTypeRepository resourceTypeRepository;

    @Mock
    private DispatcherBalanceService dispatcherBalanceService;

    @InjectMocks
    private PricingService pricingService;

    private ResourceType resourceType;
    private User dispatcher;
    private Pricing pricing;

    @BeforeEach
    void setUp() {
        resourceType = ResourceType.builder()
                .id(1L)
                .name("GAS")
                .unit("m3")
                .color("#10b981")
                .isActive(true)
                .build();

        dispatcher = User.builder()
                .id(1L)
                .email("dispatcher@test.com")
                .role(Role.DISPATCHER)
                .active(true)
                .build();

        pricing = Pricing.builder()
                .id(1L)
                .resourceType(resourceType)
                .buyPrice(new BigDecimal("100.00"))
                .sellPrice(new BigDecimal("90.00"))
                .setByUser(dispatcher)
                .build();

        pricing.setCreatedAt(LocalDateTime.now());
    }

    // getCurrentPrice tesztek

    @Test
    @DisplayName("getCurrentPrice: valid resource type-ra visszaadja az árat")
    void getCurrentPrice_validResourceType_returnsPrice() {
        when(resourceTypeRepository.findByName("GAS"))
                .thenReturn(Optional.of(resourceType));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.of(pricing));

        PricingResponse response = pricingService.getCurrentPrice("GAS");

        assertThat(response).isNotNull();
        assertThat(response.getResourceType()).isEqualTo("GAS");
        assertThat(response.getBuyPrice()).isEqualByComparingTo("100.00");
        assertThat(response.getSellPrice()).isEqualByComparingTo("90.00");
    }

    @Test
    @DisplayName("getCurrentPrice: nem létező resource type-ra ResourceNotFoundException-t dob")
    void getCurrentPrice_invalidResourceType_throwsResourceNotFoundException() {
        when(resourceTypeRepository.findByName("INVALID"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> pricingService.getCurrentPrice("INVALID"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("INVALID");
    }

    @Test
    @DisplayName("getCurrentPrice: létező resource type de nincs ár -> ResourceNotFoundException")
    void getCurrentPrice_noPrice_throwsResourceNotFoundException() {
        when(resourceTypeRepository.findByName("GAS"))
                .thenReturn(Optional.of(resourceType));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> pricingService.getCurrentPrice("GAS"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // setPrice tesztek

    @Test
    @DisplayName("setPrice: valid kérésre elmenti az árat és visszaadja a response-t")
    void setPrice_validRequest_savesAndReturnsResponse() {
        PricingRequest request = new PricingRequest();
        request.setResourceType("GAS");
        request.setBuyPrice(new BigDecimal("150.00"));
        request.setSellPrice(new BigDecimal("120.00"));

        when(resourceTypeRepository.findByName("GAS"))
                .thenReturn(Optional.of(resourceType));
        when(pricingRepository.save(any(Pricing.class)))
                .thenReturn(pricing);
        doNothing().when(dispatcherBalanceService).recalculate();

        PricingResponse response = pricingService.setPrice(request, dispatcher);

        assertThat(response).isNotNull();
        verify(pricingRepository, times(1)).save(any(Pricing.class));
        verify(dispatcherBalanceService, times(1)).recalculate();
    }

    @Test
    @DisplayName("setPrice: negatív buyPrice-ra BusinessException-t dob")
    void setPrice_negativeBuyPrice_throwsBusinessException() {
        PricingRequest request = new PricingRequest();
        request.setResourceType("GAS");
        request.setBuyPrice(new BigDecimal("-10.00"));
        request.setSellPrice(new BigDecimal("90.00"));

        when(resourceTypeRepository.findByName("GAS"))
                .thenReturn(Optional.of(resourceType));

        assertThatThrownBy(() -> pricingService.setPrice(request, dispatcher))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PRICE_MUST_BE_POSITIVE");
    }

    @Test
    @DisplayName("setPrice: nulla buyPrice-ra BusinessException-t dob")
    void setPrice_zeroBuyPrice_throwsBusinessException() {
        PricingRequest request = new PricingRequest();
        request.setResourceType("GAS");
        request.setBuyPrice(BigDecimal.ZERO);
        request.setSellPrice(new BigDecimal("90.00"));

        when(resourceTypeRepository.findByName("GAS"))
                .thenReturn(Optional.of(resourceType));

        assertThatThrownBy(() -> pricingService.setPrice(request, dispatcher))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("setPrice: nem létező resource type-ra ResourceNotFoundException-t dob")
    void setPrice_invalidResourceType_throwsResourceNotFoundException() {
        PricingRequest request = new PricingRequest();
        request.setResourceType("INVALID");
        request.setBuyPrice(new BigDecimal("100.00"));
        request.setSellPrice(new BigDecimal("90.00"));

        when(resourceTypeRepository.findByName("INVALID"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> pricingService.setPrice(request, dispatcher))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // getAllCurrentPrices tesztek

    @Test
    @DisplayName("getAllCurrentPrices: visszaadja az összes resource type aktuális árát")
    void getAllCurrentPrices_returnsAllPrices() {
        when(resourceTypeRepository.findAll())
                .thenReturn(List.of(resourceType));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.of(pricing));

        List<PricingResponse> responses = pricingService.getAllCurrentPrices();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getResourceType()).isEqualTo("GAS");
    }

    @Test
    @DisplayName("getAllCurrentPrices: ha nincs ár egy resource type-hoz, kihagyja")
    void getAllCurrentPrices_skipsMissingPrices() {
        when(resourceTypeRepository.findAll())
                .thenReturn(List.of(resourceType));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.empty());

        List<PricingResponse> responses = pricingService.getAllCurrentPrices();

        assertThat(responses).isEmpty();
    }
}
























