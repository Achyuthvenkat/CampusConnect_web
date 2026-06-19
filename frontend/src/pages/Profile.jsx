import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Star, Bookmark, Clock, GraduationCap, MessageSquare, Link as LinkIcon, ExternalLink, Edit, X } from 'lucide-react';

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

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

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

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditDept(profile.department || 'Computer Science');
    setEditRate(profile.hourlyRate ? String(profile.hourlyRate) : '0');
    setEditBio(profile.bio || '');
    setEditSkills(profile.skills || []);
    setEditError('');
    setShowEditModal(true);
  };

  const handleSkillToggle = (skill) => {
    if (editSkills.includes(skill)) {
      setEditSkills(editSkills.filter(s => s !== skill));
    } else {
      setEditSkills([...editSkills, skill]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setEditError('');

    if (!editName.trim()) {
      setEditError('Full name is required.');
      setUpdating(false);
      return;
    }

    try {
      const payload = {
        name: editName.trim(),
        department: editDept,
        hourlyRate: parseFloat(editRate) || 0,
        bio: editBio.trim(),
        skills: editSkills
      };
      await api.put('/users/profile', payload);
      setProfile(p => ({ ...p, ...payload }));
      await reloadProfile();
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.response?.data || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
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
            <>
              <button className="btn-outlined" onClick={handleToggleAvailability}>
                <Clock size={15} />
                {profile.availability ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button className="btn-primary" onClick={handleOpenEdit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={15} /> Edit Profile
              </button>
            </>
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto', border: '1.5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 15 }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Department</label>
                <select
                  className="form-input"
                  value={editDept}
                  onChange={e => setEditDept(e.target.value)}
                  style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  {[
                    'Computer Science',
                    'Information Technology',
                    'BioTechnology',
                    'Electronics & Communication',
                    'Mechanical Engineering',
                    'Management Studies',
                    'Dental Sciences'
                  ].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  required
                  value={editRate}
                  onChange={e => setEditRate(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12 }}>About (Bio)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Describe your skills, portfolio, and experience..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--background)' }}>
                  {[
                    'React JS', 'Flutter', 'Firebase', 'Java Boot', 'Python', 'Machine Learning',
                    'Graphic Design', 'UI/UX Design', 'Video Editing', 'Content Writing', 
                    'PPT Presentation', 'Lab Report Helper', 'Logo Design', 'Web Scraping'
                  ].map(skill => {
                    const active = editSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: active ? 'none' : '1px solid var(--border)',
                          background: active ? 'var(--primary)' : 'var(--background)',
                          color: active ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-primary" onClick={() => setShowEditModal(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} disabled={updating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
