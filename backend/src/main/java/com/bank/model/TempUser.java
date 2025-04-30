package com.bank.model;

import java.time.Instant;

/**
 * Represents a temporary user during the registration process
 * with OTP verification.
 */
public record TempUser(
        String username,
        String encodedPassword,
        String role,
        String phoneNumber,
        String otp,
        Instant otpExpiryTime
) {
    /**
     * Checks if the OTP is still valid (not expired)
     * @return true if OTP is valid, false if expired
     */
    public boolean isOtpValid() {
        return Instant.now().isBefore(otpExpiryTime);
    }

    /**
     * Verifies if the provided OTP matches and is not expired
     * @param inputOtp the OTP to verify
     * @return true if OTP matches and is valid, false otherwise
     */
    public boolean verifyOtp(String inputOtp) {
        return isOtpValid() && otp.equals(inputOtp);
    }

    /**
     * Converts the temporary user to a permanent AppUser
     * @return the AppUser instance
     */
    public AppUser toAppUser() {
        return new AppUser(username, encodedPassword, role);
    }
}