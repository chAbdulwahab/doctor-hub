import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { UserPlus, UserCheck } from 'lucide-react';

export default function ManageAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssistants = async () => {
    try { const data = await api.get('/assistants'); setAssistants(data); }
    catch (err) { console.error('Fetch assistants error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssistants(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await api.post('/assistants', { fullName, email, phone, password });
      setSuccess(res.message);
      setFullName(''); setEmail(''); setPhone(''); setPassword('');
      fetchAssistants();
    } catch (err) { setError(err.message || 'Failed to create assistant.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">Team Management</span>
        <h2 style={{ marginTop: '6px' }}>Assistant accounts</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Create assistant logins to verify payments and confirm bookings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Create Form */}
        <div className="card card-static">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
            <UserPlus size={18} style={{ color: 'var(--primary)' }} /> Register assistant
          </h4>

          {error && <div className="form-error" style={{ marginBottom: '12px' }}>{error}</div>}
          {success && <div className="form-success" style={{ marginBottom: '12px' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Full Name *</label><input type="text" className="form-input" placeholder="Asma Bibi" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={submitting} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="asma@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={submitting} /></div>
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Phone</label><input type="text" className="form-input" placeholder="+923214567890" value={phone} onChange={e => setPhone(e.target.value)} disabled={submitting} /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Password *</label><input type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={submitting} /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              {submitting ? 'Registering...' : 'Create assistant account'}
            </button>
          </form>
        </div>

        {/* Assistant List */}
        <div className="card card-static">
          <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>Active assistant logins</h4>
          {loading ? <p style={{ textAlign: 'center', padding: '16px' }}>Loading...</p> : assistants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '16px', fontSize: '0.9rem' }}>No assistants registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assistants.map((assistant) => (
                <div key={assistant.assistant_id} style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--primary-soft)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{assistant.full_name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>{assistant.email} · {assistant.phone || 'No phone'}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                      Created <span className="font-mono">{new Date(assistant.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
