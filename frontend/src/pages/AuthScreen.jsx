import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Briefcase, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const AuthScreen = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email.toLowerCase().endsWith('@saveetha.com')) {
      setError('Only @saveetha.com email addresses are allowed.');
      setLoading(false);
      return;
    }
    try {
      if (isSignUp) { await signup(email, password); setSuccess(true); }
      else           { await login(email, password);  navigate('/'); }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <Briefcase size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            CampusConnect
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Saveetha University Gig Marketplace
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24 }}>
            {isSignUp ? 'Register with your Saveetha email' : 'Sign in to your account'}
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid #FECACA',
              color: 'var(--error)', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }} className="animate-fade-in">
              <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, marginBottom: 8 }}>Verification Email Sent</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                We sent a verification link to <strong>{email}</strong>. Please verify before signing in.
              </p>
              <Link to="/login" onClick={() => setSuccess(false)} className="btn-primary" style={{ display: 'inline-flex' }}>
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="form-input-container">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={13} /> Email Address
                </label>
                <input
                  id="email-input"
                  type="email" className="form-input"
                  placeholder="name@saveetha.com"
                  required value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="form-input-container" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lock size={13} /> Password
                </label>
                <input
                  id="password-input"
                  type="password" className="form-input"
                  placeholder="••••••••"
                  required value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button id="login-submit-btn" type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Please wait…' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>

              <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                {isSignUp ? 'Already have an account? ' : 'New to CampusConnect? '}
                <Link to={isSignUp ? '/login' : '/signup'}
                  style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {isSignUp ? 'Sign In' : 'Create account'}
                </Link>
              </p>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-hint)', marginTop: 20 }}>
          Restricted to verified Saveetha University members only
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
