package com.energytrading.backend.service;

import com.energytrading.backend.dto.PricingResponse;
import com.energytrading.backend.dto.TradeOfferRequest;
import com.energytrading.backend.dto.TradeOfferResponse;
import com.energytrading.backend.exception.AccessDeniedException;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.OfferType;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.model.enums.Status;
import com.energytrading.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TradeOfferServiceTest {

    @Mock private TradeOffersRepository tradeOffersRepository;
    @Mock private PricingService pricingService;
    @Mock private ResourceTypeRepository resourceTypeRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CentralStorageRepository centralStorageRepository;
    @Mock private CompanyInventoryRepository companyInventoryRepository;
    @Mock private TransactionsRepository transactionRepository;
    @Mock private CreditTransactionRepository creditTransactionRepository;
    @Mock private CompanyResourcesRepository companyResourcesRepository;
    @Mock private UserRepository userRepository;
    @Mock private WebSocketService webSocketService;

    @InjectMocks
    private TradeOfferService tradeOfferService;

    private ResourceType resourceType;
    private Company company;
    private User companyUser;
    private User dispatcher;
    private CentralStorage centralStorage;
    private CompanyInventory companyInventory;
    private CompanyResources companyResources;
    private PricingResponse pricingResponse;
    private TradeOffers pendingBuyOffer;
    private TradeOffers pendingSellOffer;

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
                .id(2L).email("user@test.com").role(Role.COMPANY_USER)
                .company(company).active(true)
                .build();

        dispatcher = User.builder()
                .id(1L).email("dispatcher@test.com").role(Role.DISPATCHER)
                .creditBalance(new BigDecimal("5000.00")).active(true)
                .build();

        centralStorage = CentralStorage.builder()
                .id(1L).resourceType(resourceType)
                .quantity(new BigDecimal("1000.00"))
                .maxQuantity(new BigDecimal("5000.00"))
                .unit("m3")
                .build();

        companyInventory = CompanyInventory.builder()
                .id(1L).company(company).resourceType(resourceType)
                .quantity(new BigDecimal("500.00"))
                .build();

        companyResources = CompanyResources.builder()
                .id(1L).company(company).resourceType(resourceType)
                .build();

        pricingResponse = new PricingResponse();
        pricingResponse.setBuyPrice(new BigDecimal("100.00"));
        pricingResponse.setSellPrice(new BigDecimal("90.00"));

        pendingBuyOffer = TradeOffers.builder()
                .id(1L).company(company).resourceType(resourceType)
                .offerType(OfferType.BUY).quantity(new BigDecimal("10.00"))
                .pricePerUnit(new BigDecimal("90.00"))
                .totalPrice(new BigDecimal("900.00"))
                .status(Status.PENDING)
                .build();
        pendingBuyOffer.setCreatedAt(LocalDateTime.now());

        pendingSellOffer = TradeOffers.builder()
                .id(2L).company(company).resourceType(resourceType)
                .offerType(OfferType.SELL).quantity(new BigDecimal("10.00"))
                .pricePerUnit(new BigDecimal("100.00"))
                .totalPrice(new BigDecimal("1000.00"))
                .status(Status.PENDING)
                .build();
        pendingSellOffer.setCreatedAt(LocalDateTime.now());
    }

    // createTradeOffer tesztek

    @Test
    @DisplayName("createTradeOffer: BUY ajánlat létrehozása sikeresen")
    void createTradeOffer_buy_success() {
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(new BigDecimal("10.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(tradeOffersRepository.save(any(TradeOffers.class))).thenReturn(pendingBuyOffer);

        TradeOfferResponse response = tradeOfferService.createTradeOffer(request, companyUser);

        assertThat(response).isNotNull();
        assertThat(response.getOfferType()).isEqualTo(OfferType.BUY);
        assertThat(response.getStatus()).isEqualTo(Status.PENDING);
        verify(tradeOffersRepository, times(1)).save(any(TradeOffers.class));
    }

    @Test
    @DisplayName("createTradeOffer: SELL ajánlat létrehozása sikeresen")
    void createTradeOffer_sell_success() {
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.SELL);
        request.setQuantity(new BigDecimal("10.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyInventory));
        when(tradeOffersRepository.save(any(TradeOffers.class))).thenReturn(pendingSellOffer);

        TradeOfferResponse response = tradeOfferService.createTradeOffer(request, companyUser);

        assertThat(response).isNotNull();
        assertThat(response.getOfferType()).isEqualTo(OfferType.SELL);
        verify(tradeOffersRepository, times(1)).save(any(TradeOffers.class));
    }

    @Test
    @DisplayName("createTradeOffer: inaktív cég esetén BusinessException")
    void createTradeOffer_inactiveCompany_throwsBusinessException() {
        company.setActive(false);
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(new BigDecimal("10.00"));

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("COMPANY_INACTIVE");
    }

    @Test
    @DisplayName("createTradeOffer: nincs jogosultság a resource type-hoz -> AccessDeniedException")
    void createTradeOffer_noResourcePermission_throwsAccessDeniedException() {
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(new BigDecimal("10.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("createTradeOffer: nulla mennyiség -> BusinessException")
    void createTradeOffer_zeroQuantity_throwsBusinessException() {
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(BigDecimal.ZERO);

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("AMOUNT_MUST_BE_POSITIVE");
    }

    @Test
    @DisplayName("createTradeOffer: BUY - nincs elég kredit -> BusinessException")
    void createTradeOffer_buy_insufficientCredit_throwsBusinessException() {
        company.setCreditBalance(new BigDecimal("1.00"));
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(new BigDecimal("100.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("INSUFFICIENT_CREDIT_BUY");
    }

    @Test
    @DisplayName("createTradeOffer: BUY - nincs elég készlet -> BusinessException")
    void createTRadeOFfer_buy_insufficientStorage_throwsBusinessException() {
        company.setCreditBalance(new BigDecimal("9999999.00"));

        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.BUY);
        request.setQuantity(new BigDecimal("9999.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("INSUFFICIENT_STORAGE_BUY");
    }

    @Test
    @DisplayName("createTradeOffer: SELL - nincs elég készlet a cégnél -> BusinessException")
    void createTradeOffer_sell_insufficientInventory_throwsBusinessException() {
        TradeOfferRequest request = new TradeOfferRequest();
        request.setResourceType("GAS");
        request.setOfferType(OfferType.SELL);
        request.setQuantity(new BigDecimal("9999.00"));

        when(resourceTypeRepository.findByName("GAS")).thenReturn(Optional.of(resourceType));
        when(companyResourcesRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyResources));
        when(pricingService.getCurrentPrice("GAS")).thenReturn(pricingResponse);
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyInventory));

        assertThatThrownBy(() -> tradeOfferService.createTradeOffer(request, companyUser))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("INSUFFICIENT_INVENTORY_SELL");
    }

    // approveTradeOffer tesztek

    @Test
    @DisplayName("approveTradeOffer: BUY ajánlat jóváhagyása sikeres")
    void approveTradeOffer_buy_success() {
        when(tradeOffersRepository.findById(1L)).thenReturn(Optional.of(pendingBuyOffer));
        when(userRepository.findFirstByRole(Role.DISPATCHER)).thenReturn(Optional.of(dispatcher));
        when(centralStorageRepository.findByResourceType(resourceType))
                .thenReturn(Optional.of(centralStorage));
        when(companyInventoryRepository.findByCompanyAndResourceType(company, resourceType))
                .thenReturn(Optional.of(companyInventory));
        when(tradeOffersRepository.save(any())).thenReturn(pendingBuyOffer);
        when(companyRepository.save(any())).thenReturn(company);
        when(centralStorageRepository.save(any())).thenReturn(centralStorage);
        when(companyInventoryRepository.save(any())).thenReturn(companyInventory);
        when(transactionRepository.save(any())).thenReturn(null);
        when(creditTransactionRepository.save(any())).thenReturn(null);
        when(userRepository.save(any())).thenReturn(dispatcher);
        doNothing().when(webSocketService).sendStorageUpdate(any());
        doNothing().when(webSocketService).sendCreditUpdate(any(), any());
        doNothing().when(webSocketService).sendDispatcherCreditUpdate(any(), any());
        doNothing().when(webSocketService).sendTradeOfferUpdate(any());

        TradeOfferResponse response = tradeOfferService.approveTradeOffer(1L, dispatcher);

        assertThat(response).isNotNull();
        verify(tradeOffersRepository, times(1)).save(any());
        verify(webSocketService, times(1)).sendTradeOfferUpdate(any());
        verify(webSocketService, times(1)).sendCreditUpdate(any(), any());
    }

    @Test
    @DisplayName("approveTradeOffer: nem létező ajánlat -> ResourceNotFoundException")
    void approveTradeOffer_notFound_throwsResourceNotFoundException() {
        when(tradeOffersRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tradeOfferService.approveTradeOffer(99L, dispatcher))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // rejectTradeOffer tesztek

    @Test
    @DisplayName("rejectTradeOffer: ajánlat elutásítása sikeresen")
    void rejectTradeOffer_success() {
        when(tradeOffersRepository.findById(1L)).thenReturn(Optional.of(pendingBuyOffer));
        when(tradeOffersRepository.save(any())).thenReturn(pendingBuyOffer);
        doNothing().when(webSocketService).sendTradeOfferUpdate(any());

        TradeOfferResponse response = tradeOfferService.rejectTradeOffer(1L, dispatcher, "Rejected reason");

        assertThat(response).isNotNull();
        verify(tradeOffersRepository, times(1)).save(any());
        verify(webSocketService, times(1)).sendTradeOfferUpdate(any());
    }

    @Test
    @DisplayName("rejectTradeOffer: nem létező ajánlat -> ResourceNotFoundException")
    void rejectTradeOffer_notFound_throwsResourceNotFoundException() {
        when(tradeOffersRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tradeOfferService.rejectTradeOffer(99L, dispatcher, "notes"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // getMyTradeOffers tesztek

    @Test
    @DisplayName("getMyTradeOffers: visszaadja a cég ajánlatait")
    void getMyTradeOffers_returnsCompanyOffers() {
        when(tradeOffersRepository.findByCompany(company))
                .thenReturn(List.of(pendingBuyOffer, pendingSellOffer));

        List<TradeOfferResponse> responses = tradeOfferService.getMyTradeOffers(companyUser);

        assertThat(responses).hasSize(2);
        verify(tradeOffersRepository, times(1)).findByCompany(company);
    }

    @Test
    @DisplayName("getPendingTradeOffers: visszaadja a függőben lévő ajánlatokat")
    void getPendingTradeOffers_returnsPendingOffers(){
        when(tradeOffersRepository.findByStatus(Status.PENDING))
                .thenReturn(List.of(pendingBuyOffer));

        List<TradeOfferResponse> responses = tradeOfferService.getPendingTradeOffers();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getStatus()).isEqualTo(Status.PENDING);
    }
}




































