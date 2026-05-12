package com.energytrading.backend.service;

import com.energytrading.backend.dto.nav.NavRevenueMessage;
import com.energytrading.backend.dto.nav.NavTransactionMessage;
import com.energytrading.backend.model.Transactions;
import com.energytrading.backend.model.enums.Direction;
import com.energytrading.backend.repository.TransactionsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
class NavReportingService {

    private final RabbitTemplate rabbitTemplate;
    private final TransactionsRepository transactionsRepository;
    private final ObjectMapper objectMapper;

    @Value("${nav.rabbitmq.exchange}")
    private String exchange;

    @Value("${nav.rabbitmq.routing-key.transactions}")
    private String transactionsRoutingKey;

    @Value("${nav.rabbitmq.routing-key.revenue}")
    private String revenueRoutingKey;

    // Tranzakciók küldése
    @Transactional(readOnly = true)
    @Scheduled(fixedDelayString = "${nav.schedule.transactions}")
    public void sendRecentTransactions() {
        LocalDateTime since = LocalDateTime.now().minusMinutes(1);
        List<Transactions> recent = transactionsRepository.findByCreatedAtAfter(since);

        if (recent.isEmpty()) {
            log.debug("No new transactions to send to NAV.");
            return;
        }

        for (Transactions tx : recent) {
            NavTransactionMessage message = NavTransactionMessage.builder()
                    .transactionId(tx.getId())
                    .companyName(tx.getCompany().getName())
                    .resourceType(tx.getResourceType().getName())
                    .quantity(tx.getQuantity())
                    .unit(tx.getResourceType().getUnit())
                    .creditAmount(tx.getCreditAmount())
                    .direction(tx.getDirection() == Direction.CENTRAL_TO_COMPANY ? "BUY" : "SELL")
                    .createdAt(tx.getCreatedAt())
                    .build();

            try{
                String json = objectMapper.writeValueAsString(message);
                rabbitTemplate.convertAndSend(exchange, transactionsRoutingKey, json);
                log.info("Sent transaction to NAV queue: id={}, company={}, direction={}",
                        tx.getId(), tx.getCompany().getName(), message.getDirection());
            } catch (Exception e) {
                log.error("Failed to serialize transaction message: {}", e.getMessage());
            }

        }
    }

    // Revenue összesítés
    @Transactional(readOnly = true)
    @Scheduled(fixedDelayString = "${nav.schedule.revenue}")
    public void sendRevenueSumamry() {
        LocalDateTime from = LocalDateTime.now().minusMinutes(5);
        LocalDateTime to = LocalDateTime.now();

        List<Transactions> transactions = transactionsRepository.findByCreatedAtAfter(from);

        BigDecimal totalVolume = transactions.stream()
                .map(Transactions::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, List<Transactions>> grouped = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getResourceType().getName()));

        List<NavRevenueMessage.ResourceRevenue> breakdown = grouped.entrySet().stream()
                .map(entry -> NavRevenueMessage.ResourceRevenue.builder()
                        .resourceType(entry.getKey())
                        .unit(entry.getValue().get(0).getResourceType().getUnit())
                        .totalQuantity(entry.getValue().stream()
                                .map(Transactions::getQuantity)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .totalCredit(entry.getValue().stream()
                                .map(Transactions::getCreditAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .build())
                .toList();

        NavRevenueMessage message = NavRevenueMessage.builder()
                .periodFrom(from)
                .periodTo(to)
                .totalCreditVolume(totalVolume)
                .breakdown(breakdown)
                .build();

        try {
            String json = objectMapper.writeValueAsString(message);
            rabbitTemplate.convertAndSend(exchange, revenueRoutingKey, json);
            log.info("Sent revenue summary to NAV queue: totalVolume={}, period={} -> {}",
                    totalVolume, from, to);
        } catch (Exception e) {
            log.error("Failed to serialize revenue message: {}", e.getMessage());
        }
    }














}
