import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Search, Star, Users, MapPin, Zap, BookOpen, Laptop, Paintbrush, FileText, Sparkles } from 'lucide-react';

const skillCategories = ['All', 'Development', 'Design', 'Writing', 'Academics', 'Other'];

const ExploreFreelancers = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [freelancers, setFreelancers]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedSkill, setSelectedSkill]   = useState('All');
  const [availableOnly, setAvailableOnly]   = useState(false);

  const loadFreelancers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (selectedSkill !== 'All') params.skill = selectedSkill;
      if (availableOnly) params.availableOnly = true;
      const res = await api.get('/users/search', { params });
      
      // Filter out the currently logged-in user (matching the mobile app logic)
      const filtered = currentUser?.uid
        ? res.data.filter(u => u.uid !== currentUser.uid)
        : res.data;
        
      setFreelancers(filtered);
    } catch (e) {
      console.error('Failed to load freelancers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFreelancers(); }, [selectedSkill, availableOnly]);

  const handleSearch = (e) => { e.preventDefault(); loadFreelancers(); };

  const formatINR = (v) =>
    v > 0
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v) + '/hr'
      : 'N/A';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Explore Freelancers</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Find talented Saveetha students for your project
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: 20 }}>
        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }} size={16} />
        <input
          type="text" className="form-input"
          placeholder="Search by name or skill…"
          style={{ paddingLeft: 42, borderRadius: 14, paddingRight: 110 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '8px 16px', borderRadius: 10, fontSize: 13 }}>
          Search
        </button>
      </form>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        {skillCategories.map(cat => (
          <button key={cat} onClick={() => setSelectedSkill(cat)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: selectedSkill === cat ? 'none' : '1.5px solid var(--border)',
              background: selectedSkill === cat ? 'var(--primary)' : 'var(--surface)',
              color: selectedSkill === cat ? '#fff' : 'var(--text-secondary)',
              boxShadow: selectedSkill === cat ? '0 2px 8px rgba(59,83,245,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}>
            {cat}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 8 }}>
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}
            style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
          Available only
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : freelancers.length === 0 ? (
        <div className="card empty-state">
          <Users size={40} />
          <h3>No freelancers found</h3>
          <p>Try different keywords or remove filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {freelancers.map(user => (
            <div key={user.uid} className="card"
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => navigate(`/profile/${user.uid}`)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = 'var(--divider)';
              }}>

              {/* Avatar + availability dot */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'U')}&background=3B53F5&color=fff&size=120`}
                  alt={user.name}
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--divider)' }}
                />
                {user.availability && (
                  <span style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 13, height: 13, borderRadius: '50%',
                    background: 'var(--success)', border: '2px solid white'
                  }} />
                )}
              </div>

              {/* Name + dept */}
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, color: 'var(--text-primary)' }}>{user.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{user.department}</p>

              {/* Rating + rate */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} fill="var(--warning)" color="var(--warning)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {user.rating > 0 ? user.rating.toFixed(1) : 'New'}
                  </span>
                  {user.reviewCount > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>({user.reviewCount})</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  {formatINR(user.hourlyRate)}
                </span>
              </div>

              {/* Skills */}
              {user.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {user.skills.slice(0, 4).map(s => (
                    <span key={s} className="skill-chip" style={{ fontSize: 11, padding: '3px 10px' }}>{s}</span>
                  ))}
                  {user.skills.length > 4 && (
                    <span style={{ fontSize: 11, color: 'var(--text-hint)', padding: '3px 6px' }}>+{user.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* Status */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 10, borderTop: '1px solid var(--divider)'
              }}>
                <span className={`badge ${user.availability ? 'badge-open' : 'badge-done'}`}>
                  {user.availability ? 'Available' : 'Unavailable'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View Profile →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreFreelancers;
