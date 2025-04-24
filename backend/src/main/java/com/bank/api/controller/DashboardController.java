
package com.bank.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @GetMapping("/dashboard")
    public ResponseEntity<List<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(List.of(
            Map.of("from", "acc1", "to", "acc2", "amount", BigDecimal.valueOf(120)),
            Map.of("from", "acc3", "to", "acc4", "amount", BigDecimal.valueOf(300))
        ));
    }
}
