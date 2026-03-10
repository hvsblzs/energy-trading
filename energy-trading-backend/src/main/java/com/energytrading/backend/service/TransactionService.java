package com.energytrading.backend.service;

import com.energytrading.backend.dto.TransactionResponse;
import com.energytrading.backend.dto.TransactionStatsResponse;
import com.energytrading.backend.model.Transactions;
import com.energytrading.backend.model.enums.Direction;
import com.energytrading.backend.model.enums.Period;
import com.energytrading.backend.repository.TransactionsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionsRepository transactionsRepository;

    public List<TransactionResponse> getRecentTransactions(){
        return transactionsRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TransactionStatsResponse getStats(Period period){
        LocalDateTime from = period == Period.DAILY
                ? LocalDateTime.now().minusDays(1)
                : LocalDateTime.now().minusWeeks(1);

        List<Transactions> transactions = transactionsRepository.findByCreatedAtAfter(from);

        // Összes pénzmozgás
        BigDecimal totalCreditVolume = transactions.stream()
                .map(Transactions::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Nyersanyagokénti bontás
        Map<String, List<Transactions>> groupedByResource = transactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getResourceType().getName()));

        List<TransactionStatsResponse.ResourceStat> resourceStats = groupedByResource.entrySet().stream()
                .map(entry -> {
                    TransactionStatsResponse.ResourceStat stat = new TransactionStatsResponse.ResourceStat();
                    stat.setResourceType(entry.getKey());
                    stat.setUnit(entry.getValue().get(0).getResourceType().getUnit());
                    stat.setTotalQuantity(entry.getValue().stream()
                            .map(Transactions::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    stat.setTotalCredit(entry.getValue().stream()
                            .map(Transactions::getCreditAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    return stat;
                })
                .toList();

        TransactionStatsResponse response = new TransactionStatsResponse();
        response.setPeriod(period);
        response.setTotalCreditVolume(totalCreditVolume);
        response.setResourceStats(resourceStats);
        return response;
    }

    private TransactionResponse mapToResponse(Transactions transaction) {
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setCompanyName(transaction.getCompany().getName());
        response.setOfferType(transaction.getDirection() == Direction.CENTRAL_TO_COMPANY ? "Bought" : "Sold");
        response.setResourceType(transaction.getResourceType().getName());
        response.setQuantity(transaction.getQuantity());
        response.setUnit(transaction.getResourceType().getUnit());
        response.setCreditAmount(transaction.getCreditAmount());
        response.setCreatedAt(transaction.getCreatedAt());
        return response;
    }
}
