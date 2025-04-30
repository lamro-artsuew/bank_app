package com.bank.service;

import com.bank.model.TempUser;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Service for temporary storage of users during registration process
 */
@Service
public class TempUserStorage {

    // In-memory storage for temporary users (in a real app, use a database)
    private final Map<String, TempUser> storage = new ConcurrentHashMap<>();

    // Scheduler for cleanup of expired users
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    // Cleanup interval (how often to check for expired users)
    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(15);

    /**
     * Constructor - initializes the cleanup scheduler
     */
    public TempUserStorage() {
        // Schedule regular cleanup of expired users
        scheduler.scheduleAtFixedRate(
                this::cleanupExpiredUsers,
                CLEANUP_INTERVAL.toMinutes(),
                CLEANUP_INTERVAL.toMinutes(),
                TimeUnit.MINUTES
        );
    }

    /**
     * Saves a temporary user
     * @param user the user to save
     */
    public void save(TempUser user) {
        storage.put(user.username(), user);
    }

    /**
     * Finds a temporary user by username
     * @param username the username to search for
     * @return the temporary user or null if not found
     */
    public TempUser findByUsername(String username) {
        return storage.get(username);
    }

    /**
     * Deletes a temporary user
     * @param username the username of the user to delete
     * @return true if the user was found and deleted, false otherwise
     */
    public boolean delete(String username) {
        return storage.remove(username) != null;
    }

    /**
     * Counts the number of temporary users in storage
     * @return the count of temporary users
     */
    public int count() {
        return storage.size();
    }

    /**
     * Removes temporary users with expired OTPs
     */
    public void cleanupExpiredUsers() {
        Instant now = Instant.now();
        storage.entrySet().removeIf(entry -> now.isAfter(entry.getValue().otpExpiryTime()));
    }

    /**
     * Shutdown hook - cleans up resources
     */
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}