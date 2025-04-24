
package com.bank.api.controller;

import com.bank.model.Transaction;
import com.bank.repository.TransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final TransactionRepository txRepo;

    public AdminController(TransactionRepository txRepo) {
        this.txRepo = txRepo;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, String>>> getUsers() {
        return ResponseEntity.ok(List.of(
            Map.of("username", "admin", "role", "ADMIN"),
            Map.of("username", "user", "role", "USER")
        ));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Transaction>> getTransactions() {
        return ResponseEntity.ok(txRepo.findAll());
    }
}
