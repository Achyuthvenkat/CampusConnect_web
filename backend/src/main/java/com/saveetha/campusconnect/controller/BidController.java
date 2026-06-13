package com.saveetha.campusconnect.controller;

import com.saveetha.campusconnect.model.BidModel;
import com.saveetha.campusconnect.model.UserModel;
import com.saveetha.campusconnect.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private FirestoreService firestoreService;

    private String getCurrentUid() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    public ResponseEntity<?> placeBid(@RequestBody BidModel bid) {
        try {
            String uid = getCurrentUid();
            UserModel bidder = firestoreService.getUser(uid);
            
            bid.setBidderId(uid);
            bid.setBidderName(bidder != null ? bidder.getName() : "Anonymous");
            bid.setBidderAvatarUrl(bidder != null ? bidder.getAvatarUrl() : null);
            
            String id = firestoreService.createBid(bid);
            bid.setId(id);
            return ResponseEntity.ok(bid);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/gig/{gigId}")
    public ResponseEntity<?> getGigBids(@PathVariable String gigId) {
        try {
            List<BidModel> bids = firestoreService.getGigBids(gigId);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBids() {
        try {
            List<BidModel> bids = firestoreService.getUserBids(getCurrentUid());
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/accept/{gigId}/{bidId}")
    public ResponseEntity<?> acceptBid(@PathVariable String gigId, @PathVariable String bidId) {
        try {
            firestoreService.acceptBid(gigId, bidId);
            return ResponseEntity.ok(Map.of("message", "Bid accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
