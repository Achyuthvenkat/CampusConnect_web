package com.saveetha.campusconnect.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TeamModel {
    private String id;
    private String name;
    private String creatorId;
    private List<String> members = new ArrayList<>();
    private Map<String, String> memberNames = new HashMap<>();
    private Map<String, String> memberAvatars = new HashMap<>();
    private List<String> skills = new ArrayList<>();
    private Long createdAt;

    public TeamModel() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String creatorId) { this.creatorId = creatorId; }

    public List<String> getMembers() { return members; }
    public void setMembers(List<String> members) { this.members = members; }

    public Map<String, String> getMemberNames() { return memberNames; }
    public void setMemberNames(Map<String, String> memberNames) { this.memberNames = memberNames; }

    public Map<String, String> getMemberAvatars() { return memberAvatars; }
    public void setMemberAvatars(Map<String, String> memberAvatars) { this.memberAvatars = memberAvatars; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

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
