package com.saveetha.campusconnect.controller;

import com.saveetha.campusconnect.model.ReviewModel;
import com.saveetha.campusconnect.model.UserModel;
import com.saveetha.campusconnect.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private FirestoreService firestoreService;

    private String getCurrentUid() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewModel review) {
        try {
            String uid = getCurrentUid();
            
            // Check if already reviewed
            if (firestoreService.hasReviewed(uid, review.getTargetUserId(), review.getGigId())) {
                return ResponseEntity.badRequest().body("You have already reviewed this user for this gig.");
            }
            
            UserModel reviewer = firestoreService.getUser(uid);
            
            review.setReviewerId(uid);
            review.setReviewerName(reviewer != null ? reviewer.getName() : "Anonymous");
            review.setReviewerAvatarUrl(reviewer != null ? reviewer.getAvatarUrl() : null);
            
            firestoreService.createReview(review);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable String userId) {
        try {
            List<ReviewModel> reviews = firestoreService.getUserReviews(userId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/has-reviewed/{targetUserId}/{gigId}")
    public ResponseEntity<?> hasReviewed(@PathVariable String targetUserId, @PathVariable String gigId) {
        try {
            boolean hasReviewed = firestoreService.hasReviewed(getCurrentUid(), targetUserId, gigId);
            return ResponseEntity.ok(Map.of("hasReviewed", hasReviewed));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
