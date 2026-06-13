package com.saveetha.campusconnect.model;

import java.util.ArrayList;
import java.util.List;

public class GigModel {
    private String id;
    private String clientId;
    private String clientName;
    private String clientAvatarUrl;
    private String title;
    private String description;
    private String category;
    private double budget;
    private Long deadline;
    private String status = "open";
    private String selectedBidId;
    private int bidCount;
    private List<String> attachmentUrls = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private String deliveryMessage;
    private List<String> deliveryUrls = new ArrayList<>();
    private String revisionNotes;
    private Long createdAt;
    private boolean isTeamGig;
    private List<String> requiredRoles = new ArrayList<>();

    public GigModel() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientAvatarUrl() { return clientAvatarUrl; }
    public void setClientAvatarUrl(String clientAvatarUrl) { this.clientAvatarUrl = clientAvatarUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getBudget() { return budget; }
    public void setBudget(double budget) { this.budget = budget; }

    public Long getDeadline() { return deadline; }
    public void setDeadline(Long deadline) { this.deadline = deadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSelectedBidId() { return selectedBidId; }
    public void setSelectedBidId(String selectedBidId) { this.selectedBidId = selectedBidId; }

    public int getBidCount() { return bidCount; }
    public void setBidCount(int bidCount) { this.bidCount = bidCount; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) { this.attachmentUrls = attachmentUrls; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getDeliveryMessage() { return deliveryMessage; }
    public void setDeliveryMessage(String deliveryMessage) { this.deliveryMessage = deliveryMessage; }

    public List<String> getDeliveryUrls() { return deliveryUrls; }
    public void setDeliveryUrls(List<String> deliveryUrls) { this.deliveryUrls = deliveryUrls; }

    public String getRevisionNotes() { return revisionNotes; }
    public void setRevisionNotes(String revisionNotes) { this.revisionNotes = revisionNotes; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public boolean isTeamGig() { return isTeamGig; }
    public void setTeamGig(boolean teamGig) { isTeamGig = teamGig; }

    public List<String> getRequiredRoles() { return requiredRoles; }
    public void setRequiredRoles(List<String> requiredRoles) { this.requiredRoles = requiredRoles; }
}
