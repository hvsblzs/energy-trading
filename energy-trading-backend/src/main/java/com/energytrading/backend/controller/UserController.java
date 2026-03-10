package com.energytrading.backend.controller;

import com.energytrading.backend.dto.UserRequest;
import com.energytrading.backend.dto.UserResponse;
import com.energytrading.backend.model.User;
import com.energytrading.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable("id") Long id){
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request){
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DISPATCHER')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@RequestBody UserRequest request,
                                                   @PathVariable("id") Long id){
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(@PathVariable("id") Long id){
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateUser(@PathVariable("id") Long id){
        userService.activateUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal User user){
        return ResponseEntity.ok(userService.getMe(user));
    }
}
