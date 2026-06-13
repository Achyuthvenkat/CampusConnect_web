package com.saveetha.campusconnect.model;

public class BidModel {
    private String id;
    private String gigId;
    private String bidderId;
    private String bidderName;
    private String bidderAvatarUrl;
    private double proposedPrice;  // internal Java field
    private double bidderRating = 0.0;
    private int deliveryDays;
    private String proposal;
    private String status = "pending";
    private Long createdAt;
    private String bidderType = "individual";
    private String teamId;
    private String teamName;

    public BidModel() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGigId() { return gigId; }
    public void setGigId(String gigId) { this.gigId = gigId; }

    public String getBidderId() { return bidderId; }
    public void setBidderId(String bidderId) { this.bidderId = bidderId; }

    public String getBidderName() { return bidderName; }
    public void setBidderName(String bidderName) { this.bidderName = bidderName; }

    public String getBidderAvatarUrl() { return bidderAvatarUrl; }
    public void setBidderAvatarUrl(String bidderAvatarUrl) { this.bidderAvatarUrl = bidderAvatarUrl; }

    public double getProposedPrice() { return proposedPrice; }
    public void setProposedPrice(double proposedPrice) { this.proposedPrice = proposedPrice; }

    // "amount" is the field name used by Flutter and the web frontend JSON
    public double getAmount() { return proposedPrice; }
    public void setAmount(double amount) { this.proposedPrice = amount; }

    public double getBidderRating() { return bidderRating; }
    public void setBidderRating(double bidderRating) { this.bidderRating = bidderRating; }

    public int getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(int deliveryDays) { this.deliveryDays = deliveryDays; }

    public String getProposal() { return proposal; }
    public void setProposal(String proposal) { this.proposal = proposal; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public String getBidderType() { return bidderType; }
    public void setBidderType(String bidderType) { this.bidderType = bidderType; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
}
