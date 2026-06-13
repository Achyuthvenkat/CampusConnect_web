package com.saveetha.campusconnect.model;

import java.util.ArrayList;
import java.util.List;

public class UserModel {
    private String uid;
    private String name;
    private String email;
    private String avatarUrl;
    private String bio;
    private String department;
    private List<String> skills = new ArrayList<>();
    private boolean isFreelancer;
    private double rating;
    private int reviewCount;
    private boolean availability;
    private double hourlyRate;
    private List<String> bookmarks = new ArrayList<>();
    private List<String> portfolio = new ArrayList<>();
    private Long createdAt;
    private String userType;
    private boolean profileComplete;
    private int year;
    private List<String> externalLinks = new ArrayList<>();
    private List<String> portfolioUrls = new ArrayList<>();

    public UserModel() {}

    public UserModel(String uid, String name, String email, String avatarUrl, String bio,
                     String department, List<String> skills, boolean isFreelancer, double rating,
                     int reviewCount, boolean availability, double hourlyRate,
                     List<String> bookmarks, List<String> portfolio, Long createdAt) {
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.department = department;
        this.skills = skills != null ? skills : new ArrayList<>();
        this.isFreelancer = isFreelancer;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.availability = availability;
        this.hourlyRate = hourlyRate;
        this.bookmarks = bookmarks != null ? bookmarks : new ArrayList<>();
        this.portfolio = portfolio != null ? portfolio : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    @com.google.cloud.firestore.annotation.PropertyName("isFreelancer")
    @com.fasterxml.jackson.annotation.JsonProperty("isFreelancer")
    public boolean isFreelancer() { 
        return isFreelancer || "freelancer".equals(userType) || "both".equals(userType); 
    }

    @com.google.cloud.firestore.annotation.PropertyName("isFreelancer")
    @com.fasterxml.jackson.annotation.JsonProperty("isFreelancer")
    public void setFreelancer(boolean freelancer) { 
        isFreelancer = freelancer; 
    }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    @com.google.cloud.firestore.annotation.PropertyName("availability")
    @com.fasterxml.jackson.annotation.JsonProperty("availability")
    public boolean isAvailability() { return availability; }

    @com.google.cloud.firestore.annotation.PropertyName("availability")
    @com.fasterxml.jackson.annotation.JsonProperty("availability")
    public void setAvailability(boolean availability) { this.availability = availability; }

    public double getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(double hourlyRate) { this.hourlyRate = hourlyRate; }

    public List<String> getBookmarks() { return bookmarks; }
    public void setBookmarks(List<String> bookmarks) { this.bookmarks = bookmarks; }

    public List<String> getPortfolio() { return portfolio; }
    public void setPortfolio(List<String> portfolio) { this.portfolio = portfolio; }

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
                // Reflection fallback for other timestamp types
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

    @com.google.cloud.firestore.annotation.PropertyName("userType")
    @com.fasterxml.jackson.annotation.JsonProperty("userType")
    public String getUserType() { return userType; }

    @com.google.cloud.firestore.annotation.PropertyName("userType")
    @com.fasterxml.jackson.annotation.JsonProperty("userType")
    public void setUserType(String userType) { 
        this.userType = userType; 
        if ("freelancer".equals(userType) || "both".equals(userType)) {
            this.isFreelancer = true;
        }
    }

    public boolean isProfileComplete() { return profileComplete; }
    public void setProfileComplete(boolean profileComplete) { this.profileComplete = profileComplete; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public List<String> getExternalLinks() { return externalLinks; }
    public void setExternalLinks(List<String> externalLinks) { this.externalLinks = externalLinks; }

    public List<String> getPortfolioUrls() { return portfolioUrls; }
    public void setPortfolioUrls(List<String> portfolioUrls) { this.portfolioUrls = portfolioUrls; }
}
