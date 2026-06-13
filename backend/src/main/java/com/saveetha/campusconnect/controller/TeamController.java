package com.saveetha.campusconnect.controller;

import com.saveetha.campusconnect.model.TeamModel;
import com.saveetha.campusconnect.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private FirestoreService firestoreService;

    private String getCurrentUid() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody TeamModel team) {
        try {
            String uid = getCurrentUid();
            team.setCreatorId(uid);
            String id = firestoreService.createTeam(team);
            team.setId(id);
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyTeams() {
        try {
            List<TeamModel> teams = firestoreService.getUserTeams(getCurrentUid());
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTeam(@PathVariable String id) {
        try {
            TeamModel team = firestoreService.getTeam(id);
            if (team == null) {
                return ResponseEntity.status(404).body("Team not found.");
            }
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String memberId = payload.get("memberId");
            if (memberId == null || memberId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("memberId is required.");
            }
            
            TeamModel team = firestoreService.getTeam(id);
            if (team == null) {
                return ResponseEntity.status(404).body("Team not found.");
            }
            
            // Only creator can add members
            if (!team.getCreatorId().equals(getCurrentUid())) {
                return ResponseEntity.status(403).body("Only the team creator can add members.");
            }
            
            firestoreService.addTeamMember(id, memberId);
            return ResponseEntity.ok(Map.of("message", "Member added successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable String id, @PathVariable String memberId) {
        try {
            TeamModel team = firestoreService.getTeam(id);
            if (team == null) {
                return ResponseEntity.status(404).body("Team not found.");
            }
            
            // Only creator can kick members, but members can leave themselves
            String currentUid = getCurrentUid();
            if (!team.getCreatorId().equals(currentUid) && !memberId.equals(currentUid)) {
                return ResponseEntity.status(403).body("Not authorized to remove this member.");
            }
            
            // Creator cannot be removed (creator must delete the team if they want to leave)
            if (team.getCreatorId().equals(memberId)) {
                return ResponseEntity.badRequest().body("Creator cannot be removed from the team.");
            }
            
            firestoreService.removeTeamMember(id, memberId);
            return ResponseEntity.ok(Map.of("message", "Member removed successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
