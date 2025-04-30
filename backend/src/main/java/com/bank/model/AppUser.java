package com.bank.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

/**
 * Entity representing a registered user in the system
 */
@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @NotBlank
    private String username;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @NotBlank
    @Column(nullable = false)
    private String role;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "last_login")
    private Instant lastLogin;

    @Column(name = "account_enabled")
    private boolean enabled;

    /**
     * Default constructor required by JPA
     */
    public AppUser() {
    }

    /**
     * Basic constructor with required fields
     */
    public AppUser(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.createdAt = Instant.now();
        this.enabled = true;
    }

    /**
     * Full constructor with all fields
     */
    public AppUser(String username, String password, String role,
                   Instant createdAt, Instant lastLogin, boolean enabled) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
        this.enabled = enabled;
    }

    // Getters and setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Instant lastLogin) {
        this.lastLogin = lastLogin;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * Updates the last login time to now
     */
    public void updateLastLogin() {
        this.lastLogin = Instant.now();
    }
}