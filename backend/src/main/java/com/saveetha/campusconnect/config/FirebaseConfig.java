package com.saveetha.campusconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {
    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.project-id}")
    private String projectId;

    @Value("${firebase.database-url}")
    private String databaseUrl;

    @Value("${firebase.config-path}")
    private String configPath;

    @Bean
    public FirebaseApp initializeFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        try {
            GoogleCredentials credentials = null;

            // 1. Try loading from specified file path
            if (configPath != null && !configPath.trim().isEmpty()) {
                try {
                    log.info("Attempting to initialize Firebase from specified file: {}", configPath);
                    credentials = GoogleCredentials.fromStream(new FileInputStream(configPath));
                } catch (IOException ex) {
                    log.warn("Could not load credentials from path '{}': {}", configPath, ex.getMessage());
                }
            }

            // 2. Fall back to Application Default Credentials
            if (credentials == null) {
                try {
                    log.info("Attempting to initialize Firebase using Application Default Credentials...");
                    credentials = GoogleCredentials.getApplicationDefault();
                } catch (IOException e) {
                    log.warn("Application Default Credentials not found. Firebase may not be able to connect to live services.");
                    throw new RuntimeException(
                        "Firebase credentials are not configured. " +
                        "Set firebase.config-path in application.properties or configure GOOGLE_APPLICATION_CREDENTIALS.", e);
                }
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .setDatabaseUrl(databaseUrl)
                    .build();

            FirebaseApp app = FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK successfully initialized for project: {}", projectId);
            return app;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage(), e);
            throw new RuntimeException("Firebase initialization error", e);
        }
    }
}
