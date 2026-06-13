import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Users, Trash2, Award } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true); setActionError(''); setActionSuccess('');
    try {
      const docs = await api.get('/admin/doctors');
      setDoctors(docs);
      const users = await api.get('/admin/users');
      setUsersList(users);
    } catch (err) { console.error('Fetch admin data error:', err); setActionError('Failed to load directory data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleApproveDoctor = async (docId) => {
    setActionError(''); setActionSuccess('');
    try { const res = await api.put(`/admin/doctors/${docId}/approve`, { status: 'active' }); setActionSuccess(res.message); fetchDashboardData(); }
    catch (err) { setActionError(err.message || 'Approval failed.'); }
  };

  const handleSuspendDoctor = async (docId) => {
    setActionError(''); setActionSuccess('');
    try { const res = await api.put(`/admin/doctors/${docId}/approve`, { status: 'suspended' }); setActionSuccess(res.message); fetchDashboardData(); }
    catch (err) { setActionError(err.message || 'Suspension failed.'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user account?')) return;
    setActionError(''); setActionSuccess('');
    try { const res = await api.delete(`/admin/users/${userId}`); setActionSuccess(res.message); fetchDashboardData(); }
    catch (err) { setActionError(err.message || 'Delete failed.'); }
  };

  const getStampClass = (status) => {
    if (status === 'active') return 'stamp-success';
    if (status === 'pending_approval') return 'stamp-pending';
    if (status === 'suspended') return 'stamp-danger';
    return 'stamp-muted';
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">System Administration</span>
        <h2 style={{ marginTop: '6px' }}>Control panel</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Audit doctor credentials, manage approvals, and user accounts.</p>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}
      {actionSuccess && <div className="form-success">{actionSuccess}</div>}

      {/* File-tab selector */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--line)' }}>
        {[
          { key: 'doctors', label: 'Doctor Approvals', icon: <Award size={14} /> },
          { key: 'users', label: 'User Directory', icon: <Users size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
              border: activeTab === tab.key ? '1px solid var(--line)' : '1px solid transparent',
              borderBottom: activeTab === tab.key ? '1px solid var(--surface)' : '1px solid transparent',
              marginBottom: '-1px', borderRadius: '8px 8px 0 0',
              fontFamily: 'var(--font-display)', fontWeight: activeTab === tab.key ? 700 : 500, fontSize: '0.85rem',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--ink-soft)',
              transition: 'all 120ms ease-out',
              boxShadow: activeTab === tab.key ? 'var(--shadow-card)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}><div className="spinner"></div></div>
      ) : activeTab === 'doctors' ? (
        /* Doctors */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {doctors.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No doctor accounts in system.</p>
          ) : (
            doctors.map((doc) => (
              <div key={doc.doctor_id} className="card card-static" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1.05rem' }}>{doc.full_name}</h4>
                    <span className={`stamp ${getStampClass(doc.doctor_status)}`}>{doc.doctor_status.replace('_', ' ')}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                    {doc.specialization} · {doc.treatment_type}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span><strong>Email:</strong> {doc.email}</span>
                    <span><strong>PMDC:</strong> <span className="font-mono">{doc.pmdc_number}</span></span>
                    <span><strong>Experience:</strong> {doc.experience_years} years</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {doc.doctor_status !== 'active' && (
                    <button onClick={() => handleApproveDoctor(doc.doctor_id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {doc.doctor_status === 'active' && (
                    <button onClick={() => handleSuspendDoctor(doc.doctor_id)} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                      <X size={14} /> Suspend
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Users Table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {usersList.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No user accounts found.</p>
          ) : (
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    {user.role === 'super_admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.id}>
                      <td style={{ fontWeight: 600 }}>{usr.full_name}</td>
                      <td>{usr.email}</td>
                      <td>
                        <span className="stamp stamp-primary stamp-sm">{usr.role.replace('_', ' ')}</span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>{new Date(usr.created_at).toLocaleDateString()}</td>
                      {user.role === 'super_admin' && (
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleDeleteUser(usr.id)} className="btn btn-icon btn-danger" style={{ width: '28px', height: '28px' }} disabled={usr.id === user.id}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
