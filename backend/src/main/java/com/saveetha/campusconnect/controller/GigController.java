package com.saveetha.campusconnect.controller;

import com.saveetha.campusconnect.model.GigModel;
import com.saveetha.campusconnect.model.UserModel;
import com.saveetha.campusconnect.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gigs")
public class GigController {

    @Autowired
    private FirestoreService firestoreService;

    private String getCurrentUid() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> getAllGigs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double minBudget,
            @RequestParam(required = false) Double maxBudget) {
        try {
            List<GigModel> gigs = firestoreService.getGigs(category, status, minBudget, maxBudget);
            return ResponseEntity.ok(gigs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyGigs() {
        try {
            List<GigModel> gigs = firestoreService.getUserGigs(getCurrentUid());
            return ResponseEntity.ok(gigs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGig(@PathVariable String id) {
        try {
            GigModel gig = firestoreService.getGig(id);
            if (gig == null) {
                return ResponseEntity.status(404).body("Gig not found.");
            }
            return ResponseEntity.ok(gig);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createGig(@RequestBody GigModel gig) {
        try {
            String uid = getCurrentUid();
            UserModel client = firestoreService.getUser(uid);
            
            gig.setClientId(uid);
            gig.setClientName(client != null ? client.getName() : "Anonymous");
            gig.setClientAvatarUrl(client != null ? client.getAvatarUrl() : null);
            
            String id = firestoreService.createGig(gig);
            gig.setId(id);
            return ResponseEntity.ok(gig);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGig(@PathVariable String id) {
        try {
            GigModel gig = firestoreService.getGig(id);
            if (gig == null) {
                return ResponseEntity.status(404).body("Gig not found.");
            }
            if (!gig.getClientId().equals(getCurrentUid())) {
                return ResponseEntity.status(403).body("Not authorized to delete this gig.");
            }
            firestoreService.deleteGig(id);
            return ResponseEntity.ok(Map.of("message", "Gig deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<?> submitDelivery(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {
        try {
            String message = (String) payload.get("message");
            @SuppressWarnings("unchecked")
            List<String> urls = (List<String>) payload.get("urls");
            
            firestoreService.submitDelivery(id, message, urls);
            return ResponseEntity.ok(Map.of("message", "Delivery submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/revision")
    public ResponseEntity<?> requestRevision(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        try {
            String notes = payload.get("notes");
            firestoreService.requestRevision(id, notes);
            return ResponseEntity.ok(Map.of("message", "Revision requested successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
