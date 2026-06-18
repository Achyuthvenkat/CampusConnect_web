package com.saveetha.campusconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @GetMapping("/perf-test")
    public ResponseEntity<?> getPerfTestGigs() {
        return ResponseEntity.ok(List.of(
            Map.of("id", "gig1", "title", "Mock Web Design", "budget", 500.0, "status", "open"),
            Map.of("id", "gig2", "title", "Mock App Development", "budget", 1200.0, "status", "open"),
            Map.of("id", "gig3", "title", "Mock Content Writing", "budget", 150.0, "status", "open")
        ));
    }
}
