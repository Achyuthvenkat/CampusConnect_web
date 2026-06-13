import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { User, Briefcase, GraduationCap, DollarSign, ArrowRight, Check } from 'lucide-react';

const ProfileSetup = () => {
  const { currentUser, reloadProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [bio, setBio] = useState('');
  const [isFreelancer, setIsFreelancer] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('500');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [avatarPreset, setAvatarPreset] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departments = [
    'Computer Science',
    'Information Technology',
    'BioTechnology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Management Studies',
    'Dental Sciences'
  ];

  const availableSkills = [
    'React JS', 'Flutter', 'Firebase', 'Java Boot', 'Python', 'Machine Learning',
    'Graphic Design', 'UI/UX Design', 'Video Editing', 'Content Writing', 
    'PPT Presentation', 'Lab Report Helper', 'Logo Design', 'Web Scraping'
  ];

  const presets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  ];

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Please provide your full name.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: currentUser.email,
        avatarUrl: presets[avatarPreset - 1],
        bio: bio.trim(),
        department,
        isFreelancer,
        hourlyRate: isFreelancer ? Double.parseDouble(hourlyRate) : 0,
        skills: selectedSkills,
        availability: true,
        bookmarks: [],
        portfolio: []
      };

      // Workaround for Double parsing in raw JS
      payload.hourlyRate = isFreelancer ? parseFloat(hourlyRate) : 0.0;

      await api.post('/users/setup', payload);
      await reloadProfile(); // Refresh context profileExists to true
      navigate('/');
    } catch (e) {
      setError(e.response?.data || 'Failed to initialize profile. Please review the form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', marginBottom: '8px' }}>Setup Academic Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Complete your profile to join Saveetha University's premier skills exchange.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Preset Avatar Selection */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>Choose a Profile Avatar</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {presets.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setAvatarPreset(i + 1)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    padding: '3px',
                    border: avatarPreset === (i + 1) ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img 
                    src={url} 
                    alt={`Avatar ${i+1}`} 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {avatarPreset === (i + 1) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'var(--primary)',
                      color: '#0f172a',
                      borderRadius: '50%',
                      padding: '2px'
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Full Name */}
            <div className="form-input-container">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Achyuth Venkat"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="form-input-container">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={14} /> Academic Department
              </label>
              <select 
                className="form-input"
                style={{ appearance: 'none', background: 'rgba(30, 41, 59, 0.6)' }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} style={{ background: '#1e293b', color: 'var(--text-primary)' }}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Role Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Are you seeking gigs or posting projects?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div 
                onClick={() => setIsFreelancer(true)}
                className={`glass-panel ${isFreelancer ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isFreelancer ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                  backgroundColor: isFreelancer ? 'var(--primary-glow)' : 'rgba(30, 41, 59, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isFreelancer && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px' }}>Freelancer</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>I want to offer my skills and earn.</span>
                </div>
              </div>

              <div 
                onClick={() => setIsFreelancer(false)}
                className={`glass-panel ${!isFreelancer ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: !isFreelancer ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                  backgroundColor: !isFreelancer ? 'var(--primary-glow)' : 'rgba(30, 41, 59, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {!isFreelancer && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px' }}>Client</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>I want to post gigs and hire.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Rate (Only visible if Freelancer) */}
          {isFreelancer && (
            <div className="form-input-container animate-fade-in" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} /> Expected Hourly Rate (₹ / hr)
              </label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="500"
                min="0"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
          )}

          {/* Professional Bio */}
          <div className="form-input-container">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} /> Professional Description / Bio
            </label>
            <textarea 
              className="form-input" 
              placeholder="Tell other students about your experience, past academic projects, and how you can help..."
              rows={4}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Skills Tag Selector */}
          <div style={{ marginBottom: '32px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '10px' }}>Select Core Academic & Digital Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <span
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`skill-chip selectable ${isSelected ? 'selected' : ''}`}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', height: '50px' }}
            disabled={loading}
          >
            {loading ? 'Initializing Profile...' : 'Complete Profile Setup'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
