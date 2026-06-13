import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { FileText, DollarSign, Calendar, PlusCircle, ArrowRight, HelpCircle } from 'lucide-react';

const CreateGig = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Team Gig fields
  const [isTeamGig, setIsTeamGig] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [requiredRoles, setRequiredRoles] = useState([]);

  const categories = ['Development', 'Design', 'Writing', 'Academics', 'Other'];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddRole = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = roleInput.trim();
      if (val && !requiredRoles.includes(val)) {
        setRequiredRoles([...requiredRoles, val]);
        setRoleInput('');
      }
    }
  };

  const handleRemoveRole = (role) => {
    setRequiredRoles(requiredRoles.filter(r => r !== role));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title.trim() || !description.trim()) {
      setError('Please provide a complete title and detailed description.');
      setLoading(false);
      return;
    }

    try {
      const parsedBudget = parseFloat(budget);
      if (isNaN(parsedBudget) || parsedBudget <= 0) {
        setError('Please enter a valid budget greater than ₹0.');
        setLoading(false);
        return;
      }

      const parsedDeadline = new Date(deadline).getTime();
      if (isNaN(parsedDeadline) || parsedDeadline <= Date.now()) {
        setError('Please select a valid future deadline date.');
        setLoading(false);
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: parsedBudget,
        deadline: parsedDeadline,
        tags,
        isTeamGig,
        requiredRoles: isTeamGig ? requiredRoles : [],
        attachmentUrls: [] // Preset or simulated
      };

      await api.post('/gigs', payload);
      navigate('/');
    } catch (e) {
      setError(e.response?.data || 'Failed to publish gig. Please verify your fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Post a New Campus Gig</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Describe your task, set a fair budget, and hire a verified freelancer from Saveetha University.
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
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '36px' }}>
        {/* Title */}
        <div className="form-input-container">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Project / Gig Title
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., Code a Python script to scrape website"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Category */}
          <div className="form-input-container">
            <label className="form-label">Category</label>
            <select 
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              style={{ appearance: 'none', background: 'rgba(30, 41, 59, 0.6)' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} style={{ background: '#1e293b', color: 'var(--text-primary)' }}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div className="form-input-container">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Project Budget (₹)
            </label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g., 1500"
              min="1"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Deadline */}
        <div className="form-input-container" style={{ width: '50%' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Completion Deadline
          </label>
          <input 
            type="date" 
            className="form-input" 
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Team Gig Toggle */}
        <div className="form-input-container" style={{ margin: '20px 0', padding: '16px', background: 'rgba(59,83,245,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isTeamGig} 
              onChange={(e) => setIsTeamGig(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            👥 This is a Collaborative Team Gig
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '24px' }}>
            Flag this if you want multiple students to group up and bid together for different roles.
          </p>

          {isTeamGig && (
            <div style={{ marginTop: '16px', marginLeft: '24px' }} className="animate-fade-in">
              <label className="form-label" style={{ fontSize: '12px' }}>Required Teammate Roles (Press Enter to add)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., UI/UX Designer, Flutter Developer, Spring Boot Expert"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={handleAddRole}
                style={{ fontSize: '12px', padding: '10px 12px' }}
              />
              {requiredRoles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {requiredRoles.map(role => (
                    <span 
                      key={role} 
                      onClick={() => handleRemoveRole(role)}
                      className="skill-chip selected" 
                      style={{ cursor: 'pointer', fontSize: '11px', padding: '3px 10px', background: 'var(--teal)', border: 'none' }}
                    >
                      {role} &times;
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-input-container">
          <label className="form-label">Task Description</label>
          <textarea 
            className="form-input" 
            placeholder="Outline the project scope, required deliverables, technical specifications, and key expectations..."
            rows={6}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Skill Tags */}
        <div className="form-input-container" style={{ marginBottom: '32px' }}>
          <label className="form-label">Search / Tag Skills (Press Enter to add)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., Python, Scripting, Excel"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            disabled={loading}
          />
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="skill-chip selected" 
                  onClick={() => handleRemoveTag(tag)}
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {tag} &times;
                </span>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', height: '50px' }}
          disabled={loading}
        >
          {loading ? 'Publishing Contract...' : 'Publish Campus Gig'}
          <PlusCircle size={18} />
        </button>
      </form>
    </div>
  );
};

export default CreateGig;
