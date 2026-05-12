package com.energytrading.backend.service;

import com.energytrading.backend.dto.UserRequest;
import com.energytrading.backend.dto.UserResponse;
import com.energytrading.backend.exception.BusinessException;
import com.energytrading.backend.exception.ResourceNotFoundException;
import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import com.energytrading.backend.repository.CompanyRepository;
import com.energytrading.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.swing.text.html.Option;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private Company company;
    private User companyUser;
    private User dispatcher;

    @BeforeEach
    void setUp() {
        company = Company.builder()
                .id(1L).name("Test Co").email("test@co.com")
                .creditBalance(new BigDecimal("10000.00")).isActive(true)
                .build();

        companyUser = User.builder()
                .id(1L).email("user@test.com").role(Role.COMPANY_USER)
                .passwordHash("hashedPassword").company(company)
                .active(true)
                .build();
        companyUser.setCreatedAt(LocalDateTime.now());

        dispatcher = User.builder()
                .id(2L).email("dispatcher@test.com").role(Role.DISPATCHER)
                .passwordHash("hashedPassword")
                .creditBalance(new BigDecimal("5000.00"))
                .active(true)
                .build();
        dispatcher.setCreatedAt(LocalDateTime.now());
    }

    // getUserById tesztek

    @Test
    @DisplayName("getUserById: létező user visszaadása")
    void getUserById_exists_returnsUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));

        UserResponse response = userService.getUserById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("user@test.com");
        assertThat(response.getRole()).isEqualTo(Role.COMPANY_USER);
    }

    @Test
    @DisplayName("getUserById: nem létező user -> ResourceNotFoundException")
    void getUserById_notExists_throwsResourceNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // createUser tesztek

    @Test
    @DisplayName("createUser: company nélkül sikeresen létrehoz usert")
    void createUser_withoutCompany_success() {
        UserRequest request = new UserRequest();
        request.setEmail("new@test.com");
        request.setPassword("password123");
        request.setRole(Role.DISPATCHER);

        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(dispatcher);

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode("password123");
    }

    @Test
    @DisplayName("createUser: company-val sikeresen létrehoz usert")
    void createUser_withCompany_success() {
        UserRequest request = new UserRequest();
        request.setEmail("new@test.com");
        request.setPassword("password123");
        request.setRole(Role.COMPANY_USER);
        request.setCompanyId(1L);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(companyUser);

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        verify(companyRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("createUser: nem létező company -> ResourceNotFoundException")
    void createUser_companyNotFound_throwsResourceNotFoundException() {
        UserRequest request = new UserRequest();
        request.setEmail("new@test.com");
        request.setPassword("password123");
        request.setRole(Role.COMPANY_USER);
        request.setCompanyId(99L);

        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // createUserForCompany tesztek

    @Test
    @DisplayName("createUserForCompany: sikeresen létrehoz usert céghez")
    void createUserForCompany_success() {
        UserRequest request = new UserRequest();
        request.setEmail("newuser@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("newuser@test.com")).thenReturn(false);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(companyUser);

        UserResponse response = userService.createUserForCompany(1L, request);

        assertThat(response).isNotNull();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("createUserForCompany: már létező email -> BusinessException")
    void createUserForCompany_emailExists_throwsBusinessException() {
        UserRequest request = new UserRequest();
        request.setEmail("user@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUserForCompany(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("EMAIL_ALREADY_EXISTS");
    }

    // updateUser tesztek

    @Test
    @DisplayName("updateUser: sikeresen frissíti a usert")
    void updateUser_success() {
        UserRequest request = new UserRequest();
        request.setEmail("updated@test.com");
        request.setRole(Role.COMPANY_USER);

        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));
        when(userRepository.save(any(User.class))).thenReturn(companyUser);

        UserResponse response = userService.updateUser(1L, request);

        assertThat(response).isNotNull();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("updateUser: jelszó megadva -> jelszó is frissül")
    void updateUser_withPassword_updatesPassword() {
        UserRequest request = new UserRequest();
        request.setEmail("updated@test.com");
        request.setRole(Role.COMPANY_USER);
        request.setPassword("newpassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));
        when(passwordEncoder.encode("newpassword123")).thenReturn("newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(companyUser);

        userService.updateUser(1L, request);

        verify(passwordEncoder, times(1)).encode("newpassword123");
    }

    // deactivateUser / activateUser tesztek

    @Test
    @DisplayName("deactivateUser: sikeresen deaktiválja a usert")
    void deactivateUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));

        userService.deactivateUser(1L);

        assertThat(companyUser.isActive()).isFalse();
        verify(userRepository, times(1)).save(companyUser);
    }

    @Test
    @DisplayName("activateUser: sikeresen aktiválja a usert")
    void activateUser_success() {
        companyUser.setActive(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));

        userService.activateUser(1L);

        assertThat(companyUser.isActive()).isTrue();
        verify(userRepository, times(1)).save(companyUser);
    }

    @Test
    @DisplayName("deactivateUser: nem létező user -> ResourceNotFoundException")
    void deactivateUser_notFound_throwsResourceNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deactivateUser(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // resetPassword tesztek

    @Test
    @DisplayName("resetPassword: sikeresen megváltoztatja a jelszót")
    void resetPassword_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(companyUser));
        when(passwordEncoder.encode("newpassword")).thenReturn("newHashedPassword");

        userService.resetPassword(1L, "newpassword");

        verify(passwordEncoder, times(1)).encode("newpassword");
        verify(userRepository, times(1)).save(companyUser);
        assertThat(companyUser.getPasswordChangedAt()).isNotNull();
    }

    @Test
    @DisplayName("resetPassword: túl rövid jelszó -> BusinessException")
    void resetPassword_tooShort_throwsBusinessException() {
        assertThatThrownBy(() -> userService.resetPassword(1L, "abc"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PASSWORD_TOO_SHORT");
    }

    @Test
    @DisplayName("resetPassword: null jelszó -> BusinessException")
    void resetPassword_null_throwsBusinessException() {
        assertThatThrownBy(() -> userService.resetPassword(1L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PASSWORD_TOO_SHORT");
    }

    // getMe tesztek

    @Test
    @DisplayName("getMe: COMPANY_USER esetén visszaadja a cég adatait")
    void getMe_companyUser_returnsCompanyData() {
        UserResponse response = userService.getMe(companyUser);

        assertThat(response.getEmail()).isEqualTo("user@test.com");
        assertThat(response.getCreditBalance()).isEqualByComparingTo("10000.00");
        assertThat(response.getCompanyName()).isEqualTo("Test Co");
    }

    @Test
    @DisplayName("getMe: DISPATCHER esetén visszaadja a saját kredit egyenlegét")
    void getMe_dispatcher_returnsCreditBalance() {
        UserResponse response = userService.getMe(dispatcher);

        assertThat(response.getEmail()).isEqualTo("dispatcher@test.com");
        assertThat(response.getCreditBalance()).isEqualByComparingTo("5000.00");
        assertThat(response.getCompanyName()).isNull();
    }

    // getUsersByCompany tesztek

    @Test
    @DisplayName("getUsersByCompany: visszaadja a cég összes userét")
    void getUsersByCompany_returnsUsers() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(userRepository.findByCompany(company)).thenReturn(List.of(companyUser));

        List<UserResponse> responses = userService.getUsersByCompany(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getEmail()).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("getUsersByCompany: nem létező company -> ResourceNotFoundException")
    void getUsersByCompany_companyNotFound_throwsResourceNotFoundException() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUsersByCompany(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}




































