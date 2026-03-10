package com.energytrading.backend.repository;

import com.energytrading.backend.model.Company;
import com.energytrading.backend.model.User;
import com.energytrading.backend.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findFirstByRole(Role role);
    List<User> findByCompany(Company company);
}
