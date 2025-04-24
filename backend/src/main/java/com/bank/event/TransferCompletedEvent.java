
package com.bank.event;

import com.bank.dto.TransferDTO;

public record TransferCompletedEvent(TransferDTO dto) {}
