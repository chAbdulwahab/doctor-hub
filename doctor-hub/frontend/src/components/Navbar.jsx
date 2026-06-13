import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Activity size={18} />
          </div>
          <span className="logo-text">
            DOCTOR<span className="logo-highlight">HUB</span>
          </span>
        </Link>

        {/* Navigation Menu */}
        <div className="navbar-menu">
          <div className="menu-links">
            <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>
            
            {user && user.role === 'patient' && (
              <>
                <Link to="/search" className={`nav-link${isActive('/search') ? ' active' : ''}`}>Find Doctors</Link>
                <Link to="/appointments" className={`nav-link${isActive('/appointments') ? ' active' : ''}`}>My Appointments</Link>
                <Link to="/history" className={`nav-link${isActive('/history') ? ' active' : ''}`}>Medical Records</Link>
              </>
            )}

            {user && user.role === 'doctor' && (
              <>
                <Link to="/doctor-dashboard" className={`nav-link${isActive('/doctor-dashboard') ? ' active' : ''}`}>Dashboard</Link>
                <Link to="/manage-clinics" className={`nav-link${isActive('/manage-clinics') ? ' active' : ''}`}>Clinics & Slots</Link>
                <Link to="/manage-assistants" className={`nav-link${isActive('/manage-assistants') ? ' active' : ''}`}>Assistants</Link>
              </>
            )}

            {user && user.role === 'assistant' && (
              <Link to="/assistant-dashboard" className={`nav-link${isActive('/assistant-dashboard') ? ' active' : ''}`}>Verification Desk</Link>
            )}

            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <Link to="/admin-dashboard" className={`nav-link${isActive('/admin-dashboard') ? ' active' : ''}`}>Admin Panel</Link>
            )}
          </div>

          <div className="menu-actions">
            {user ? (
              <div className="user-profile-widget">
                <div className="user-info">
                  <div className="avatar">
                    <User size={14} />
                  </div>
                  <span className="user-name">{user.fullName}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout-nav">
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="auth-buttons-nav">
                <Link to="/login" className="btn btn-outline btn-login-nav">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-register-nav">Get started</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation menu">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="mobile-drawer">
          <Link to="/" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Home</Link>
          {user && user.role === 'patient' && (
            <>
              <Link to="/search" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Find Doctors</Link>
              <Link to="/appointments" className="nav-link-mobile" onClick={() => setIsOpen(false)}>My Appointments</Link>
              <Link to="/history" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Medical Records</Link>
            </>
          )}
          {user && user.role === 'doctor' && (
            <>
              <Link to="/doctor-dashboard" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link to="/manage-clinics" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Clinics & Slots</Link>
              <Link to="/manage-assistants" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Assistants</Link>
            </>
          )}
          {user && user.role === 'assistant' && (
            <Link to="/assistant-dashboard" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Verification Desk</Link>
          )}
          {user && (user.role === 'admin' || user.role === 'super_admin') && (
            <Link to="/admin-dashboard" className="nav-link-mobile" onClick={() => setIsOpen(false)}>Admin Panel</Link>
          )}
          
          <div className="mobile-drawer-divider"></div>

          <div className="mobile-drawer-actions">
            <div></div>
            {user ? (
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-outline" onClick={() => setIsOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
