package com.energytrading.backend.service;

import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.CentralStorage;
import com.energytrading.backend.model.Pricing;
import com.energytrading.backend.model.ResourceType;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CentralStorageRepository;
import com.energytrading.backend.repository.PricingRepository;
import com.energytrading.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.platform.commons.io.Resource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DispatcherBalanceServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CentralStorageRepository centralStorageRepository;
    @Mock private PricingRepository pricingRepository;
    @Mock private WebSocketService webSocketService;

    @InjectMocks
    private DispatcherBalanceService dispatcherBalanceService;

    private User dispatcher;
    private ResourceType resourceType;
    private CentralStorage centralStorage;
    private Pricing pricing;

    @BeforeEach
    void setUp() {
        dispatcher = User.builder()
                .id(1L).email("dispatcher@test.com").role(Role.DISPATCHER)
                .creditBalance(BigDecimal.ZERO).active(true)
                .build();

        resourceType = ResourceType.builder()
                .id(1L).name("GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        centralStorage = CentralStorage.builder()
                .id(1L).resourceType(resourceType)
                .quantity(new BigDecimal("100.00"))
                .maxQuantity(new BigDecimal("5000.00"))
                .unit("m3")
                .build();

        pricing = Pricing.builder()
                .id(1L).resourceType(resourceType)
                .buyPrice(new BigDecimal("50.00"))
                .sellPrice(new BigDecimal("45.00"))
                .setByUser(dispatcher)
                .build();
        pricing.setCreatedAt(LocalDateTime.now());
    }

    // recalculate tesztek

    @Test
    @DisplayName("recalculate: helyesen számolja ki a dispatcher egyenlegét")
    void recalculate_correctlyCalculatesBalance() {
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findAll()).thenReturn(List.of(centralStorage));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.of(pricing));
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());

        dispatcherBalanceService.recalculate();

        assertThat(dispatcher.getCreditBalance()).isEqualByComparingTo("5000.00");
        verify(userRepository, times(1)).save(dispatcher);
        verify(webSocketService, times(1)).sendDispatcherCreditUpdate(eq(1L), any());
    }

    @Test
    @DisplayName("recalculate: több nyersanyag esetén összeadja az értékeket")
    void recalculate_multipleStorageItems_sumsValues() {
        // 2. nyersanyag
        ResourceType resourceType2 = ResourceType.builder()
                .id(2L).name("ELECTRICITY").unit("kWh").color("#3b82f6").isActive(true)
                .build();

        CentralStorage centralStorage2 = CentralStorage.builder()
                .id(2L).resourceType(resourceType2)
                .quantity(new BigDecimal("200.00"))
                .maxQuantity(new BigDecimal("10000.00"))
                .unit("kWh")
                .build();

        Pricing pricing2 = Pricing.builder()
                .id(2L).resourceType(resourceType2)
                .buyPrice(new BigDecimal("10.00"))
                .sellPrice(new BigDecimal("8.00"))
                .setByUser(dispatcher)
                .build();
        pricing2.setCreatedAt(LocalDateTime.now());

        // GAS: 100 * 50 -> 5000
        // ELECTRICITY: 200 * 10 -> 2000
        // Összesen: 7000
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findAll()).thenReturn(List.of(centralStorage, centralStorage2));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.of(pricing));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType2))
                .thenReturn(Optional.of(pricing2));
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());

        dispatcherBalanceService.recalculate();

        assertThat(dispatcher.getCreditBalance()).isEqualByComparingTo("7000.00");
    }

    @Test
    @DisplayName("recalculate: ha nincs ár egy nyersanyaghoz, kihagyja a számításból")
    void recalculate_missingPrice_skipsStorageItem() {
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findAll()).thenReturn(List.of(centralStorage));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());

        dispatcherBalanceService.recalculate();

        assertThat(dispatcher.getCreditBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("recalculate: üres raktár esetén egyenleg 0")
    void recalculate_emptyStorage_setsBalanceToZero() {
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findAll()).thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());

        dispatcherBalanceService.recalculate();

        assertThat(dispatcher.getCreditBalance()).isEqualByComparingTo("0.00");
        verify(webSocketService, times(1)).sendDispatcherCreditUpdate(any(), any());
    }

    @Test
    @DisplayName("recalculate: nincs dispatcher -> ResourceNotFoundException")
    void recalculate_noDispatcher_throwsResourceNotFoundException() {
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dispatcherBalanceService.recalculate())
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No dispatcher found!");
    }

    @Test
    @DisplayName("recalculate: WebSocket üzenet elküldése helyes adatokkal")
    void recalculate_sendsWebSocketUpdate() {
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findAll()).thenReturn(List.of(centralStorage));
        when(pricingRepository.findTopByResourceTypeOrderByCreatedAtDesc(resourceType))
                .thenReturn(Optional.of(pricing));
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());

        dispatcherBalanceService.recalculate();

        verify(webSocketService, times(1)).sendDispatcherCreditUpdate(
                eq(dispatcher.getId()),
                any(Map.class)
        );
    }
}
































