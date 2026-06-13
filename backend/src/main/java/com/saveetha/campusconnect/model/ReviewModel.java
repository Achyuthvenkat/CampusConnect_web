package com.saveetha.campusconnect.model;

public class ReviewModel {
    private String id;
    private String gigId;
    private String reviewerId;
    private String reviewerName;
    private String reviewerAvatarUrl;
    private String targetUserId;
    private double rating;
    private String comment;
    private Long createdAt;

    public ReviewModel() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGigId() { return gigId; }
    public void setGigId(String gigId) { this.gigId = gigId; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getReviewerAvatarUrl() { return reviewerAvatarUrl; }
    public void setReviewerAvatarUrl(String reviewerAvatarUrl) { this.reviewerAvatarUrl = reviewerAvatarUrl; }

    public String getTargetUserId() { return targetUserId; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Long getCreatedAt() { return createdAt; }

    public void setCreatedAt(Object createdAtObj) {
        if (createdAtObj == null) {
            this.createdAt = null;
        } else if (createdAtObj instanceof Long) {
            this.createdAt = (Long) createdAtObj;
        } else if (createdAtObj instanceof Number) {
            this.createdAt = ((Number) createdAtObj).longValue();
        } else if (createdAtObj instanceof String) {
            String s = (String) createdAtObj;
            if (s.contains(" ")) {
                s = s.replaceFirst(" ", "T");
            }
            try {
                java.time.Instant instant = java.time.Instant.parse(s);
                this.createdAt = instant.toEpochMilli();
            } catch (Exception e) {
                try {
                    this.createdAt = Long.parseLong(s);
                } catch (Exception ex) {
                    this.createdAt = null;
                }
            }
        } else if (createdAtObj instanceof com.google.cloud.Timestamp) {
            this.createdAt = ((com.google.cloud.Timestamp) createdAtObj).toDate().getTime();
        } else if (createdAtObj.getClass().getName().contains("Timestamp")) {
            try {
                java.lang.reflect.Method toDateMethod = createdAtObj.getClass().getMethod("toDate");
                java.util.Date date = (java.util.Date) toDateMethod.invoke(createdAtObj);
                this.createdAt = date.getTime();
            } catch (Exception e) {
                this.createdAt = null;
            }
        } else if (createdAtObj instanceof java.util.Date) {
            this.createdAt = ((java.util.Date) createdAtObj).getTime();
        } else {
            this.createdAt = null;
        }
    }
}
