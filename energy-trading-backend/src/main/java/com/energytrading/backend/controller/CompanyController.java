package com.energytrading.backend.controller;

import com.energytrading.backend.dto.CompanyRequest;
import com.energytrading.backend.dto.CompanyResponse;
import com.energytrading.backend.dto.CompanyWithUserRequest;
import com.energytrading.backend.dto.PageResponse;
import com.energytrading.backend.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping
    public ResponseEntity<PageResponse<CompanyResponse>> getAllCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Boolean active
    ) {
        return ResponseEntity.ok(companyService.getAllCompanies(page, size, sort, direction, search, active));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable("id") Long id){
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(@RequestBody CompanyRequest request){
        return ResponseEntity.ok(companyService.createCompany(request));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(@RequestBody CompanyRequest request,
                                                         @PathVariable("id") Long id){
        return ResponseEntity.ok(companyService.updateCompany(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateCompany(@PathVariable("id") Long id){
        companyService.deactivateCompany(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateCompany(@PathVariable("id") Long id){
        companyService.activateCompany(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping("/with-user")
    public ResponseEntity<CompanyResponse> createCompanyWithUser(@RequestBody CompanyWithUserRequest request){
        return ResponseEntity.ok(companyService.createCompanyWithUser(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable("id") Long id){
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }
}
