package com.energytrading.backend.service;

import com.energytrading.backend.dto.PageResponse;
import com.energytrading.backend.dto.UserRequest;
import com.energytrading.backend.dto.UserResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CompanyRepository;
import com.energytrading.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    public PageResponse<UserResponse> getAllUsers(int page, int size, String sort, String direction, String search, Boolean active) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = switch (sort) {
            case "createdAt" -> "createdAt";
            default -> "email";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortField));
        Page<User> result = userRepository.findAllFiltered(
                search.isBlank() ? null : search,
                active,
                pageable
        );
        List<UserResponse> responses = result.getContent().stream()
                .map(this::mapToResponse)
                .toList();
        return new PageResponse<>(responses, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public UserResponse getUserById(Long id){
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToResponse(user);
    }

    public UserResponse createUser(UserRequest request){
        Company company = null;
        if(request.getCompanyId() != null){
            company = this.companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Couldn't find company with id: " + request.getCompanyId()));
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .company(company)
                .active(true)
                .build();
        User saved = this.userRepository.save(user);
        return mapToResponse(saved);
    }

    public UserResponse createUserForCompany(Long companyId, UserRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new BusinessException("Ez az email cím már foglalt: " + request.getEmail());
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Couldn't find company with id: " + companyId));

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.COMPANY_USER)
                .company(company)
                .active(true)
                .build();

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    public UserResponse updateUser(Long id, UserRequest request){
        Company company = null;
        if(request.getCompanyId() != null) {
            company = this.companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Couldn't find company with id: " + request.getCompanyId()));
        }
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setEmail(request.getEmail());
        if(request.getPassword() != null && !request.getPassword().isBlank()){
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        user.setRole(request.getRole());
        user.setCompany(company);
        User saved = this.userRepository.save(user);
        return mapToResponse(saved);
    }

    public UserResponse getMe(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getCompany() != null ? user.getCompany().getName() : user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());

        if (user.getRole() == Role.COMPANY_USER && user.getCompany() != null) {
            response.setCompanyId(user.getCompany().getId());
            response.setCompanyName(user.getCompany().getName());
            response.setCompanyPhone(user.getCompany().getPhone());
            response.setCompanyAddress(user.getCompany().getAddress());
            response.setCreditBalance(user.getCompany().getCreditBalance());
        } else {
            response.setCreditBalance(user.getCreditBalance() != null ? user.getCreditBalance() : BigDecimal.ZERO);
        }

        return response;
    }

    public List<UserResponse> getUsersByCompany(Long companyId){
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return userRepository.findByCompany(company)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void deactivateUser(Long id){
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setActive(false);
        this.userRepository.save(user);
    }

    public void activateUser(Long id){
        User user = this.userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setActive(true);
        this.userRepository.save(user);
    }

    public UserResponse mapToResponse(User user){
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setCompanyId(user.getCompany() != null ? user.getCompany().getId() : null);
        response.setCompanyName(user.getCompany() != null ? user.getCompany().getName() : null);
        response.setCreditBalance(user.getCreditBalance());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
