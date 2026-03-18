package com.energytrading.backend.service;

import com.energytrading.backend.dto.CreatePaymentIntentRequest;
import com.energytrading.backend.dto.CreatePaymentIntentResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.CreditTransaction;
import com.energytrading.backend.model.Payment;
import com.energytrading.backend.repository.CompanyRepository;
import com.energytrading.backend.repository.CreditTransactionRepository;
import com.energytrading.backend.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CompanyRepository companyRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final WebSocketService webSocketService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    // 1 HUF = 10 kredit
    private static final BigDecimal CREDITS_PER_HUF = BigDecimal.TEN;

    // Minimum feltöltési összeg
    private static final BigDecimal MINIMUM_AMOUNT = new BigDecimal("500");

    public CreatePaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest request, Company company){
        // Min összeg check
        if(request.getAmount().compareTo(MINIMUM_AMOUNT) < 0){
            throw new BusinessException("AMOUNT_TOO_LOW");
        }

        Stripe.apiKey = stripeSecretKey;

        try{
            long amountInSmallestUnit = request.getAmount().longValue() * 100;

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInSmallestUnit)
                    .setCurrency("huf")
                    .putMetadata("companyId", "" + company.getId())
                    .putMetadata("creditsToReceive",
                            request.getAmount().multiply(CREDITS_PER_HUF).longValue() + "")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            // PENDING payment rekord
            BigDecimal creditsToReceive = request.getAmount().multiply(CREDITS_PER_HUF);
            Payment payment = Payment.builder()
                    .company(company)
                    .stripePaymentId(paymentIntent.getId())
                    .amountPaid(request.getAmount())
                    .creditsReceived(creditsToReceive)
                    .status(Payment.Status.PENDING)
                    .build();
            paymentRepository.save(payment);

            return new CreatePaymentIntentResponse(
                    paymentIntent.getClientSecret(),
                    creditsToReceive.longValue(),
                    paymentIntent.getId()
            );

        } catch (Exception e){
            throw new BusinessException("PAYMENT_FAILED");
        }
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader){
        Stripe.apiKey = stripeSecretKey;

        Event event;
        try{
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        }catch (SignatureVerificationException e){
            throw new BusinessException("INVALID_WEBHOOK_SIGNATURE");
        }

        if("payment_intent.succeeded".equals(event.getType())){
            PaymentIntent paymentIntent = (PaymentIntent) event.getData()
                    .getObject();

            String companyIdStr = paymentIntent.getMetadata().get("companyId");
            Long creditsToReceive = Long.parseLong(
                    paymentIntent.getMetadata().get("creditsToReceive")
            );

            Company company = companyRepository.findById(Long.parseLong(companyIdStr))
                    .orElseThrow(() -> new BusinessException("COMPANY_NOT_FOUND"));

            Payment payment = paymentRepository.findByStripePaymentId(paymentIntent.getId())
                    .orElseThrow(() -> new BusinessException("PAYMENT_NOT_FOUND"));
            payment.setStatus(Payment.Status.SUCCESS);
            paymentRepository.save(payment);

            company.setCreditBalance(
                    company.getCreditBalance().add(new BigDecimal(creditsToReceive))
            );
            companyRepository.save(company);

            CreditTransaction creditTransaction = CreditTransaction.builder()
                    .company(company)
                    .amount(new BigDecimal(creditsToReceive))
                    .type(CreditTransaction.Type.TOPUP)
                    .referenceId(payment.getId())
                    .build();
            creditTransactionRepository.save(creditTransaction);

            webSocketService.sendCreditUpdate(company.getId(), Map.of(
                    "companyId", company.getId(),
                    "creditBalance", company.getCreditBalance()
            ));
        }
    }


}
