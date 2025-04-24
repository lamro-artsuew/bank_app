
package com.bank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TransferDTO(
    @NotBlank String fromAccountId,
    @NotBlank String toAccountId,
    @Positive BigDecimal amount
) {}
