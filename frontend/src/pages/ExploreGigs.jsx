import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { Search, Calendar, Users, ArrowRight, BookOpen, Laptop, Paintbrush, FileText, Sparkles, TrendingUp } from 'lucide-react';

const categoryIcons = {
  All: Sparkles, Development: Laptop, Design: Paintbrush,
  Writing: FileText, Academics: BookOpen, Other: TrendingUp,
};
const categories = ['All', 'Development', 'Design', 'Writing', 'Academics', 'Other'];

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const StatusBadge = ({ status }) => {
  const map = {
    open:                { cls: 'badge-open',     label: 'Open' },
    'in-progress':       { cls: 'badge-progress', label: 'In Progress' },
    'in-review':         { cls: 'badge-review',   label: 'In Review' },
    'revision-requested':{ cls: 'badge-overdue',  label: 'Revision' },
    completed:           { cls: 'badge-done',     label: 'Completed' },
    done:                { cls: 'badge-done',     label: 'Completed' },
  };
  const { cls, label } = map[status] || { cls: 'badge-done', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
};

const formatDaysLeft = (deadline) => {
  if (!deadline) return 'No deadline';
  const diff = deadline - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return 'Overdue';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

const GigsBoard = () => {
  const navigate = useNavigate();
  const [gigs, setGigs]                         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus]     = useState('open');
  const [minBudget, setMinBudget]               = useState('');
  const [maxBudget, setMaxBudget]               = useState('');

  const loadGigs = async () => {
    setLoading(true);
    try {
      const params = { status: selectedStatus };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (minBudget) params.minBudget = parseFloat(minBudget);
      if (maxBudget) params.maxBudget = parseFloat(maxBudget);
      const res = await api.get('/gigs', { params });
      setGigs(res.data);
    } catch (e) {
      console.error('Failed to load gigs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGigs(); }, [selectedCategory, selectedStatus, minBudget, maxBudget]);

  const filtered = gigs.filter(g => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.title?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Campus Gig Board</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Browse gigs posted by Saveetha students by progress status
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }} size={16} />
        <input
          type="text" className="form-input"
          placeholder="Search titles, skills, tags…"
          style={{ paddingLeft: 42, borderRadius: 14 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', background: 'var(--border)', padding: 4, borderRadius: 12, marginBottom: 24, maxWidth: 360 }}>
        {['open', 'in-progress', 'completed'].map(statusKey => {
          const isSelected = selectedStatus === statusKey;
          const label = {
            'open': 'Open Gigs',
            'in-progress': 'In Progress',
            'completed': 'Completed',
          }[statusKey];
          return (
            <button
              key={statusKey}
              onClick={() => setSelectedStatus(statusKey)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: isSelected ? 'var(--surface)' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {categories.map(cat => {
          const Icon = categoryIcons[cat];
          const active = selectedCategory === cat;
          return (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: active ? 'none' : '1.5px solid var(--border)',
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-secondary)',
                boxShadow: active ? '0 2px 8px rgba(59,83,245,0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}>
              <Icon size={13} />{cat}
            </button>
          );
        })}
      </div>

      <div className="feed-layout">
        {/* Gig Feed */}
        <div>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <Users size={40} />
              <h3>No gigs found</h3>
              <p>Try different keywords or categories.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(gig => (
                <div key={gig.id} className="card animate-fade-in"
                  style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate(`/gigs/${gig.id}`)}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.borderColor = 'var(--divider)';
                  }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <img
                          src={gig.clientAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.clientName||'U')}&background=3B53F5&color=fff&size=60`}
                          alt={gig.clientName}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{gig.clientName}</span>
                        <StatusBadge status={gig.status} />
                        {gig.isTeamGig && (
                          <span className="badge badge-progress" style={{ background: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            👥 Team Gig
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{gig.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {gig.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{formatINR(gig.budget)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-hint)' }}>Fixed price</p>
                    </div>
                  </div>

                  {gig.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {gig.tags.map(t => (
                        <span key={t} style={{
                          background: 'var(--background)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border)', padding: '3px 10px',
                          borderRadius: 20, fontSize: 11, fontWeight: 500
                        }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 12, borderTop: '1px solid var(--divider)',
                    fontSize: 12, color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} /> {gig.bidCount} bids
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> {formatDaysLeft(gig.deadline)}
                      </span>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>
                      View Details <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Filters */}
        <aside style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Filter by Budget (₹)</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="number" className="form-input" placeholder="Min"
                value={minBudget} onChange={e => setMinBudget(e.target.value)} style={{ padding: '10px 12px' }} />
              <input type="number" className="form-input" placeholder="Max"
                value={maxBudget} onChange={e => setMaxBudget(e.target.value)} style={{ padding: '10px 12px' }} />
            </div>
            {(searchQuery || minBudget || maxBudget) && (
              <button onClick={() => { setSearchQuery(''); setMinBudget(''); setMaxBudget(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                Clear filters
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Academic Trust</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All members are verified Saveetha University students.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GigsBoard;
