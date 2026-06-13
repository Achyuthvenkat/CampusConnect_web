import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import {
  Briefcase, Play, CheckCircle, ChevronRight,
  FileText, Clock, Users, ArrowRight, AlertCircle
} from 'lucide-react';

const formatINR = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const StatusBadge = ({ status }) => {
  const map = {
    open:                { cls: 'badge-open',     label: 'Open' },
    'in-progress':       { cls: 'badge-progress', label: 'In Progress' },
    'in-review':         { cls: 'badge-review',   label: 'In Review' },
    'revision-requested':{ cls: 'badge-overdue',  label: 'Revision' },
    completed:           { cls: 'badge-done',     label: 'Completed' },
    done:                { cls: 'badge-done',     label: 'Completed' },
    pending:             { cls: 'badge-done',     label: 'Pending' },
    accepted:            { cls: 'badge-open',     label: 'Accepted ✓' },
    rejected:            { cls: 'badge-overdue',  label: 'Rejected' },
  };
  const { cls, label } = map[status] || { cls: 'badge-done', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [myGigs, setMyGigs]         = useState([]);
  const [myBids, setMyBids]         = useState([]);
  const [bidGigs, setBidGigs]       = useState({});   // gigId -> GigModel
  const [loading, setLoading]       = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gigsRes, bidsRes] = await Promise.all([
        api.get('/gigs/my'),
        api.get('/bids/my'),
      ]);
      const gigs = gigsRes.data;
      const bids = bidsRes.data;
      setMyGigs(gigs);
      setMyBids(bids);

      // Fetch gig details for each bid so we can show the title
      const gigIds = [...new Set(bids.map(b => b.gigId).filter(Boolean))];
      const gigFetches = await Promise.allSettled(
        gigIds.map(id => api.get(`/gigs/${id}`).then(r => ({ id, gig: r.data })))
      );
      const gigMap = {};
      gigFetches.forEach(r => {
        if (r.status === 'fulfilled') gigMap[r.value.id] = r.value.gig;
      });
      setBidGigs(gigMap);
    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Categorize posted gigs
  const openGigs     = myGigs.filter(g => g.status === 'open');
  const activeGigs   = myGigs.filter(g => ['in-progress', 'in-review', 'revision-requested'].includes(g.status));
  const completedGigs = myGigs.filter(g => ['completed', 'done'].includes(g.status));

  // Categorize bids
  const acceptedBids = myBids.filter(b => b.status === 'accepted');
  const pendingBids  = myBids.filter(b => b.status === 'pending');
  const otherBids    = myBids.filter(b => !['accepted', 'pending'].includes(b.status));

  // Stat card counts
  const statCards = [
    { label: 'Posted',  value: myGigs.length,    icon: Briefcase,   bg: '#EEF0FE', color: 'var(--primary)' },
    { label: 'Active',  value: activeGigs.length, icon: Play,        bg: '#CCFBF1', color: 'var(--teal)' },
    { label: 'Done',    value: completedGigs.length, icon: CheckCircle, bg: '#DCFCE7', color: 'var(--success)' },
  ];

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>My Dashboard</h1>
        <button className="btn-primary" onClick={() => navigate('/create-gig')} style={{ padding: '10px 18px', fontSize: 13 }}>
          + Post a Gig
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: 16, padding: '18px 16px' }}>
            <Icon size={22} color={color} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── ACTIVE WORK: Accepted Bids (most important section) ── */}
      {acceptedBids.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            Active Work ({acceptedBids.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acceptedBids.map(bid => {
              const gig = bidGigs[bid.gigId];
              return (
                <div key={bid.id} className="card"
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    border: '1.5px solid var(--primary)',
                    background: 'linear-gradient(135deg, #fff 0%, var(--primary-light) 100%)'
                  }}
                  onClick={() => navigate(`/gigs/${bid.gigId}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <StatusBadge status="accepted" />
                        {gig && <StatusBadge status={gig.status} />}
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                        {gig?.title || 'View Gig Details'}
                      </h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Your bid: {formatINR(bid.proposedPrice || bid.amount)} · {bid.deliveryDays} day delivery
                      </p>
                      {gig?.status === 'in-progress' && (
                        <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 6 }}>
                          ✅ You are hired — click to submit your work
                        </p>
                      )}
                      {gig?.status === 'in-review' && (
                        <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, marginTop: 6 }}>
                          ⏳ Work submitted — waiting for client review
                        </p>
                      )}
                    </div>
                    <ArrowRight size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Gigs (Owner view: bid accepted, work ongoing) ── */}
      {activeGigs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: 'pulse 2s infinite' }} />
            Active Contracts — You're the Client ({activeGigs.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeGigs.map(gig => (
              <div key={gig.id} className="card"
                style={{ padding: '16px 20px', cursor: 'pointer', border: '1.5px solid var(--teal)', background: 'linear-gradient(135deg, #fff 0%, #CCFBF1 100%)' }}
                onClick={() => navigate(`/gigs/${gig.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <StatusBadge status={gig.status} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{gig.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Budget: {formatINR(gig.budget)} · {gig.bidCount} bids received
                    </p>
                    {gig.status === 'in-progress' && (
                      <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, marginTop: 6 }}>
                        👷 Freelancer is working — click to monitor or review
                      </p>
                    )}
                    {gig.status === 'in-review' && (
                      <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 6 }}>
                        📋 Work submitted — click to review and approve
                      </p>
                    )}
                    {gig.status === 'revision-requested' && (
                      <p style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600, marginTop: 6 }}>
                        🔁 Revision requested — waiting for freelancer
                      </p>
                    )}
                  </div>
                  <ArrowRight size={18} color="var(--teal)" style={{ flexShrink: 0, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── My Posted Gigs ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title">My Posted Gigs</h2>
        {myGigs.length === 0 ? (
          <div className="card empty-state">
            <Briefcase size={36} />
            <h3>No gigs posted yet</h3>
            <p>Post your first gig to start receiving proposals.</p>
            <button className="btn-primary" onClick={() => navigate('/create-gig')} style={{ marginTop: 8 }}>
              Post a Gig
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myGigs.map(gig => (
              <div key={gig.id} className="card"
                style={{ padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => navigate(`/gigs/${gig.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={gig.clientAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.clientName||'U')}&background=3B53F5&color=fff&size=60`}
                    alt={gig.clientName}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {gig.title}
                      </h4>
                      <StatusBadge status={gig.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <FileText size={11} /> {formatINR(gig.budget)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users size={11} /> {gig.bidCount} bids
                      </span>
                      {gig.deadline && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} />
                          {(() => {
                            const d = Math.ceil((gig.deadline - Date.now()) / 86400000);
                            return d <= 0 ? <span style={{ color: 'var(--error)' }}>Overdue</span> : `${d} days left`;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-hint)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending Bids ── */}
      {pendingBids.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 className="section-title">Pending Bids ({pendingBids.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingBids.map(bid => {
              const gig = bidGigs[bid.gigId];
              return (
                <div key={bid.id} className="card"
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => navigate(`/gigs/${bid.gigId}`)}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      {gig?.title || 'Gig Details'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Bid: {formatINR(bid.proposedPrice || bid.amount)} · {bid.deliveryDays} days delivery
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={bid.status} />
                    <ChevronRight size={15} color="var(--text-hint)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Other Bids (rejected / completed) ── */}
      {otherBids.length > 0 && (
        <div>
          <h2 className="section-title">Past Bids</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherBids.map(bid => {
              const gig = bidGigs[bid.gigId];
              return (
                <div key={bid.id} className="card"
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}
                  onClick={() => navigate(`/gigs/${bid.gigId}`)}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      {gig?.title || 'Gig Details'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatINR(bid.proposedPrice || bid.amount)} · {bid.deliveryDays} days
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={bid.status} />
                    <ChevronRight size={15} color="var(--text-hint)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for bids section */}
      {myBids.length === 0 && (
        <div>
          <h2 className="section-title">My Bids</h2>
          <div className="card empty-state">
            <AlertCircle size={36} />
            <h3>No bids placed yet</h3>
            <p>Browse gigs and place your first bid.</p>
            <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: 8 }}>
              Explore Gigs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
