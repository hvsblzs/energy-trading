package com.energytrading.backend.service;

import com.energytrading.backend.dto.TransactionResponse;
import com.energytrading.backend.dto.TransactionStatsResponse;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Direction;
import com.energytrading.backend.model.enums.OfferType;
import com.energytrading.backend.model.enums.Period;
import com.energytrading.backend.model.enums.Status;
import com.energytrading.backend.repository.TransactionsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock private TransactionsRepository transactionsRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Company company;
    private ResourceType resourceType;
    private TradeOffers tradeOffer;
    private Transactions transaction;

    @BeforeEach
    void setUp() {
        company = Company.builder()
                .id(1L).name("Test Co").email("test@co.com")
                .creditBalance(new BigDecimal("10000.00")).isActive(true)
                .build();

        resourceType = ResourceType.builder()
                .id(1L).name("GAS").unit("m3").color("#10b981").isActive(true)
                .build();

        tradeOffer = TradeOffers.builder()
                .id(1L).company(company).resourceType(resourceType)
                .offerType(OfferType.BUY).quantity(new BigDecimal("10.00"))
                .pricePerUnit(new BigDecimal("90.00"))
                .totalPrice(new BigDecimal("900.00"))
                .status(Status.COMPLETED)
                .build();
        tradeOffer.setCreatedAt(LocalDateTime.now());

        transaction = Transactions.builder()
                .id(1L).company(company).resourceType(resourceType)
                .tradeOffer(tradeOffer)
                .quantity(new BigDecimal("10.00"))
                .creditAmount(new BigDecimal("900.00"))
                .direction(Direction.CENTRAL_TO_COMPANY)
                .build();
        transaction.setCreatedAt(LocalDateTime.now());
    }

    // getRecentTransactions tesztek

    @Test
    @DisplayName("getRecentTransactions: visszaadja a legutóbbi 20 tranzakciót")
    void getRecentTransactions_returnsTop20() {
        when(transactionsRepository.findTop20ByOrderByCreatedAtDesc())
                .thenReturn(List.of(transaction));

        List<TransactionResponse> responses = transactionService.getRecentTransactions();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getCompanyName()).isEqualTo("Test Co");
        assertThat(responses.get(0).getResourceType()).isEqualTo("GAS");
        assertThat(responses.get(0).getQuantity()).isEqualByComparingTo("10.00");
        assertThat(responses.get(0).getCreditAmount()).isEqualByComparingTo("900.00");
    }

    @Test
    @DisplayName("getRecentTransactions: BUY irány -> 'Bought' offerType")
    void getRecentTransactions_buyDirection_returnsBought() {
        when(transactionsRepository.findTop20ByOrderByCreatedAtDesc())
                .thenReturn(List.of(transaction));

        List<TransactionResponse> responses = transactionService.getRecentTransactions();

        assertThat(responses.get(0).getOfferType()).isEqualTo("Bought");
    }

    @Test
    @DisplayName("getRecentTransactions: SELL irány -> 'Sold' offerType")
    void getRecentTransactions_sellDirection_returnsSold() {
        transaction.setDirection(Direction.COMPANY_TO_CENTRAL);
        when(transactionsRepository.findTop20ByOrderByCreatedAtDesc())
                .thenReturn(List.of(transaction));

        List<TransactionResponse> responses = transactionService.getRecentTransactions();

        assertThat(responses.get(0).getOfferType()).isEqualTo("Sold");
    }

    @Test
    @DisplayName("getRecentTransactions: üres lista esetén üres listát ad vissza")
    void getRecentTransactions_empty_returnsEmptyList() {
        when(transactionsRepository.findTop20ByOrderByCreatedAtDesc())
                .thenReturn(Collections.emptyList());

        List<TransactionResponse> responses = transactionService.getRecentTransactions();

        assertThat(responses).isEmpty();
    }

    // getStats tesztek

    @Test
    @DisplayName("getStats: DAILY periódus esetén 24 óra tranzakcióit adja vissza")
    void getStats_daily_returnsLast24HoursStats() {
        when(transactionsRepository.findByCreatedAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(transaction));

        TransactionStatsResponse response = transactionService.getStats(Period.DAILY);

        assertThat(response).isNotNull();
        assertThat(response.getPeriod()).isEqualTo(Period.DAILY);
        assertThat(response.getTotalCreditVolume()).isEqualByComparingTo("900.00");
        assertThat(response.getResourceStats()).hasSize(1);
    }

    @Test
    @DisplayName("getStats: WEEKLY periódus esetén az elmúlt hét tranzakcióit adja vissza")
    void getStats_weekly_returnsLastWeekStats() {
        when(transactionsRepository.findByCreatedAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(transaction));

        TransactionStatsResponse response = transactionService.getStats(Period.WEEKLY);

        assertThat(response.getPeriod()).isEqualTo(Period.WEEKLY);
        assertThat(response.getTotalCreditVolume()).isEqualByComparingTo("900.00");
    }

    @Test
    @DisplayName("getStats: több tranzakció esetén összesíti a krediteket")
    void getStats_multipleTransactions_sumsTotalCredit() {
        Transactions transaction2 = Transactions.builder()
                .id(2L).company(company).resourceType(resourceType)
                .tradeOffer(tradeOffer)
                .quantity(new BigDecimal("5.00"))
                .creditAmount(new BigDecimal("450.00"))
                .direction(Direction.CENTRAL_TO_COMPANY)
                .build();
        transaction2.setCreatedAt(LocalDateTime.now());

        when(transactionsRepository.findByCreatedAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(transaction, transaction2));

        TransactionStatsResponse response = transactionService.getStats(Period.DAILY);

        // 900 + 450 = 1350
        assertThat(response.getTotalCreditVolume()).isEqualByComparingTo("1350.00");
    }

    @Test
    @DisplayName("getStats: több nyersanyag esetén nyersanyagonként csoportosít")
    void getStats_multipleResourceTypes_groupsByResource() {
        ResourceType resourceType2 = ResourceType.builder()
                .id(2L).name("ELECTRICITY").unit("kWh").color("#3b82f6").isActive(true)
                .build();

        Transactions transaction2 = Transactions.builder()
                .id(2L).company(company).resourceType(resourceType2)
                .tradeOffer(tradeOffer)
                .quantity(new BigDecimal("100.00"))
                .creditAmount(new BigDecimal("5000.00"))
                .direction(Direction.CENTRAL_TO_COMPANY)
                .build();
        transaction2.setCreatedAt(LocalDateTime.now());

        when(transactionsRepository.findByCreatedAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(transaction, transaction2));

        TransactionStatsResponse response = transactionService.getStats(Period.DAILY);

        assertThat(response.getResourceStats()).hasSize(2);
        assertThat(response.getResourceStats())
                .extracting(TransactionStatsResponse.ResourceStat::getResourceType)
                .containsExactlyInAnyOrder("GAS", "ELECTRICITY");
    }

    @Test
    @DisplayName("getStats: üres tranzakció lista esetén 0 kreditvolume")
    void getStats_noTransactions_returnsZeroVolume() {
        when(transactionsRepository.findByCreatedAtAfter(any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        TransactionStatsResponse response = transactionService.getStats(Period.DAILY);

        assertThat(response.getTotalCreditVolume()).isEqualByComparingTo("0.00");
        assertThat(response.getResourceStats()).isEmpty();
    }
}




































