import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { Bookmark, Star, GraduationCap, DollarSign, ArrowRight } from 'lucide-react';

const Bookmarks = () => {
  const navigate = useNavigate();
  
  const [bookmarkedUsers, setBookmarkedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/users/bookmarks');
      setBookmarkedUsers(res.data);
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bookmark size={26} className="text-primary" />
          Bookmarked Contacts
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Quick access to freelancers and collaborators you've bookmarked for your academic tasks.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}><div style={{ width: '32px', height: '32px', border: '3px solid var(--divider)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>
      ) : bookmarkedUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <Bookmark size={48} style={{ color: 'var(--text-hint)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No bookmarked students yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Browse freelancers on the Explore tab and click the bookmark button on their profiles to save them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookmarkedUsers.map((user) => (
            <div 
              key={user.uid}
              className="glass-card animate-fade-in"
              style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${user.uid}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                  alt={user.name}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{user.name}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <GraduationCap size={14} />
                      {user.department}
                    </span>
                    {user.isFreelancer && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--warning)', fontWeight: '700' }}>
                        <Star size={14} fill="currentColor" />
                        {user.rating > 0 ? user.rating.toFixed(1) : 'New'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {user.isFreelancer && user.hourlyRate > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', display: 'block' }}>
                      {formatCurrency(user.hourlyRate)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Hourly Rate</span>
                  </div>
                )}
                <span className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>
                  View Profile
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
