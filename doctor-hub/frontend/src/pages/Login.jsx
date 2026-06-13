import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Activity } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
    if (searchParams.get('expired')) {
      setNotice('Your session has expired. Please sign in again.');
    }
  }, [user]);

  const redirectUser = (role) => {
    if (role === 'patient') navigate('/search');
    else if (role === 'doctor') navigate('/doctor-dashboard');
    else if (role === 'assistant') navigate('/assistant-dashboard');
    else if (role === 'admin' || role === 'super_admin') navigate('/admin-dashboard');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      redirectUser(loggedUser.role);
    } catch (err) {
      setError(err.message || 'Credentials not recognized — check email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout animate-fade" style={{ margin: '-32px -32px 0' }}>
      {/* Brand Panel */}
      <div className="auth-panel-brand">
        <div className="logo-wordmark" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} />
          DOCTORHUB
        </div>
        <h1>Your health file,<br />one sign-in away.</h1>
        <p>
          Access your appointments, prescriptions, and immutable medical records. 
          Trusted by patients and practitioners across Pakistan.
        </p>
      </div>

      {/* Form Panel */}
      <div className="auth-panel-form">
        <div className="auth-form-card">
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Sign in to your account</h2>
            <p style={{ fontSize: '0.9rem' }}>Enter your credentials to access the portal</p>
          </div>

          {notice && <div className="form-notice">{notice}</div>}
          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : (
                <>
                  <LogIn size={18} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <p>
              New to Doctor Hub?{' '}
              <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
