package com.bank.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for audit logging of security-related events
 */
@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    // In-memory storage for audit logs (in a real app, use a database)
    private final List<AuditEvent> auditLog = new ArrayList<>();
    private final Map<String, List<AuditEvent>> userAuditMap = new ConcurrentHashMap<>();

    /**
     * Logs a registration-related event
     * @param ipAddress the IP address of the request
     * @param username the username involved
     * @param eventType the type of event
     */
    public void logRegistrationAttempt(String ipAddress, String username, String eventType) {
        AuditEvent event = new AuditEvent(
                username,
                eventType,
                ipAddress,
                Instant.now()
        );

        // Add to global log
        synchronized (auditLog) {
            auditLog.add(event);
        }

        // Add to user-specific log
        userAuditMap.computeIfAbsent(username, k -> new ArrayList<>()).add(event);

        // Log to application logs
        logger.info("AUDIT: {} - {} - IP: {}", eventType, username, ipAddress);
    }

    /**
     * Overloaded method for when IP address is not available
     * @param username the username involved
     * @param eventType the type of event
     */
    public void logRegistrationAttempt(String username, String eventType) {
        logRegistrationAttempt("UNKNOWN", username, eventType);
    }

    /**
     * Gets all audit events for a specific user
     * @param username the username to retrieve events for
     * @return list of audit events for the user
     */
    public List<AuditEvent> getUserEvents(String username) {
        return userAuditMap.getOrDefault(username, List.of());
    }

    /**
     * Gets recent audit events (limited to specified count)
     * @param count the maximum number of events to return
     * @return list of recent audit events
     */
    public List<AuditEvent> getRecentEvents(int count) {
        synchronized (auditLog) {
            int size = auditLog.size();
            int start = Math.max(0, size - count);
            return new ArrayList<>(auditLog.subList(start, size));
        }
    }

    /**
     * Record representing an audit event
     */
    public record AuditEvent(
            String username,
            String eventType,
            String ipAddress,
            Instant timestamp
    ) {}
}