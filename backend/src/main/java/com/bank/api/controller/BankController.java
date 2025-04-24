
package com.bank.api.controller;

import com.bank.dto.TransferDTO;
import com.bank.service.BankService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@Tag(name = "Bank API", description = "Handles bank transfers")
public class BankController {

    private final BankService bankService;

    public BankController(BankService bankService) {
        this.bankService = bankService;
    }

    @Operation(summary = "Transfers money between accounts")
    @PostMapping("/transfer")
    public ResponseEntity<String> transfer(@RequestBody TransferDTO dto) {
        bankService.transfer(dto);
        return ResponseEntity.ok("Transfer successful");
    }
}
