package com.bank.api.controller;

import com.bank.model.AppUser;
import com.bank.model.TempUser;
import com.bank.repository.UserRepository;
import com.bank.service.*;
import com.bank.dto.RegistrationRequest;
import com.bank.dto.OtpVerificationRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Random;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class RegistrationController {

    private static final String PASSWORD_REGEX =
            "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$";
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final OtpService otpService;
    private final RateLimitService rateLimitService;
    private final AuditService auditService;
    private final TempUserStorage tempStorage;

    public RegistrationController(UserRepository userRepo,
                                  PasswordEncoder encoder,
                                  OtpService otpService,
                                  RateLimitService rateLimitService,
                                  AuditService auditService,
                                  TempUserStorage tempStorage) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.otpService = otpService;
        this.rateLimitService = rateLimitService;
        this.auditService = auditService;
        this.tempStorage = tempStorage;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegistrationRequest request,
            HttpServletRequest httpRequest) {

        // Rate limiting check
        if (rateLimitService.isRateLimited(httpRequest.getRemoteAddr())) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Too many requests. Please try again later."));
        }

        // Existing user check
        if (userRepo.existsById(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Username already exists"));
        }

        // Password validation
        if (!PASSWORD_PATTERN.matcher(request.getPassword()).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Password must contain 8+ characters with uppercase, lowercase, number and special character"));
        }

        // Generate and send OTP
        String otp = generateOtp();
        otpService.sendOtp(request.getPhoneNumber(), otp);

        // Store temporary user data
        TempUser tempUser = new TempUser(
                request.getUsername(),
                encoder.encode(request.getPassword()),
                request.getRole(),
                request.getPhoneNumber(),
                otp,
                Instant.now().plus(5, ChronoUnit.MINUTES)
        );
        tempStorage.save(tempUser);

        // Audit log
        auditService.logRegistrationAttempt(
                httpRequest.getRemoteAddr(),
                request.getUsername(),
                "OTP_SENT"
        );

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent to registered phone number",
                "expires_in", "5 minutes"
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        // Retrieve temporary user
        TempUser tempUser = tempStorage.findByUsername(request.getUsername());

        // Check if user exists
        if (tempUser == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid verification request"
            ));
        }

        // Verify OTP
        if (!tempUser.verifyOtp(request.getOtp())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid OTP or OTP expired"
            ));
        }

        // Create permanent user
        AppUser newUser = tempUser.toAppUser();
        userRepo.save(newUser);

        // Remove temporary user
        tempStorage.delete(tempUser.username());

        // Audit log
        auditService.logRegistrationAttempt(
                request.getUsername(),
                "REGISTRATION_COMPLETE"
        );

        return ResponseEntity.ok(Map.of(
                "message", "Registration successful",
                "username", newUser.getUsername()
        ));
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}