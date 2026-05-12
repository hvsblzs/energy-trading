package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyRequest;
import com.energytrading.backend.dto.CompanyResponse;
import com.energytrading.backend.dto.CompanyWithUserRequest;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.User;
import com.energytrading.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CompanyServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CompanyResourcesRepository companyResourcesRepository;
    @Mock private CompanyInventoryRepository companyInventoryRepository;
    @Mock private TradeOffersRepository tradeOffersRepository;
    @Mock private CreditTransactionRepository creditTransactionRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionsRepository transactionsRepository;

    @InjectMocks
    private CompanyService companyService;

    private Company company;

    @BeforeEach
    void setUp() {
        company = Company.builder()
                .id(1L).name("Test Co").email("test@co.com")
                .phone("123456789").address("Test utca 1.")
                .creditBalance(new BigDecimal("10000.00")).isActive(true)
                .build();
        company.setCreatedAt(LocalDateTime.now());
    }

    // getCompanyById tesztek

    @Test
    @DisplayName("getCompanyById: létező cég visszaadása")
    void getCompanyById_exists_returnsCompany() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        CompanyResponse response = companyService.getCompanyById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Test Co");
        assertThat(response.getEmail()).isEqualTo("test@co.com");
        assertThat(response.getCreditBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("getCompanyById: nem létező cég -> ResourceNotFoundException")
    void getCompanyById_notExists_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.getCompanyById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // createCompany tesztek

    @Test
    @DisplayName("createCompany: sikeresen létrehoz céget")
    void createCompany_success() {
        CompanyRequest request = new CompanyRequest();
        request.setName("New Co");
        request.setEmail("new@co.com");
        request.setCreditBalance(new BigDecimal("5000.00"));

        when(companyRepository.save(any(Company.class))).thenReturn(company);

        CompanyResponse response = companyService.createCompany(request);

        assertThat(response).isNotNull();
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    @Test
    @DisplayName("createCompany: null creditBalance esetén 0-val hozza létre")
    void createCompany_nullCreditBalance_setsZero() {
        CompanyRequest request = new CompanyRequest();
        request.setName("New Co");
        request.setEmail("new@co.com");
        request.setCreditBalance(null);

        company.setCreditBalance(BigDecimal.ZERO);
        when(companyRepository.save(any(Company.class))).thenReturn(company);

        CompanyResponse response = companyService.createCompany(request);

        assertThat(response.getCreditBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // updateCompany tesztek

    @Test
    @DisplayName("updateCompany: sikeresen frissíti a céget")
    void updateCompany_success() {
        CompanyRequest request = new CompanyRequest();
        request.setName("Updated Co");
        request.setEmail("updated@co.com");
        request.setPhone("999999999");
        request.setAddress("Új utca 2.");
        request.setCreditBalance(new BigDecimal("20000.00"));

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenReturn(company);

        CompanyResponse response = companyService.updateCompany(1L, request);

        assertThat(response).isNotNull();
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    @Test
    @DisplayName("updateCompany: nem létező cég -> ResourceNotFoundException")
    void updateCompany_notFound_throwsResourceNotFoundException() {
        CompanyRequest request = new CompanyRequest();
        request.setName("Updated Co");
        request.setEmail("updated@co.com");

        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.updateCompany(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // deactivateCompany / activateCompany tesztek

    @Test
    @DisplayName("deactivateCompany: sikeresen deaktiválja a céget")
    void deactivateCompany_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        companyService.deactivateCompany(1L);

        assertThat(company.isActive()).isFalse();
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    @DisplayName("activateCompany: sikeresen aktiválja a céget")
    void activateCompany_success() {
        company.setActive(false);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        companyService.activateCompany(1L);

        assertThat(company.isActive()).isTrue();
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    @DisplayName("deactivateCompany: nem létező cég -> ResourceNotFoundException")
    void deactivateCompany_notFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.deactivateCompany(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // createCompanyWithUser tesztek

    @Test
    @DisplayName("createCompanyWithUser: sikeresen létrehoz céget userrel")
    void createCompanyWithUser_success() {
        CompanyWithUserRequest request = new CompanyWithUserRequest();
        request.setCompanyName("New Co");
        request.setCompanyEmail("new@co.com");
        request.setUserEmail("user@new.com");
        request.setPassword("password123");
        request.setCreditBalance(new BigDecimal("5000.00"));

        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(null);

        CompanyResponse response = companyService.createCompanyWithUser(request);

        assertThat(response).isNotNull();
        verify(companyRepository, times(1)).save(any(Company.class));
        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode("password123");
    }

    @Test
    @DisplayName("createCompanyWithUser: negatív creditBalance -> BusinessException")
    void createCompanyWithUser_negativeCreditBalance_throwsBusinessException() {
        CompanyWithUserRequest request = new CompanyWithUserRequest();
        request.setCompanyName("New Co");
        request.setCompanyEmail("new@co.com");
        request.setUserEmail("user@new.com");
        request.setPassword("password123");
        request.setCreditBalance(new BigDecimal("-100.00"));

        assertThatThrownBy(() -> companyService.createCompanyWithUser(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CREDIT_CANNOT_BE_NEGATIVE");
    }

    @Test
    @DisplayName("createCompanyWithUser: nulla creditBalance -> BusinessException")
    void createCompanyWithUser_zeroCreditBalance_throwsBusinessException() {
        CompanyWithUserRequest request = new CompanyWithUserRequest();
        request.setCompanyName("New Co");
        request.setCompanyEmail("new@co.com");
        request.setUserEmail("user@new.com");
        request.setPassword("password123");
        request.setCreditBalance(BigDecimal.ZERO);

        assertThatThrownBy(() -> companyService.createCompanyWithUser(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CREDIT_CANNOT_BE_NEGATIVE");
    }

    // deleteCompany tesztek

    @Test
    @DisplayName("deleteCompany: sikeresen törli a céget és minden kapcsolódó adatot")
    void deleteCompany_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(companyInventoryRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(companyResourcesRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(creditTransactionRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(tradeOffersRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(transactionsRepository.findByCompany(company)).thenReturn(Collections.emptyList());
        when(userRepository.findByCompany(company)).thenReturn(Collections.emptyList());

        companyService.deleteCompany(1L);

        verify(companyRepository, times(1)).delete(company);
        verify(companyInventoryRepository, times(1)).deleteAll(any());
        verify(companyResourcesRepository, times(1)).deleteAll(any());
        verify(userRepository, times(1)).deleteAll(any());
    }

    @Test
    @DisplayName("deleteCompany: nem létező cég ->  ResourceNotFoundException")
    void deleteCompany_notFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.deleteCompany(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}































