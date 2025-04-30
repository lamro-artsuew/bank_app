package com.bank.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for handling OTP generation and sending
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    /**
     * Sends an OTP to the specified phone number
     * @param phoneNumber the phone number to send the OTP to
     * @param otp the OTP to send
     * @return true if the OTP was sent successfully
     */
    public boolean sendOtp(String phoneNumber, String otp) {
        // In a real application, this would integrate with an SMS gateway
        // For demonstration purposes, we'll just log it
        logger.info("Sending OTP: {} to phone number: {}", otp, phoneNumber);

        // Simulate successful sending
        return true;
    }

    /**
     * Sends an OTP to the specified email address
     * @param email the email address to send the OTP to
     * @param otp the OTP to send
     * @return true if the OTP was sent successfully
     */
    public boolean sendOtpByEmail(String email, String otp) {
        // In a real application, this would integrate with an email service
        // For demonstration purposes, we'll just log it
        logger.info("Sending OTP: {} to email: {}", otp, email);

        // Simulate successful sending
        return true;
    }
}