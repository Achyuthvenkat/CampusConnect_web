import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Star, Bookmark, Clock, GraduationCap, MessageSquare, Link as LinkIcon, ExternalLink } from 'lucide-react';

const formatINR = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const Profile = () => {
  const { uid } = useParams();
  const { userProfile, reloadProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          api.get(`/users/${uid}`),
          api.get(`/reviews/user/${uid}`),
        ]);
        setProfile(pRes.data);
        setReviews(rRes.data);
        if (userProfile?.bookmarks) setIsBookmarked(userProfile.bookmarks.includes(uid));
      } catch {
        setError('User profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [uid, userProfile]);

  const handleBookmark = async () => {
    await api.post(`/users/bookmark/${uid}`);
    await reloadProfile();
    setIsBookmarked(b => !b);
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    const next = !profile.availability;
    await api.put('/users/profile', { availability: next });
    setProfile(p => ({ ...p, availability: next }));
    await reloadProfile();
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error || !profile) return (
    <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--error)' }}>
      {error || 'Profile not found.'}
    </div>
  );

  const isMe = uid === userProfile?.uid;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }} className="animate-fade-in">
      {/* Profile Header Card */}
      <div className="card" style={{ padding: 32, marginBottom: 20, textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
          <img
            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name||'U')}&background=3B53F5&color=fff&size=160`}
            alt={profile.name}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--surface)' }}
          />
          {/* Online dot */}
          {profile.availability && (
            <span style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--success)', border: '2px solid white'
            }} />
          )}
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile.name}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 16 }}>
          <GraduationCap size={14} /> {profile.department}
        </p>

        {reviews.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-hint)', marginBottom: 16 }}>No reviews yet</p>
          : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 16 }}>
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>{profile.rating?.toFixed(1)}</span>
              <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>({profile.reviewCount} reviews)</span>
            </div>
          )
        }

        {/* Stats row — matches Flutter profile stat row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid var(--divider)', borderBottom: '1px solid var(--divider)', padding: '12px 0', marginBottom: 16 }}>
          {[
            { label: 'Rate', value: profile.hourlyRate > 0 ? formatINR(profile.hourlyRate) + '/hr' : 'N/A' },
            { label: 'Status', value: profile.availability ? 'Available' : 'Unavailable',
              color: profile.availability ? 'var(--success)' : 'var(--text-hint)' },
            { label: 'Skills', value: profile.skills?.length || 0 },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid var(--divider)' : 'none',
              padding: '0 12px'
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isMe ? (
            <button className="btn-outlined" onClick={handleToggleAvailability}>
              <Clock size={15} />
              {profile.availability ? 'Mark Unavailable' : 'Mark Available'}
            </button>
          ) : (
            <>
              <button className="btn-primary"
                onClick={() => navigate('/chats', { state: { recipientId: profile.uid, recipientName: profile.name } })}>
                <MessageSquare size={15} /> Hire Me
              </button>
              <button className="btn-outlined" onClick={handleBookmark}
                style={{ borderColor: isBookmarked ? 'var(--primary)' : 'var(--border)', color: isBookmarked ? 'var(--primary)' : 'var(--text-secondary)' }}>
                <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>About</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {profile.bio || 'No bio written yet.'}
        </p>
      </div>

      {/* Skills */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Skills</h3>
        {profile.skills?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.skills.map(s => (
              <span key={s} className="skill-chip">{s}</span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No skills listed.</p>
        )}
      </div>

      {/* Reviews */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>No reviews yet.</p>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={rev.reviewerAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewerName||'U')}&background=3B53F5&color=fff&size=60`}
                    alt={rev.reviewerName}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{rev.reviewerName}</span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--warning)', fontSize: 13, fontWeight: 700 }}>
                  <Star size={12} fill="currentColor" /> {rev.rating}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{rev.comment}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
