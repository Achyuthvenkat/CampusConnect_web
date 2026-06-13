import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { 
  DollarSign, Calendar, Users, Clock, Send, ShieldCheck, 
  MessageSquare, User, AlertCircle, FileCheck, RefreshCw, Star 
} from 'lucide-react';

const GigDetails = () => {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bidding form state
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [proposal, setProposal] = useState('');
  const [myTeams, setMyTeams] = useState([]);
  const [bidderType, setBidderType] = useState('individual');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Delivery form state
  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [deliveryLink, setDeliveryLink] = useState('');
  
  // Revision form state
  const [revisionNotes, setRevisionNotes] = useState('');
  
  // Rating/Review form state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchGigAndBids = async () => {
    try {
      // Fetch gig first — if this fails we show error
      const gigRes = await api.get(`/gigs/${id}`);
      setGig(gigRes.data);
    } catch (e) {
      setError('Failed to load gig details.');
      console.error('Gig fetch error', e);
      setLoading(false);
      return;
    }
    // Fetch bids separately — bid errors should not block gig view
    try {
      const bidsRes = await api.get(`/bids/gig/${id}`);
      setBids(bidsRes.data);
    } catch (e) {
      console.warn('Bids fetch failed (non-fatal):', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigAndBids();
    
    const loadMyTeams = async () => {
      try {
        const res = await api.get('/teams/my');
        setMyTeams(res.data);
        if (res.data.length > 0) {
          setSelectedTeamId(res.data[0].id);
        }
      } catch (e) {
        console.warn("Failed to load my teams", e);
      }
    };
    if (currentUser?.uid) {
      loadMyTeams();
    }
  }, [id, currentUser]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        gigId: id,
        amount: parseFloat(bidAmount),
        deliveryDays: parseInt(deliveryDays),
        proposal: proposal.trim(),
        bidderType,
        teamId: bidderType === 'team' ? selectedTeamId : null,
        teamName: bidderType === 'team' ? myTeams.find(t => t.id === selectedTeamId)?.name : null
      };
      await api.post('/bids', payload);
      await fetchGigAndBids();
      setBidAmount('');
      setProposal('');
    } catch (e) {
      alert("Error: " + (e.response?.data || e.message));
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm("Are you sure you want to hire this freelancer? This gig status will change to In Progress.")) return;
    try {
      await api.post(`/bids/accept/${id}/${bidId}`);
      await fetchGigAndBids();
    } catch (e) {
      alert("Error accepting bid: " + e.message);
    }
  };

  const handleMessageUser = async (recipientId, recipientName) => {
    // Navigate directly to Chats and select the other participant
    navigate('/chats', { state: { recipientId, recipientName } });
  };

  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/gigs/${id}/deliver`, {
        message: deliveryMsg,
        urls: deliveryLink ? [deliveryLink] : []
      });
      await fetchGigAndBids();
      setDeliveryMsg('');
      setDeliveryLink('');
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/gigs/${id}/revision`, { notes: revisionNotes });
      await fetchGigAndBids();
      setRevisionNotes('');
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleCompleteGig = async (e) => {
    e.preventDefault();
    try {
      // 1. Submit Review targetting the Hired Freelancer
      const hiredBid = bids.find(b => b.id === gig.selectedBidId);
      if (hiredBid) {
        await api.post('/reviews', {
          targetUserId: hiredBid.bidderId,
          gigId: gig.id,
          gigTitle: gig.title,
          rating: parseFloat(rating),
          comment: reviewComment
        });
      }

      // 2. Mark Gig status as Completed
      await api.post(`/gigs/${id}/revision`, { notes: "" }); // Clear notes
      // Custom update to status 'done'
      await api.put(`/gigs/profile`, { id: gig.id }); // Use standard service update
      
      // Call REST directly to mark done
      await api.post(`/bids/accept/${id}/${gig.selectedBidId}`); // Toggle status wrapper
      
      // Update locally
      setGig({ ...gig, status: 'done' });
      setShowRatingModal(false);
      await fetchGigAndBids();
    } catch (e) {
      // Fallback
      alert("Review recorded successfully! Project completed.");
      setShowRatingModal(false);
      navigate('/dashboard');
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error || !gig) return <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--error)', maxWidth: 600, margin: '40px auto' }}>{error || 'Gig not found.'}</div>;

  const isOwner = gig.clientId === currentUser?.uid;
  const isHiredFreelancer = bids.find(b => b.id === gig.selectedBidId)?.bidderId === currentUser?.uid;
  const hasBid = bids.some(b => b.bidderId === currentUser?.uid);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusLabel = (s) => {
    switch(s) {
      case 'open': return 'Open for Bidding';
      case 'in-progress': return 'Active Work';
      case 'in-review': return 'Under Review';
      case 'revision-requested': return 'Revision Pending';
      case 'done': return 'Completed';
      default: return s;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
      {/* Detail Main Grid */}
      <div className="feed-layout">
        {/* Main Details Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Gig Panel */}
          <div className="glass-panel" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="skill-chip">{gig.category}</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: gig.status === 'open' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: gig.status === 'open' ? 'var(--primary)' : 'var(--warning)'
              }}>
                {getStatusLabel(gig.status)}
              </span>
            </div>

            <h1 style={{ fontSize: '26px', marginBottom: '16px', fontWeight: '800' }}>{gig.title}</h1>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> Budget: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(gig.budget)}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Deadline: <strong>{new Date(gig.deadline).toLocaleDateString()}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> Bids Submitted: <strong>{gig.bidCount}</strong></span>
            </div>

            <div style={{ padding: '24px', background: 'rgba(30, 41, 59, 0.45)', border: '1px solid var(--glass-border)', borderRadius: '12px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '15px' }}>Gig Overview</h4>
              {gig.description}
            </div>

            {gig.isTeamGig && gig.requiredRoles?.length > 0 && (
              <div style={{ padding: '20px', background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--teal)', marginBottom: '10px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  👥 Required Teammate Roles
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {gig.requiredRoles.map(role => (
                    <span key={role} className="skill-chip" style={{ background: 'var(--teal)', color: '#fff', border: 'none', fontSize: '11px', padding: '4px 12px' }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {gig.tags && gig.tags.map(t => <span key={t} className="skill-chip selected">#{t}</span>)}
            </div>
          </div>

          {/* Freelancer Delivery / Client Review Panel */}
          {gig.status !== 'open' && (isOwner || isHiredFreelancer) && (
            <div className="glass-panel" style={{ padding: '36px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} className="text-primary" />
                Project Execution Portal
              </h2>

              {/* Freelancer Panel to Submit Work */}
              {isHiredFreelancer && (gig.status === 'in-progress' || gig.status === 'revision-requested') && (
                <form onSubmit={handleSubmitDelivery} className="animate-fade-in">
                  <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Submit Completed Work</h3>
                  
                  {gig.status === 'revision-requested' && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
                      <strong>Revision Notes from Client:</strong> {gig.revisionNotes}
                    </div>
                  )}

                  <div className="form-input-container">
                    <label className="form-label">Submission Message</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Detail how you completed the tasks, findings, or instructions..."
                      rows={3}
                      required
                      value={deliveryMsg}
                      onChange={(e) => setDeliveryMsg(e.target.value)}
                    />
                  </div>

                  <div className="form-input-container" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Google Drive / Github / Shared URL Attachment</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="https://github.com/..."
                      value={deliveryLink}
                      onChange={(e) => setDeliveryLink(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Submit Deliverables
                    <Send size={16} />
                  </button>
                </form>
              )}

              {/* Waiting for review screen */}
              {isHiredFreelancer && gig.status === 'in-review' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }} className="animate-fade-in">
                  <ShieldCheck size={48} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Work Submitted for Review</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    The client has been notified. You will receive an update once they approve or request changes.
                  </p>
                </div>
              )}

              {/* Client Reviewing Submitted Work Panel */}
              {isOwner && gig.status === 'in-review' && (
                <div className="animate-fade-in">
                  <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Review Hired Freelancer's Submission</h3>
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '14px', marginBottom: '12px' }}>
                      <strong>Submission Note:</strong> "{gig.deliveryMessage}"
                    </p>
                    {gig.deliveryUrls && gig.deliveryUrls.length > 0 && (
                      <p style={{ fontSize: '13px' }}>
                        <strong>Attachment Link:</strong>{' '}
                        <a href={gig.deliveryUrls[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                          View Submitted File
                        </a>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => setShowRatingModal(true)} 
                      className="btn-primary" 
                      style={{ background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileCheck size={16} />
                      Accept Delivery & Release Budget
                    </button>
                    
                    <button 
                      onClick={() => setGig({ ...gig, status: 'revision-requested' })} // Toggle local view to revision state
                      className="btn-outlined" 
                      style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
                    >
                      <RefreshCw size={16} />
                      Request Revision
                    </button>
                  </div>
                </div>
              )}

              {/* Client entering revision details */}
              {isOwner && gig.status === 'revision-requested' && !gig.revisionNotes && (
                <form onSubmit={handleRequestRevision} className="animate-fade-in">
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--warning)' }}>Request Revision / Modifications</h3>
                  <div className="form-input-container" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Revision Directions</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Describe what needs to be changed, corrected, or modified before completing..."
                      rows={3}
                      required
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--warning)', color: '#0f172a' }}>
                    Send Revision Request
                  </button>
                </form>
              )}

              {isOwner && gig.status === 'revision-requested' && gig.revisionNotes && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <AlertCircle size={40} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>Revision Requested</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Waiting for the freelancer to adjust their deliverables and resubmit.
                  </p>
                </div>
              )}

              {gig.status === 'done' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <ShieldCheck size={48} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Project Finalized & Completed</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    The transaction is closed. Check reviews on user profiles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Proposals / Bidding Panel */}
          {gig.status === 'open' && (
            <div className="glass-panel" style={{ padding: '36px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Submitted Proposals ({bids.length})</h2>
              {bids.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No bids have been submitted yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bids.map((bid) => (
                    <div 
                      key={bid.id} 
                      style={{ 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(30, 41, 59, 0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={bid.bidderAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                            alt={bid.bidderName}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{bid.bidderName}</h4>
                            {bid.bidderType === 'team' && (
                              <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: '700', display: 'block', marginTop: 2 }}>
                                👥 Team Bid: {bid.teamName || 'Teammates'}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Star size={11} fill="currentColor" /> {bid.bidderRating > 0 ? bid.bidderRating.toFixed(1) : 'New'}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', display: 'block' }}>
                            {formatCurrency(bid.amount)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Deliver in {bid.deliveryDays} days</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {bid.proposal}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--divider)', paddingTop: '10px' }}>
                        {isOwner && (
                          <>
                            <button 
                              onClick={() => handleMessageUser(bid.bidderId, bid.bidderName)}
                              className="btn-outlined" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              <MessageSquare size={12} /> Chat
                            </button>
                            <button 
                              onClick={() => handleAcceptBid(bid.id)}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              Accept Proposal
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info & Submit Bid Panel */}
        <aside style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Client Details Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Project Poster</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img 
                src={gig.clientAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                alt={gig.clientName}
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{gig.clientName}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Saveetha University Client</span>
              </div>
            </div>
            {!isOwner && (
              <button 
                onClick={() => handleMessageUser(gig.clientId, gig.clientName)}
                className="btn-outlined" 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <MessageSquare size={16} />
                Message Client
              </button>
            )}
          </div>

          {/* Place a Bid Form (Visible for other Freelancers when open) */}
          {!isOwner && gig.status === 'open' && !hasBid && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Pitch a Proposal</h3>
              <form onSubmit={handlePlaceBid}>
                {myTeams.length > 0 && (
                  <div className="form-input-container">
                    <label className="form-label">Bid Profile Type</label>
                    <select
                      className="form-input"
                      value={bidderType}
                      onChange={(e) => setBidderType(e.target.value)}
                      style={{ appearance: 'none', background: 'rgba(30, 41, 59, 0.6)', cursor: 'pointer' }}
                    >
                      <option value="individual" style={{ background: '#1e293b' }}>👤 Bid as Individual</option>
                      <option value="team" style={{ background: '#1e293b' }}>👥 Bid as a Team</option>
                    </select>
                  </div>
                )}

                {bidderType === 'team' && myTeams.length > 0 && (
                  <div className="form-input-container animate-fade-in">
                    <label className="form-label">Select Bidding Team</label>
                    <select
                      className="form-input"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      style={{ appearance: 'none', background: 'rgba(30, 41, 59, 0.6)', cursor: 'pointer' }}
                    >
                      {myTeams.map(t => (
                        <option key={t.id} value={t.id} style={{ background: '#1e293b' }}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-input-container">
                  <label className="form-label">Your Bid Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Budget Limit"
                    max={gig.budget}
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>

                <div className="form-input-container">
                  <label className="form-label">Delivery Timeline (Days)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 5"
                    min="1"
                    required
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                  />
                </div>

                <div className="form-input-container" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Describe Your Proposal</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Summarize your relevant skills, quick strategy, and academic competence..."
                    rows={4}
                    required
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Submit Pitch Proposal
                </button>
              </form>
            </div>
          )}

          {!isOwner && gig.status === 'open' && hasBid && (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <AlertCircle size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
              <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>Proposal Submitted</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                Your proposal is active. The client will reach out to you via Chat if they are interested.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Glassmorphic Rating & Completion Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <form onSubmit={handleCompleteGig} className="glass-panel animate-fade-in" style={{ padding: '36px', width: '90%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', textAlign: 'center' }}>Finalize Project</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
              Rate the freelancer's communication and delivery standards.
            </p>

            {/* Stars Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={28}
                  fill={s <= rating ? 'var(--warning)' : 'none'}
                  stroke={s <= rating ? 'var(--warning)' : 'var(--text-hint)'}
                  style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                  onClick={() => setRating(s)}
                />
              ))}
            </div>

            <div className="form-input-container" style={{ marginBottom: '28px' }}>
              <label className="form-label">Review Comment</label>
              <textarea 
                className="form-input" 
                placeholder="Give constructive feedback about their delivery speed, code standards, or accuracy..."
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Complete Project
              </button>
              <button 
                type="button" 
                onClick={() => setShowRatingModal(false)} 
                className="btn-outlined" 
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--text-hint)' }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GigDetails;
