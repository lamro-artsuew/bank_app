package com.bank.repository;

import com.bank.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for AppUser entity
 */
@Repository
public interface UserRepository extends JpaRepository<AppUser, String> {
    // Spring Data JPA will automatically implement methods like findById, save, etc.

    /**
     * Find a user by their username
     * @param username the username to search for
     * @return the AppUser or null if not found
     */
    AppUser findByUsername(String username);

    /**
     * Check if a user exists with the given username
     * @param username the username to check
     * @return true if a user exists with that username
     */
    boolean existsByUsername(String username);
}