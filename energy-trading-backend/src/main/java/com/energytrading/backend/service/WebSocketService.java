package com.energytrading.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendStorageUpdate(Object payload){
        messagingTemplate.convertAndSend("/topic/storage", payload);
    }

    public void sendTradeOfferUpdate(Object payload){
        messagingTemplate.convertAndSend("/topic/trade-offers", payload);
    }

    public void sendCreditUpdate(Long companyId, Object payload){
        messagingTemplate.convertAndSend("/topic/credits/" + companyId, payload);
    }
}
