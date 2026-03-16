package com.energytrading.backend.service;

import com.energytrading.backend.dto.CompanyRequest;
import com.energytrading.backend.dto.CompanyResponse;
import com.energytrading.backend.dto.CompanyWithUserRequest;
import com.energytrading.backend.dto.PageResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyResourcesRepository companyResourcesRepository;
    private final CompanyInventoryRepository companyInventoryRepository;
    private final TradeOffersRepository tradeOffersRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final PaymentRepository paymentRepository;
    private final TransactionsRepository transactionsRepository;

    public PageResponse<CompanyResponse> getAllCompanies(int page, int size, String sort, String direction, String search, Boolean active) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = switch (sort) {
            case "createdAt" -> "createdAt";
            case "creditBalance" -> "creditBalance";
            default -> "name";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortField));
        Page<Company> result = companyRepository.findAllFiltered(
                search.isBlank() ? null : search,
                active,
                pageable
        );
        List<CompanyResponse> responses = result.getContent().stream()
                .map(this::mapToResponse)
                .toList();
        return new PageResponse<>(responses, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public CompanyResponse getCompanyById(Long id){
        Company company = this.companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return mapToResponse(company);
    }

    public CompanyResponse createCompany(CompanyRequest request){
        Company company = Company.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .creditBalance(request.getCreditBalance() != null ? request.getCreditBalance() : BigDecimal.ZERO)
                .isActive(true)
                .build();
        Company saved = this.companyRepository.save(company);
        return mapToResponse(saved);
    }

    public CompanyResponse updateCompany(Long id, CompanyRequest request){
        Company company = this.companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        company.setName(request.getName());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        if(request.getCreditBalance() != null){
            company.setCreditBalance(request.getCreditBalance());
        }
        Company saved = this.companyRepository.save(company);
        return mapToResponse(saved);
    }

    public void deactivateCompany(Long id){
        Company company = this.companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        company.setActive(false);
        this.companyRepository.save(company);
    }

    public void activateCompany(Long id){
        Company company = this.companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        company.setActive(true);
        this.companyRepository.save(company);
    }

    @Transactional
    public CompanyResponse createCompanyWithUser(CompanyWithUserRequest request){
        if(request.getCreditBalance() != null && request.getCreditBalance().compareTo(BigDecimal.ZERO) <= 0){
            throw new BusinessException("A kredit nem lehet negatív!");
        }

        Company company = Company.builder()
                .name(request.getCompanyName())
                .email(request.getCompanyEmail())
                .phone(request.getCompanyPhone())
                .address(request.getCompanyAddress())
                .creditBalance(request.getCreditBalance() != null ? request.getCreditBalance() : BigDecimal.ZERO)
                .isActive(true)
                .build();
        Company savedCompany = companyRepository.save(company);

        User user = User.builder()
                .email(request.getUserEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.COMPANY_USER)
                .company(savedCompany)
                .active(true)
                .build();
        userRepository.save(user);

        return mapToResponse(savedCompany);
    }

    @Transactional
    public void deleteCompany(Long id){
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        companyInventoryRepository.deleteAll(companyInventoryRepository.findByCompany(company));
        companyResourcesRepository.deleteAll(companyResourcesRepository.findByCompany(company));
        creditTransactionRepository.deleteAll(creditTransactionRepository.findByCompany(company));
        paymentRepository.deleteAll(paymentRepository.findByCompany(company));
        tradeOffersRepository.deleteAll(tradeOffersRepository.findByCompany(company));
        transactionsRepository.deleteAll(transactionsRepository.findByCompany(company));
        userRepository.deleteAll(userRepository.findByCompany(company));

        companyRepository.delete(company);
    }

    private CompanyResponse mapToResponse(Company company) {
        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setEmail(company.getEmail());
        response.setPhone(company.getPhone());
        response.setAddress(company.getAddress());
        response.setCreditBalance(company.getCreditBalance());
        response.setActive(company.isActive());
        response.setCreatedAt(company.getCreatedAt());
        return response;
    }
}
