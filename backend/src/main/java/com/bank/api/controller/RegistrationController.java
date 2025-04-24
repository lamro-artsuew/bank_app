
package com.bank.api.controller;

import com.bank.model.AppUser;
import com.bank.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class RegistrationController {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public RegistrationController(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");
        String role = payload.getOrDefault("role", "USER");

        if (repo.existsById(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "User already exists"));
        }

        AppUser newUser = new AppUser(username, encoder.encode(password), role);
        repo.save(newUser);
        return ResponseEntity.ok(Map.of("message", "User registered"));
    }
}
