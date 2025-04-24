
package com.bank.event;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class TransferListener {

    @EventListener
    public void onTransfer(TransferCompletedEvent event) {
        System.out.println("Transfer completed: " + event.dto());
    }
}
