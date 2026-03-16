package com.energytrading.backend.service;

import com.energytrading.backend.dto.PricingResponse;
import com.energytrading.backend.dto.TradeOfferRequest;
import com.energytrading.backend.dto.TradeOfferResponse;
import com.energytrading.backend.exception.AccessDeniedException;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.*;
import com.energytrading.backend.model.enums.Direction;
import com.energytrading.backend.model.enums.OfferType;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.model.enums.Status;
import com.energytrading.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TradeOfferService {

    private final TradeOffersRepository tradeOffersRepository;
    private final PricingService pricingService;
    private final ResourceTypeRepository resourceTypeRepository;
    private final CompanyRepository companyRepository;
    private final CentralStorageRepository centralStorageRepository;
    private final CompanyInventoryRepository companyInventoryRepository;
    private final TransactionsRepository transactionRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final CompanyResourcesRepository companyResourcesRepository;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;

    @Transactional
    public TradeOfferResponse createTradeOffer(TradeOfferRequest request, User currentUser){
        if(!currentUser.getCompany().isActive()){
            throw new BusinessException("A cég deaktiválva van, kereskedés nem lehetséges!");
        }

        ResourceType resourceType = resourceTypeRepository.findByName(request.getResourceType())
                .orElseThrow(() -> new ResourceNotFoundException("Resource type not found: " + request.getResourceType()));

        // Jogosultság ellenőrzés
        companyResourcesRepository.findByCompanyAndResourceType(currentUser.getCompany(), resourceType)
                .orElseThrow(() -> new AccessDeniedException("Company is not authorized to trade this resource type"));

        PricingResponse currentPrice = pricingService.getCurrentPrice(request.getResourceType());
        BigDecimal pricePerUnit = request.getOfferType() == OfferType.BUY
                ? currentPrice.getSellPrice()
                : currentPrice.getBuyPrice();
        BigDecimal totalPrice = pricePerUnit.multiply(request.getQuantity());

        CentralStorage centralStorage = centralStorageRepository
                .findByResourceType(resourceType)
                .orElseThrow(() -> new BusinessException("Nincs ilyen nyersanyag a központi tárolóban!"));

        // Quantity check
        if(request.getQuantity().compareTo(BigDecimal.ZERO) <= 0){
            throw new BusinessException("A mennyiség csak pozitív szám lehet!");
        }

        // BUY validáció
        if(request.getOfferType() == OfferType.BUY){
            if(currentUser.getCompany().getCreditBalance().compareTo(totalPrice) < 0){
                throw new BusinessException("Nincs elég kredit a vásárláshoz!");
            }
            if(centralStorage.getQuantity().compareTo(request.getQuantity()) < 0){
                throw new BusinessException("Nincs elég nyersanyag a központi tárolóban!");
            }
        }

        // SELL validáció
        if(request.getOfferType() == OfferType.SELL){
            CompanyInventory inventory = companyInventoryRepository
                    .findByCompanyAndResourceType(currentUser.getCompany(), resourceType)
                    .orElseThrow(() -> new BusinessException("Nincs ilyen nyersanyag a készletben."));
            if(inventory.getQuantity().compareTo(request.getQuantity()) < 0){
                throw new BusinessException("Nincs elég nyersanyag az eladáshoz!");
            }
            if(request.getQuantity().add(centralStorage.getQuantity()).compareTo(centralStorage.getMaxQuantity()) > 0){
                throw new BusinessException("Nincs elég hely a központi tárolóban!");
            }

        }

        TradeOffers tradeOffer = TradeOffers.builder()
                .company(currentUser.getCompany())
                .resourceType(resourceType)
                .offerType(request.getOfferType())
                .quantity(request.getQuantity())
                .pricePerUnit(pricePerUnit)
                .totalPrice(totalPrice)
                .status(Status.PENDING)
                .build();
        TradeOffers saved = this.tradeOffersRepository.save(tradeOffer);
        return mapToResponse(saved);
    }

    public List<TradeOfferResponse> getMyTradeOffers(User currentUser){
        List<TradeOffers> offers = this.tradeOffersRepository.findByCompany(currentUser.getCompany());
        return offers.stream().map(this::mapToResponse).toList();
    }

    public List<TradeOfferResponse> getAllTradeOffers(){
        List<TradeOffers> tradeOffers = this.tradeOffersRepository.findAll();
        return tradeOffers.stream().map(this::mapToResponse).toList();
    }

    public List<TradeOfferResponse> getPendingTradeOffers(){
        return tradeOffersRepository.findByStatus(Status.PENDING)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public TradeOfferResponse getTradeOfferById(Long id){
        TradeOffers tradeOffer = this.tradeOffersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade offer wasn't found for this id: " + id));
        return mapToResponse(tradeOffer);
    }

    @Transactional
    public TradeOfferResponse approveTradeOffer(Long id, User currentUser){
        TradeOffers tradeOffer = this.tradeOffersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade offer wasn't found for this id: " + id));

        User dispatcher = userRepository.findFirstByRole(Role.DISPATCHER)
                .orElseThrow(() -> new ResourceNotFoundException("No dispatcher found."));
        if(dispatcher.getCreditBalance() == null){
            dispatcher.setCreditBalance(BigDecimal.ZERO);
        }

        Company company = tradeOffer.getCompany();
        BigDecimal totalPrice = tradeOffer.getTotalPrice();
        BigDecimal quantity = tradeOffer.getQuantity();
        ResourceType resourceType = tradeOffer.getResourceType();

        CentralStorage centralStorage = this.centralStorageRepository.findByResourceType(resourceType)
                .orElseThrow(() -> new ResourceNotFoundException("Central storage not found for: " + resourceType.getName()));

        CompanyInventory inventory = this.companyInventoryRepository
                .findByCompanyAndResourceType(company, resourceType)
                .orElse(CompanyInventory.builder()
                        .company(company)
                        .resourceType(resourceType)
                        .quantity(BigDecimal.ZERO)
                        .build());

        if(tradeOffer.getOfferType() == OfferType.BUY){
            if(company.getCreditBalance().compareTo(totalPrice) < 0){
                throw new RuntimeException("Insufficient credit balance");
            }
            if(centralStorage.getQuantity().compareTo(quantity) < 0){
                throw new RuntimeException("Insufficient central storage quantity");
            }
            company.setCreditBalance(company.getCreditBalance().subtract(totalPrice));
            centralStorage.setQuantity(centralStorage.getQuantity().subtract(quantity));
            dispatcher.setCreditBalance(dispatcher.getCreditBalance().add(totalPrice));
            inventory.setQuantity(inventory.getQuantity().add(quantity));
        } else {
            if(inventory.getQuantity().compareTo(quantity) < 0){
                throw new RuntimeException("Insufficient company inventory quantity");
            }
            company.setCreditBalance(company.getCreditBalance().add(totalPrice));
            centralStorage.setQuantity(centralStorage.getQuantity().add(quantity));
            dispatcher.setCreditBalance(dispatcher.getCreditBalance().subtract(totalPrice));
            inventory.setQuantity(inventory.getQuantity().subtract(quantity));
        }

        tradeOffer.setStatus(Status.COMPLETED);
        tradeOffer.setResolvedByUser(currentUser);
        tradeOffer.setResolvedAt(LocalDateTime.now());

        Transactions transaction = Transactions.builder()
                .tradeOffer(tradeOffer)
                .resourceType(resourceType)
                .quantity(quantity)
                .creditAmount(totalPrice)
                .direction(tradeOffer.getOfferType() == OfferType.BUY ? Direction.CENTRAL_TO_COMPANY : Direction.COMPANY_TO_CENTRAL)
                .company(company)
                .build();

        CreditTransaction creditTransaction = CreditTransaction.builder()
                .company(company)
                .amount(tradeOffer.getOfferType() == OfferType.BUY ? totalPrice.negate() : totalPrice)
                .type(CreditTransaction.Type.TRADE)
                .referenceId(tradeOffer.getId())
                .build();

        this.companyRepository.save(company);
        this.centralStorageRepository.save(centralStorage);
        this.companyInventoryRepository.save(inventory);
        this.tradeOffersRepository.save(tradeOffer);
        this.transactionRepository.save(transaction);
        this.creditTransactionRepository.save(creditTransaction);
        this.userRepository.save(dispatcher);

        // Websocket értesítések
        webSocketService.sendStorageUpdate(Map.of(
                "resourceType", resourceType.getName(),
                "quantity", centralStorage.getQuantity(),
                "maxQuantity", centralStorage.getMaxQuantity()
        ));

        webSocketService.sendCreditUpdate(company.getId(), Map.of(
                "companyId", company.getId(),
                "creditBalance", company.getCreditBalance()
        ));

        webSocketService.sendCreditUpdate(dispatcher.getId(), Map.of(
                "creditBalance", dispatcher.getCreditBalance()
        ));
        System.out.println("Sending credit update to dispatcher id: " + dispatcher.getId());

        webSocketService.sendTradeOfferUpdate(Map.of(
                "action", "APPROVED",
                "tradeOfferId", tradeOffer.getId()
        ));

        return mapToResponse(tradeOffer);
    }

    public TradeOfferResponse rejectTradeOffer(Long id, User currentUser, String notes){
        TradeOffers tradeOffer = this.tradeOffersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade offer wasn't found for this id: " + id));
        tradeOffer.setStatus(Status.REJECTED);
        tradeOffer.setResolvedByUser(currentUser);
        tradeOffer.setResolvedAt(LocalDateTime.now());
        tradeOffer.setNotes(notes);
        TradeOffers saved = this.tradeOffersRepository.save(tradeOffer);
        return mapToResponse(saved);
    }

    public TradeOfferResponse mapToResponse(TradeOffers tradeOffer){
        TradeOfferResponse response = new TradeOfferResponse();
        response.setId(tradeOffer.getId());
        response.setCompanyId(tradeOffer.getCompany().getId());
        response.setCompanyName(tradeOffer.getCompany().getName());
        response.setResourceType(tradeOffer.getResourceType().getName());
        response.setOfferType(tradeOffer.getOfferType());
        response.setQuantity(tradeOffer.getQuantity());
        response.setPricePerUnit(tradeOffer.getPricePerUnit());
        response.setTotalPrice(tradeOffer.getTotalPrice());
        response.setStatus(tradeOffer.getStatus());
        response.setCreatedAt(tradeOffer.getCreatedAt());
        response.setResolvedAt(tradeOffer.getResolvedAt());
        response.setResolvedByUserId(tradeOffer.getResolvedByUser() != null ? tradeOffer.getResolvedByUser().getId() : null);
        response.setNotes(tradeOffer.getNotes());
        return response;
    }
}