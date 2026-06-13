package com.saveetha.campusconnect.controller;

import com.saveetha.campusconnect.model.UserModel;
import com.saveetha.campusconnect.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private FirestoreService firestoreService;

    private String getCurrentUid() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            UserModel user = firestoreService.getUser(getCurrentUid());
            if (user == null) {
                return ResponseEntity.status(404).body("Profile not initialized yet.");
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/setup")
    public ResponseEntity<?> setupProfile(@RequestBody UserModel userProfile) {
        try {
            String uid = getCurrentUid();
            userProfile.setUid(uid);
            userProfile.setCreatedAt(System.currentTimeMillis());
            
            // Enforce domain validation
            if (userProfile.getEmail() == null || !userProfile.getEmail().toLowerCase().endsWith("@saveetha.com")) {
                return ResponseEntity.badRequest().body("Only @saveetha.com emails are allowed.");
            }
            
            firestoreService.createUser(userProfile);
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserProfile(@PathVariable String uid) {
        try {
            UserModel user = firestoreService.getUser(uid);
            if (user == null) {
                return ResponseEntity.status(404).body("User not found.");
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates) {
        try {
            firestoreService.updateUser(getCurrentUid(), updates);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchFreelancers(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRate,
            @RequestParam(required = false, defaultValue = "false") boolean availableOnly) {
        try {
            List<UserModel> freelancers = firestoreService.searchFreelancers(query, skill, minRating, maxRate, availableOnly);
            return ResponseEntity.ok(freelancers);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // ─── BOOKMARK ENDPOINTS ──────────────────────────────────────────────────

    @PostMapping("/bookmark/{targetUserId}")
    public ResponseEntity<?> toggleBookmark(@PathVariable String targetUserId) {
        try {
            firestoreService.toggleBookmark(getCurrentUid(), targetUserId);
            return ResponseEntity.ok(Map.of("message", "Bookmark toggled successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<?> getBookmarks() {
        try {
            UserModel me = firestoreService.getUser(getCurrentUid());
            if (me == null || me.getBookmarks() == null || me.getBookmarks().isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            List<UserModel> bookmarked = firestoreService.getBookmarkedUsers(me.getBookmarks());
            return ResponseEntity.ok(bookmarked);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
