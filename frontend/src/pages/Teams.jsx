import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Plus, Trash2, UserPlus, Search, 
  Sparkles, Check, Crown, ArrowRight, Laptop 
} from 'lucide-react';

const skillOptions = [
  'Flutter', 'React', 'SpringBoot', 'UI/UX', 'Figma', 
  'Node.js', 'Python', 'Machine Learning', 'Copywriting', 
  'Graphics Design', 'Academics', 'Video Editing'
];

const Teams = () => {
  const { currentUser } = useAuth();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);
  
  // Create Team state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Search members state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams/my');
      setTeams(res.data);
      if (res.data.length > 0) {
        // Keep active team reference updated if it exists
        if (activeTeam) {
          const updatedActive = res.data.find(t => t.id === activeTeam.id);
          setActiveTeam(updatedActive || res.data[0]);
        } else {
          setActiveTeam(res.data[0]);
        }
      } else {
        setActiveTeam(null);
      }
    } catch (e) {
      console.error("Failed to load teams", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const payload = {
        name: newTeamName.trim(),
        skills: selectedSkills
      };
      const res = await api.post('/teams', payload);
      setNewTeamName('');
      setSelectedSkills([]);
      setShowCreateModal(false);
      await loadTeams();
      setActiveTeam(res.data);
    } catch (e) {
      console.error("Failed to create team", e);
    }
  };

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const searchMembers = async (queryVal) => {
    setMemberSearchQuery(queryVal);
    if (!queryVal.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(queryVal)}`);
      // Filter out users who are already in the team
      const existingMembers = activeTeam?.members || [];
      const filtered = res.data.filter(user => !existingMembers.includes(user.uid));
      setSearchResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (memberId) => {
    if (!activeTeam) return;
    try {
      await api.post(`/teams/${activeTeam.id}/members`, { memberId });
      setMemberSearchQuery('');
      setSearchResults([]);
      await loadTeams();
    } catch (e) {
      console.error("Failed to add member", e);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeTeam) return;
    if (window.confirm("Are you sure you want to remove this member from the team?")) {
      try {
        await api.delete(`/teams/${activeTeam.id}/members/${memberId}`);
        await loadTeams();
      } catch (e) {
        console.error("Failed to remove member", e);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Colleague Teams</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Form professional student teams and bid on multi-role campus contracts
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Create a Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 180px)', minHeight: 480 }}>
        
        {/* Left Side: Teams List Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} color="var(--primary)" /> My Teams ({teams.length})
            </h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {loading && teams.length === 0 ? (
              <div className="spinner-wrap" style={{ height: 100 }}><div className="spinner" /></div>
            ) : teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-hint)' }}>
                <Users size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 12 }}>You haven't created or joined any teams yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teams.map(t => {
                  const isSelected = activeTeam?.id === t.id;
                  const isCreator = t.creatorId === currentUser?.uid;
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setActiveTeam(t)}
                      style={{
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        background: isSelected ? 'rgba(59,83,245,0.1)' : 'transparent',
                        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                      className={isSelected ? '' : 'glass-card-hover'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </h4>
                        {isCreator && <Crown size={12} color="var(--warning)" style={{ flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {t.members?.length || 1} members · {t.skills?.length || 0} skills
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Team Dashboard Panel */}
        {activeTeam ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, height: '100%' }}>
            
            {/* Team Details & Members List */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{activeTeam.name}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Created by {activeTeam.memberNames?.[activeTeam.creatorId] || 'Creator'} · Active Campus Group
                    </p>
                  </div>
                  {activeTeam.creatorId === currentUser?.uid && (
                    <span className="badge badge-open" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Crown size={11} /> Creator View
                    </span>
                  )}
                </div>

                {/* Team Skills list */}
                {activeTeam.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {activeTeam.skills.map(s => (
                      <span key={s} className="skill-chip" style={{ fontSize: 11, padding: '3px 10px' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Members listing */}
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Team Members ({activeTeam.members?.length || 0})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeTeam.members?.map(memberId => {
                  const name = activeTeam.memberNames?.[memberId] || 'User';
                  const avatarUrl = activeTeam.memberAvatars?.[memberId];
                  const isCreator = memberId === activeTeam.creatorId;
                  const isMe = memberId === currentUser?.uid;

                  return (
                    <div key={memberId} className="card" style={{ padding: '12px 16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img 
                          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B53F5&color=fff&size=60`} 
                          alt={name}
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {name} {isMe && <span style={{ fontSize: 10, color: 'var(--text-hint)', fontWeight: 500 }}>(You)</span>}
                          </h4>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isCreator ? <><Crown size={10} color="var(--warning)" /> Creator</> : 'Member'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Kick action button for creator only */}
                      {activeTeam.creatorId === currentUser?.uid && !isCreator && (
                        <button 
                          onClick={() => handleRemoveMember(memberId)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          className="glass-card-hover"
                          title="Remove Member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Right Panel: Add Teammates Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTeam.creatorId === currentUser?.uid ? (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Invite Teammates</h3>
                  
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }} size={13} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search student by name..."
                      style={{ paddingLeft: 30, fontSize: 12, borderRadius: 10, paddingRight: 10 }}
                      value={memberSearchQuery}
                      onChange={e => searchMembers(e.target.value)}
                    />
                  </div>

                  {/* Search results */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                    {searching ? (
                      <div className="spinner-wrap" style={{ height: 40 }}><div className="spinner" style={{ width: 15, height: 15 }} /></div>
                    ) : searchResults.length === 0 && memberSearchQuery.trim() ? (
                      <p style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'center' }}>No students found.</p>
                    ) : (
                      searchResults.map(user => (
                        <div key={user.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: 'var(--background)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <img 
                              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B53F5&color=fff&size=40`}
                              alt={user.name}
                              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                          </div>
                          <button 
                            onClick={() => handleAddMember(user.uid)}
                            className="btn-primary" 
                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <UserPlus size={10} /> Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Group Trust</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    This is a collaborative team formed by Saveetha students. Gigs can be bid on and completed collectively by this group.
                  </p>
                </div>
              )}

              <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--surface) 0%, rgba(59,83,245,0.05) 100%)' }}>
                <Laptop size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Multi-Role Bidding</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Look for gigs flagged as 👥 **Team Gig** on the Gig Board to submit collaborative bids on behalf of your team.
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="card empty-state" style={{ height: '100%', justifyContent: 'center' }}>
            <Users size={48} />
            <h3>No Active Team Selected</h3>
            <p>Select a team from the sidebar, or create a brand-new campus team to get started!</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: 8 }}>
              Create a Team
            </button>
          </div>
        )}
      </div>

      {/* ─── CREATE TEAM MODAL ─── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 24, border: '1.5px solid var(--primary)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--primary)" /> Create a Student Team
            </h2>
            
            <form onSubmit={handleCreateTeam}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Team Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="E.g., App Architects, Pixel Perfect..."
                  required
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Key Skills / Focus Areas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 10 }}>
                  {skillOptions.map(skill => {
                    const active = selectedSkills.includes(skill);
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
                        {active ? <><Check size={10} style={{ display: 'inline', marginRight: 3 }} /> {skill}</> : skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-primary" onClick={() => setShowCreateModal(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Teams;
