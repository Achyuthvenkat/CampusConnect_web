package com.saveetha.campusconnect.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.saveetha.campusconnect.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class FirestoreService {
    private static final Logger log = LoggerFactory.getLogger(FirestoreService.class);

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // ─── USER OPERATIONS ────────────────────────────────────────────────────

    public void createUser(UserModel user) throws ExecutionException, InterruptedException {
        getDb().collection("users").document(user.getUid()).set(user).get();
        log.info("Successfully created user: {}", user.getUid());
    }

    public UserModel getUser(String uid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("users").document(uid).get().get();
        if (!doc.exists()) {
            return null;
        }
        UserModel user = doc.toObject(UserModel.class);
        if (user != null) user.setUid(doc.getId()); // Firestore doesn't auto-map doc ID
        return user;
    }

    public void updateUser(String uid, Map<String, Object> data) throws ExecutionException, InterruptedException {
        getDb().collection("users").document(uid).update(data).get();
        log.info("Successfully updated user: {}", uid);
    }

    public List<UserModel> searchFreelancers(String query, String skill, Double minRating, Double maxRate, Boolean availableOnly)
            throws ExecutionException, InterruptedException {
        
        Query q = getDb().collection("users");

        if (Boolean.TRUE.equals(availableOnly)) {
            q = q.whereEqualTo("availability", true);
        }
        if (minRating != null && minRating > 0) {
            q = q.whereGreaterThanOrEqualTo("rating", minRating);
        }
        if (maxRate != null) {
            q = q.whereLessThanOrEqualTo("hourlyRate", maxRate);
        }

        QuerySnapshot snapshot = q.get().get();
        List<UserModel> users = snapshot.getDocuments().stream()
                .map(d -> {
                    try {
                        UserModel u = d.toObject(UserModel.class);
                        if (u != null) u.setUid(d.getId());
                        return u;
                    } catch (Exception e) {
                        log.error("Failed to deserialize user document {}: {}", d.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(u -> u != null && u.isFreelancer())
                .collect(Collectors.toList());

        // Client-side filtering for text query and skill
        if (query != null && !query.trim().isEmpty()) {
            String lowercaseQuery = query.toLowerCase();
            users = users.stream().filter(u -> 
                (u.getName() != null && u.getName().toLowerCase().contains(lowercaseQuery)) ||
                (u.getDepartment() != null && u.getDepartment().toLowerCase().contains(lowercaseQuery)) ||
                (u.getSkills() != null && u.getSkills().stream().anyMatch(s -> s.toLowerCase().contains(lowercaseQuery)))
            ).collect(Collectors.toList());
        }

        if (skill != null && !skill.trim().isEmpty()) {
            String lowercaseSkill = skill.toLowerCase();
            users = users.stream().filter(u -> 
                u.getSkills() != null && u.getSkills().stream().anyMatch(s -> s.toLowerCase().equals(lowercaseSkill))
            ).collect(Collectors.toList());
        }

        return users;
    }

    // ─── BOOKMARKS ──────────────────────────────────────────────────────────

    public void toggleBookmark(String currentUserId, String targetUserId) throws ExecutionException, InterruptedException {
        DocumentReference userDoc = getDb().collection("users").document(currentUserId);
        DocumentSnapshot snapshot = userDoc.get().get();
        
        if (!snapshot.exists()) return;
        
        UserModel user = snapshot.toObject(UserModel.class);
        List<String> bookmarks = user.getBookmarks() != null ? new ArrayList<>(user.getBookmarks()) : new ArrayList<>();
        
        if (bookmarks.contains(targetUserId)) {
            bookmarks.remove(targetUserId);
        } else {
            bookmarks.add(targetUserId);
        }
        
        userDoc.update("bookmarks", bookmarks).get();
        log.info("Toggled bookmark for user: {} on target: {}", currentUserId, targetUserId);
    }

    public List<UserModel> getBookmarkedUsers(List<String> uids) throws ExecutionException, InterruptedException {
        if (uids == null || uids.isEmpty()) return new ArrayList<>();
        
        List<UserModel> bookmarked = new ArrayList<>();
        for (String uid : uids) {
            UserModel user = getUser(uid);
            if (user != null) bookmarked.add(user);
        }
        return bookmarked;
    }

    // ─── GIGS OPERATIONS ────────────────────────────────────────────────────

    /**
     * Manually maps a Firestore DocumentSnapshot to GigModel.
     * This handles the mismatch where the Flutter app stores deadline/createdAt
     * as Firestore Timestamps, but our Java model uses Long (epoch millis).
     */
    private GigModel gigFromDoc(DocumentSnapshot d) {
        if (!d.exists()) return null;
        GigModel g = new GigModel();
        g.setId(d.getId());
        g.setClientId(d.getString("clientId"));
        g.setClientName(d.getString("clientName"));
        g.setClientAvatarUrl(d.getString("clientAvatarUrl"));
        g.setTitle(d.getString("title"));
        g.setDescription(d.getString("description"));
        g.setCategory(d.getString("category"));
        Double budget = d.getDouble("budget");
        g.setBudget(budget != null ? budget : 0.0);
        g.setStatus(d.getString("status") != null ? d.getString("status") : "open");
        g.setSelectedBidId(d.getString("selectedBidId"));
        Long bidCount = d.getLong("bidCount");
        g.setBidCount(bidCount != null ? bidCount.intValue() : 0);
        g.setDeliveryMessage(d.getString("deliveryMessage"));
        g.setRevisionNotes(d.getString("revisionNotes"));

        // Handle Firestore Timestamp -> Long (millis) conversion
        Object deadlineObj = d.get("deadline");
        if (deadlineObj instanceof Timestamp) {
            g.setDeadline(((Timestamp) deadlineObj).toDate().getTime());
        } else if (deadlineObj instanceof Long) {
            g.setDeadline((Long) deadlineObj);
        }

        Object createdAtObj = d.get("createdAt");
        if (createdAtObj instanceof Timestamp) {
            g.setCreatedAt(((Timestamp) createdAtObj).toDate().getTime());
        } else if (createdAtObj instanceof Long) {
            g.setCreatedAt((Long) createdAtObj);
        }

        // Lists
        @SuppressWarnings("unchecked")
        List<String> attachmentUrls = (List<String>) d.get("attachmentUrls");
        g.setAttachmentUrls(attachmentUrls != null ? attachmentUrls : new ArrayList<>());

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) d.get("tags");
        g.setTags(tags != null ? tags : new ArrayList<>());

        @SuppressWarnings("unchecked")
        List<String> deliveryUrls = (List<String>) d.get("deliveryUrls");
        g.setDeliveryUrls(deliveryUrls != null ? deliveryUrls : new ArrayList<>());

        g.setTeamGig(Boolean.TRUE.equals(d.getBoolean("isTeamGig")));
        @SuppressWarnings("unchecked")
        List<String> requiredRoles = (List<String>) d.get("requiredRoles");
        g.setRequiredRoles(requiredRoles != null ? requiredRoles : new ArrayList<>());

        return g;
    }

    public String createGig(GigModel gig) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("gigs").document();
        gig.setId(docRef.getId());
        gig.setStatus("open");
        gig.setCreatedAt(System.currentTimeMillis());
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", gig.getId());
        data.put("clientId", gig.getClientId());
        data.put("clientName", gig.getClientName());
        data.put("clientAvatarUrl", gig.getClientAvatarUrl());
        data.put("title", gig.getTitle());
        data.put("description", gig.getDescription());
        data.put("category", gig.getCategory());
        data.put("budget", gig.getBudget());
        
        // Save deadline as Timestamp
        Long deadlineMillis = gig.getDeadline();
        if (deadlineMillis != null) {
            data.put("deadline", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                    deadlineMillis / 1000, (int)((deadlineMillis % 1000) * 1_000_000)));
        } else {
            data.put("deadline", null);
        }
        
        data.put("status", gig.getStatus());
        data.put("bidCount", gig.getBidCount());
        data.put("attachmentUrls", gig.getAttachmentUrls());
        data.put("tags", gig.getTags());
        
        // Save createdAt as Timestamp
        long nowMillis = gig.getCreatedAt();
        data.put("createdAt", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                nowMillis / 1000, (int)((nowMillis % 1000) * 1_000_000)));

        data.put("isTeamGig", gig.isTeamGig());
        data.put("requiredRoles", gig.getRequiredRoles());
                
        docRef.set(data).get();
        log.info("Successfully created gig: {}", gig.getId());
        return gig.getId();
    }

    public GigModel getGig(String gigId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("gigs").document(gigId).get().get();
        return gigFromDoc(doc);
    }

    public List<GigModel> getGigs(String category, String status, Double minBudget, Double maxBudget)
            throws ExecutionException, InterruptedException {

        Query q = getDb().collection("gigs");

        if (category != null && !category.equals("All")) {
            q = q.whereEqualTo("category", category);
        }
        // Only filter by status when explicitly requested and not 'all'
        if (status != null && !status.equalsIgnoreCase("all")) {
            q = q.whereEqualTo("status", status);
        }

        QuerySnapshot snapshot = q.get().get();
        List<GigModel> gigs = snapshot.getDocuments().stream()
                .map(this::gigFromDoc)
                .filter(g -> g != null && g.getTitle() != null)
                .collect(Collectors.toList());

        // Sort descending by creation time
        gigs.sort((a, b) -> Long.compare(
                b.getCreatedAt() != null ? b.getCreatedAt() : 0,
                a.getCreatedAt() != null ? a.getCreatedAt() : 0));

        if (minBudget != null) {
            gigs = gigs.stream().filter(g -> g.getBudget() >= minBudget).collect(Collectors.toList());
        }
        if (maxBudget != null) {
            gigs = gigs.stream().filter(g -> g.getBudget() <= maxBudget).collect(Collectors.toList());
        }

        return gigs;
    }

    public List<GigModel> getUserGigs(String userId) throws ExecutionException, InterruptedException {
        QuerySnapshot s = getDb().collection("gigs").whereEqualTo("clientId", userId).get().get();
        List<GigModel> gigs = s.getDocuments().stream()
                .map(this::gigFromDoc)
                .filter(g -> g != null)
                .collect(Collectors.toList());
        gigs.sort((a, b) -> Long.compare(
                b.getCreatedAt() != null ? b.getCreatedAt() : 0,
                a.getCreatedAt() != null ? a.getCreatedAt() : 0));
        return gigs;
    }

    public void updateGigStatus(String gigId, String status, String selectedBidId) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("status", status);
        if (selectedBidId != null) {
            data.put("selectedBidId", selectedBidId);
        }
        getDb().collection("gigs").document(gigId).update(data).get();
        log.info("Updated gig status for gig: {} to {}", gigId, status);
    }

    public void submitDelivery(String gigId, String message, List<String> urls) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "in-review");
        data.put("deliveryMessage", message);
        data.put("deliveryUrls", urls);
        getDb().collection("gigs").document(gigId).update(data).get();
        log.info("Submitted delivery for gig: {}", gigId);
    }

    public void requestRevision(String gigId, String notes) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "revision-requested");
        data.put("revisionNotes", notes);
        getDb().collection("gigs").document(gigId).update(data).get();
        log.info("Requested revision for gig: {}", gigId);
    }

    public void deleteGig(String gigId) throws ExecutionException, InterruptedException {
        getDb().collection("gigs").document(gigId).delete().get();
        log.info("Deleted gig: {}", gigId);
    }

    // ─── BIDS OPERATIONS ────────────────────────────────────────────────────

    public String createBid(BidModel bid) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb()
                .collection("gigs").document(bid.getGigId())
                .collection("bids").document();
        bid.setId(docRef.getId());
        bid.setStatus("pending");
        long nowMillis = System.currentTimeMillis();

        // Write using the exact field names that the Flutter BidModel.fromFirestore() reads.
        // Critical: Flutter reads "amount", Java model has "proposedPrice" — must use "amount".
        // Critical: Flutter reads createdAt as a Firestore Timestamp, not a Long.
        Map<String, Object> data = new HashMap<>();
        data.put("gigId",           bid.getGigId());
        data.put("bidderId",        bid.getBidderId());
        data.put("bidderName",      bid.getBidderName());
        data.put("bidderAvatarUrl", bid.getBidderAvatarUrl());
        data.put("bidderRating",    0.0);           // Flutter requires this field
        data.put("amount",          bid.getProposedPrice()); // Flutter reads "amount"
        data.put("proposal",        bid.getProposal());
        data.put("deliveryDays",    bid.getDeliveryDays());
        data.put("status",          "pending");
        data.put("createdAt",       com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                                        nowMillis / 1000, (int)((nowMillis % 1000) * 1_000_000)));

        data.put("bidderType",      bid.getBidderType());
        data.put("teamId",          bid.getTeamId());
        data.put("teamName",        bid.getTeamName());

        docRef.set(data).get();

        // Also keep Java-readable millis field for backend queries
        bid.setCreatedAt(nowMillis);

        // Increment bid count on the parent gig document
        getDb().collection("gigs").document(bid.getGigId())
               .update("bidCount", FieldValue.increment(1)).get();

        log.info("Successfully created bid: {} on gig: {}", bid.getId(), bid.getGigId());
        return bid.getId();
    }


    /**
     * Manually maps a Firestore DocumentSnapshot to BidModel.
     * Handles: "amount" -> proposedPrice, createdAt Timestamp -> Long millis.
     * Both bids from the Flutter app (Timestamp createdAt) and web (Timestamp createdAt)
     * need this to avoid ClassCastException when deserializing.
     */
    private BidModel bidFromDoc(DocumentSnapshot d) {
        if (!d.exists()) return null;
        BidModel b = new BidModel();
        b.setId(d.getId());
        b.setGigId(d.getString("gigId"));
        b.setBidderId(d.getString("bidderId"));
        b.setBidderName(d.getString("bidderName"));
        b.setBidderAvatarUrl(d.getString("bidderAvatarUrl"));

        // Flutter writes "amount"; both apps use this field
        Double amount = d.getDouble("amount");
        b.setProposedPrice(amount != null ? amount : 0.0);

        Double bidderRating = d.getDouble("bidderRating");
        b.setBidderRating(bidderRating != null ? bidderRating : 0.0);

        Long deliveryDays = d.getLong("deliveryDays");
        b.setDeliveryDays(deliveryDays != null ? deliveryDays.intValue() : 1);

        b.setProposal(d.getString("proposal"));
        b.setStatus(d.getString("status") != null ? d.getString("status") : "pending");

        // Handle both Firestore Timestamp and Long millis for createdAt
        Object createdAtObj = d.get("createdAt");
        if (createdAtObj instanceof com.google.cloud.Timestamp) {
            b.setCreatedAt(((com.google.cloud.Timestamp) createdAtObj).toDate().getTime());
        } else if (createdAtObj instanceof Long) {
            b.setCreatedAt((Long) createdAtObj);
        } else {
            b.setCreatedAt(System.currentTimeMillis());
        }

        b.setBidderType(d.getString("bidderType") != null ? d.getString("bidderType") : "individual");
        b.setTeamId(d.getString("teamId"));
        b.setTeamName(d.getString("teamName"));

        return b;
    }

    public List<BidModel> getGigBids(String gigId) throws ExecutionException, InterruptedException {
        QuerySnapshot s = getDb().collection("gigs").document(gigId).collection("bids").get().get();
        List<BidModel> bids = s.getDocuments().stream()
                .map(this::bidFromDoc)
                .filter(b -> b != null)
                .collect(Collectors.toList());
        bids.sort((a, b) -> Long.compare(
                a.getCreatedAt() != null ? a.getCreatedAt() : 0,
                b.getCreatedAt() != null ? b.getCreatedAt() : 0));
        return bids;
    }

    public List<BidModel> getUserBids(String userId) throws ExecutionException, InterruptedException {
        try {
            QuerySnapshot snapshot = getDb().collectionGroup("bids").whereEqualTo("bidderId", userId).get().get();
            List<BidModel> bids = snapshot.getDocuments().stream()
                    .map(this::bidFromDoc)
                    .filter(b -> b != null)
                    .collect(Collectors.toList());
            bids.sort((a, b) -> Long.compare(
                    b.getCreatedAt() != null ? b.getCreatedAt() : 0,
                    a.getCreatedAt() != null ? a.getCreatedAt() : 0));
            return bids;
        } catch (Exception e) {
            log.warn("Collection group query failed (possibly missing index): {}. Falling back to manual gig scanning...", e.getMessage());
            try {
                List<BidModel> bids = new ArrayList<>();
                QuerySnapshot gigsSnapshot = getDb().collection("gigs").get().get();
                for (QueryDocumentSnapshot gigDoc : gigsSnapshot.getDocuments()) {
                    QuerySnapshot bidsSnapshot = gigDoc.getReference().collection("bids")
                            .whereEqualTo("bidderId", userId).get().get();
                    for (QueryDocumentSnapshot bidDoc : bidsSnapshot.getDocuments()) {
                        BidModel b = bidFromDoc(bidDoc);
                        if (b != null) {
                            bids.add(b);
                        }
                    }
                }
                bids.sort((a, b) -> Long.compare(
                        b.getCreatedAt() != null ? b.getCreatedAt() : 0,
                        a.getCreatedAt() != null ? a.getCreatedAt() : 0));
                return bids;
            } catch (Exception ex) {
                log.error("Fallback manual scan also failed: {}", ex.getMessage());
                return new ArrayList<>();
            }
        }
    }


    public void acceptBid(String gigId, String bidId) throws ExecutionException, InterruptedException {
        WriteBatch batch = getDb().batch();
        
        // 1. Accept the selected bid
        DocumentReference bidRef = getDb().collection("gigs").document(gigId).collection("bids").document(bidId);
        batch.update(bidRef, "status", "accepted");
        
        // 2. Set gig to in-progress and link the selected bid
        DocumentReference gigRef = getDb().collection("gigs").document(gigId);
        Map<String, Object> update = new HashMap<>();
        update.put("status", "in-progress");
        update.put("selectedBidId", bidId);
        batch.update(gigRef, update);
        
        batch.commit().get();
        log.info("Successfully accepted bid: {} on gig: {}", bidId, gigId);
    }

    // ─── REVIEWS ─────────────────────────────────────────────────────────────

    public void createReview(ReviewModel review) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("reviews").document();
        review.setId(docRef.getId());
        review.setCreatedAt(System.currentTimeMillis());
        
        docRef.set(review).get();

        // Re-calculate user rating
        QuerySnapshot s = getDb().collection("reviews").whereEqualTo("targetUserId", review.getTargetUserId()).get().get();
        List<Double> ratings = s.getDocuments().stream()
                .map(d -> d.getDouble("rating"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        double avgRating = 0.0;
        if (!ratings.isEmpty()) {
            double sum = ratings.stream().mapToDouble(Double::doubleValue).sum();
            avgRating = sum / ratings.size();
        }

        Map<String, Object> update = new HashMap<>();
        update.put("rating", avgRating);
        update.put("reviewCount", ratings.size());
        
        getDb().collection("users").document(review.getTargetUserId()).update(update).get();
        log.info("Submitted review for target user: {}", review.getTargetUserId());
    }

    public List<ReviewModel> getUserReviews(String userId) throws ExecutionException, InterruptedException {
        QuerySnapshot snapshot = getDb().collection("reviews").whereEqualTo("targetUserId", userId).get().get();
        List<ReviewModel> reviews = snapshot.getDocuments().stream()
                .map(d -> { ReviewModel r = d.toObject(ReviewModel.class); if (r != null) r.setId(d.getId()); return r; })
                .filter(r -> r != null)
                .collect(Collectors.toList());
        reviews.sort((a, b) -> Long.compare(b.getCreatedAt() != null ? b.getCreatedAt() : 0, a.getCreatedAt() != null ? a.getCreatedAt() : 0));
        return reviews;
    }

    public boolean hasReviewed(String reviewerId, String targetUserId, String gigId) throws ExecutionException, InterruptedException {
        QuerySnapshot s = getDb().collection("reviews")
                .whereEqualTo("reviewerId", reviewerId)
                .whereEqualTo("targetUserId", targetUserId)
                .whereEqualTo("gigId", gigId)
                .limit(1).get().get();
        return !s.isEmpty();
    }

    // ─── TEAM OPERATIONS ───────────────────────────────────────────────────

    public String createTeam(TeamModel team) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("teams").document();
        team.setId(docRef.getId());
        team.setCreatedAt(System.currentTimeMillis());
        
        // Fetch creator details
        UserModel creator = getUser(team.getCreatorId());
        if (creator != null) {
            if (team.getMembers() == null) {
                team.setMembers(new ArrayList<>());
            }
            if (!team.getMembers().contains(team.getCreatorId())) {
                team.getMembers().add(team.getCreatorId());
            }
            team.getMemberNames().put(team.getCreatorId(), creator.getName());
            team.getMemberAvatars().put(team.getCreatorId(), creator.getAvatarUrl());
            
            // Seed skills
            if (creator.getSkills() != null) {
                team.setSkills(new ArrayList<>(creator.getSkills()));
            }
        }
        
        docRef.set(team).get();
        log.info("Successfully created team: {}", team.getId());
        return team.getId();
    }

    public TeamModel getTeam(String teamId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("teams").document(teamId).get().get();
        if (!doc.exists()) return null;
        TeamModel team = doc.toObject(TeamModel.class);
        if (team != null) team.setId(doc.getId());
        return team;
    }

    public List<TeamModel> getUserTeams(String userId) throws ExecutionException, InterruptedException {
        QuerySnapshot s = getDb().collection("teams").whereArrayContains("members", userId).get().get();
        return s.getDocuments().stream()
                .map(d -> {
                    TeamModel t = d.toObject(TeamModel.class);
                    if (t != null) t.setId(d.getId());
                    return t;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public void addTeamMember(String teamId, String memberId) throws ExecutionException, InterruptedException {
        DocumentReference teamRef = getDb().collection("teams").document(teamId);
        TeamModel team = getTeam(teamId);
        UserModel user = getUser(memberId);
        if (team == null || user == null) return;
        
        if (!team.getMembers().contains(memberId)) {
            team.getMembers().add(memberId);
            team.getMemberNames().put(memberId, user.getName());
            team.getMemberAvatars().put(memberId, user.getAvatarUrl());
            
            // Accumulate skills
            if (user.getSkills() != null) {
                for (String skill : user.getSkills()) {
                    if (!team.getSkills().contains(skill)) {
                        team.getSkills().add(skill);
                    }
                }
            }
            teamRef.set(team).get();
            log.info("Added user {} to team {}", memberId, teamId);
        }
    }

    public void removeTeamMember(String teamId, String memberId) throws ExecutionException, InterruptedException {
        DocumentReference teamRef = getDb().collection("teams").document(teamId);
        TeamModel team = getTeam(teamId);
        if (team == null) return;
        
        if (team.getMembers().contains(memberId)) {
            team.getMembers().remove(memberId);
            team.getMemberNames().remove(memberId);
            team.getMemberAvatars().remove(memberId);
            
            // Re-accumulate skills from all remaining members
            List<String> newSkills = new ArrayList<>();
            for (String mId : team.getMembers()) {
                UserModel u = getUser(mId);
                if (u != null && u.getSkills() != null) {
                    for (String skill : u.getSkills()) {
                        if (!newSkills.contains(skill)) {
                            newSkills.add(skill);
                        }
                    }
                }
            }
            team.setSkills(newSkills);
            teamRef.set(team).get();
            log.info("Removed user {} from team {}", memberId, teamId);
        }
    }
}
