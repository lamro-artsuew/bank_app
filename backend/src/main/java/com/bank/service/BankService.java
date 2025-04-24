
package com.bank.service;

import com.bank.dto.TransferDTO;
import com.bank.event.TransferCompletedEvent;
import com.bank.exception.FraudException;
import com.bank.infrastructure.config.TransactionWebSocketHandler;
import com.bank.model.Account;
import com.bank.model.Transaction;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BankService {

    private final AccountRepository repo;
    private final TransactionRepository txnRepo;
    private final ApplicationEventPublisher publisher;

    public BankService(AccountRepository repo, TransactionRepository txnRepo, ApplicationEventPublisher publisher) {
        this.repo = repo;
        this.txnRepo = txnRepo;
        this.publisher = publisher;
    }

    public void transfer(TransferDTO dto) {
        if (dto.amount().compareTo(BigDecimal.valueOf(10_000)) > 0) {
            throw new FraudException("Suspicious transaction blocked.");
        }

        Account from = repo.findById(dto.fromAccountId()).orElseThrow();
        Account to = repo.findById(dto.toAccountId()).orElseThrow();

        from.withdraw(dto.amount());
        to.deposit(dto.amount());

        repo.saveAll(List.of(from, to));
        txnRepo.save(new Transaction(from.getId(), to.getId(), dto.amount()));
        publisher.publishEvent(new TransferCompletedEvent(dto));

        TransactionWebSocketHandler.broadcast("🔔 New Transfer: " + from.getId() + " → " + to.getId() + " ($" + dto.amount() + ")");
    }
}
