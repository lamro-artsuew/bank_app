package com.bank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object for OTP verification requests
 */
public class OtpVerificationRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be 6 digits")
    private String otp;

    // Default constructor
    public OtpVerificationRequest() {
    }

    // All-args constructor
    public OtpVerificationRequest(String username, String otp) {
        this.username = username;
        this.otp = otp;
    }

    // Getters and setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}