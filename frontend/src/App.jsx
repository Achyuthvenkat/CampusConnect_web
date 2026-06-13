import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  Users,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bookmark,
  User,
  LogOut,
  Compass,
} from 'lucide-react';

// Import Pages
import AuthScreen         from './pages/AuthScreen';
import ProfileSetup       from './pages/ProfileSetup';
import ExploreFreelancers from './pages/ExploreFreelancers';
import GigsBoard          from './pages/ExploreGigs';
import GigDetails         from './pages/GigDetails';
import CreateGig          from './pages/CreateGig';
import Dashboard          from './pages/Dashboard';
import Chats              from './pages/Chats';
import Profile            from './pages/Profile';
import Bookmarks          from './pages/Bookmarks';
import Teams              from './pages/Teams';

// ─── Protected Route ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, profileExists } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!profileExists && location.pathname !== '/profile-setup')
    return <Navigate to="/profile-setup" replace />;
  return children;
};

// ─── Sidebar / Shell Layout ──────────────────────────────────────────────────────
const DashboardLayout = ({ children }) => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { path: '/',           label: 'Explore',   icon: Compass },
    { path: '/gigs',       label: 'Gigs',      icon: Briefcase },
    { path: '/teams',      label: 'Teams',     icon: Users },
    { path: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
    { path: '/chats',      label: 'Messages',  icon: MessageSquare },
    { path: '/bookmarks',  label: 'Bookmarks', icon: Bookmark },
    { path: `/profile/${userProfile?.uid}`, label: 'My Profile', icon: User },
  ];

  return (
    <div className="dashboard-grid">
      {/* ── Sidebar ── */}
      <aside className="sidebar">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Briefcase size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            CampusConnect
          </span>
        </div>

        {/* User mini-card */}
        {userProfile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: 'var(--background)', marginBottom: 20
          }}>
            <img
              src={userProfile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'U')}&background=3B53F5&color=fff&size=80`}
              alt={userProfile.name}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile.name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile.department}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              location.pathname === path ||
              (path === '/gigs' && location.pathname.startsWith('/gigs/'));
            return (
              <Link key={path} to={path} className={`nav-item${isActive ? ' active' : ''}`}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12, marginTop: 12 }}>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--error)', width: '100%' }}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// ─── App ─────────────────────────────────────────────────────────────────────────
const App = () => (
  <Router>
    <AuthProvider>
      <Routes>
        <Route path="/login"  element={<AuthScreen />} />
        <Route path="/signup" element={<AuthScreen />} />
        <Route path="/profile-setup" element={
          <ProtectedRoute><ProfileSetup /></ProtectedRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/"              element={<ExploreFreelancers />} />
                <Route path="/gigs"          element={<GigsBoard />} />
                <Route path="/gigs/:id"      element={<GigDetails />} />
                <Route path="/teams"         element={<Teams />} />
                <Route path="/create-gig"    element={<CreateGig />} />
                <Route path="/dashboard"     element={<Dashboard />} />
                <Route path="/chats"         element={<Chats />} />
                <Route path="/profile/:uid"  element={<Profile />} />
                <Route path="/bookmarks"     element={<Bookmarks />} />
                <Route path="*"              element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  </Router>
);

export default App;
