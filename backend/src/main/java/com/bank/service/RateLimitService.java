package com.bank.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for handling rate limiting of requests
 */
@Service
public class RateLimitService {

    // Store IP addresses with their request counts and reset times
    private final Map<String, RateLimitEntry> rateLimits = new ConcurrentHashMap<>();

    // Default rate limiting settings
    private static final int MAX_REQUESTS = 5; // Maximum requests allowed
    private static final Duration WINDOW = Duration.ofMinutes(15); // Time window for rate limiting

    /**
     * Checks if a request from the given IP should be rate limited
     * @param ipAddress the IP address to check
     * @return true if the request should be rate limited (blocked), false otherwise
     */
    public boolean isRateLimited(String ipAddress) {
        cleanupExpiredEntries();

        // Get or create rate limit entry for this IP
        RateLimitEntry entry = rateLimits.computeIfAbsent(
                ipAddress,
                ip -> new RateLimitEntry(MAX_REQUESTS, Instant.now().plus(WINDOW))
        );

        // Check if we need to reset the counter (time window expired)
        if (Instant.now().isAfter(entry.resetTime())) {
            entry = new RateLimitEntry(MAX_REQUESTS, Instant.now().plus(WINDOW));
            rateLimits.put(ipAddress, entry);
        }

        // Decrement the remaining requests
        int remainingRequests = entry.remainingRequests().decrementAndGet();

        // Rate limit if no requests remaining
        return remainingRequests < 0;
    }

    /**
     * Gets the number of remaining requests for the given IP
     * @param ipAddress the IP address to check
     * @return the number of remaining requests, or MAX_REQUESTS if not found
     */
    public int getRemainingRequests(String ipAddress) {
        RateLimitEntry entry = rateLimits.get(ipAddress);
        if (entry == null) {
            return MAX_REQUESTS;
        }

        // Reset if time window expired
        if (Instant.now().isAfter(entry.resetTime())) {
            return MAX_REQUESTS;
        }

        return Math.max(0, entry.remainingRequests().get());
    }

    /**
     * Gets the time until the rate limit resets for the given IP
     * @param ipAddress the IP address to check
     * @return the duration until reset, or null if not rate limited
     */
    public Duration getTimeUntilReset(String ipAddress) {
        RateLimitEntry entry = rateLimits.get(ipAddress);
        if (entry == null) {
            return null;
        }

        Instant now = Instant.now();
        if (now.isAfter(entry.resetTime())) {
            return Duration.ZERO;
        }

        return Duration.between(now, entry.resetTime());
    }

    /**
     * Removes expired rate limit entries to prevent memory leaks
     */
    private void cleanupExpiredEntries() {
        Instant now = Instant.now();
        rateLimits.entrySet().removeIf(entry -> now.isAfter(entry.getValue().resetTime()));
    }

    /**
     * Record class to store rate limit information for an IP address
     */
    private record RateLimitEntry(AtomicInteger remainingRequests, Instant resetTime) {
        RateLimitEntry(int initialRequests, Instant resetTime) {
            this(new AtomicInteger(initialRequests), resetTime);
        }
    }
}