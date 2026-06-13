import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Check, X, Maximize2, AlertCircle } from 'lucide-react';

export default function AssistantDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedApp, setSelectedApp] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [viewScreenshotFull, setViewScreenshotFull] = useState(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [stampAnimating, setStampAnimating] = useState(false);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const allApp = await api.get('/appointments');
      const pending = allApp.filter(a => a.appointment_status === 'payment_uploaded');
      setAppointments(pending);
      setSelectedApp(null); setPaymentDetails(null); setShowRejectForm(false);
    } catch (err) { console.error('Fetch pending payments error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPendingPayments(); }, []);

  const handleSelectApp = async (app) => {
    setSelectedApp(app); setPaymentLoading(true); setPaymentDetails(null);
    setShowRejectForm(false); setRejectionReason(''); setActionError(''); setActionSuccess(''); setStampAnimating(false);
    try {
      const payment = await api.get(`/payments/${app.appointment_id}`);
      setPaymentDetails(payment);
    } catch (err) { console.error('Fetch payment error:', err); setActionError('Could not retrieve payment records.'); }
    finally { setPaymentLoading(false); }
  };

  const handleVerify = async () => {
    if (!paymentDetails) return;
    setActionSubmitting(true); setActionError(''); setActionSuccess('');
    try {
      const res = await api.put(`/payments/${paymentDetails.id}/verify`, {});
      setActionSuccess(res.message);
      setStampAnimating(true);
      setTimeout(() => { fetchPendingPayments(); }, 2500);
    } catch (err) { setActionError(err.message || 'Verification failed.'); setActionSubmitting(false); }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) { setActionError('Rejection reason is required.'); return; }
    setActionSubmitting(true); setActionError(''); setActionSuccess('');
    try {
      const res = await api.put(`/payments/${paymentDetails.id}/reject`, { reason: rejectionReason });
      setActionSuccess(res.message);
      setTimeout(() => { fetchPendingPayments(); }, 2500);
    } catch (err) { setActionError(err.message || 'Rejection failed.'); setActionSubmitting(false); }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">Payment Operations</span>
        <h2 style={{ marginTop: '6px' }}>Verification desk</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Audit payment screenshots, verify transactions, and confirm bookings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Queue */}
        <div className="card card-static">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
            <AlertCircle size={18} style={{ color: 'var(--pending)' }} />
            <h4>Pending queue ({appointments.length})</h4>
          </div>

          {loading ? <p style={{ textAlign: 'center', padding: '20px' }}>Loading queue...</p> : appointments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '20px', fontSize: '0.9rem' }}>No payments pending. Queue is clear.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {appointments.map((app) => (
                <button key={app.appointment_id} onClick={() => handleSelectApp(app)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${selectedApp?.appointment_id === app.appointment_id ? 'var(--primary)' : 'var(--line)'}`,
                    backgroundColor: selectedApp?.appointment_id === app.appointment_id ? 'var(--primary-soft)' : 'var(--surface)',
                    transition: 'all 120ms ease-out', display: 'flex', flexDirection: 'column', gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{app.patient_name}</strong>
                    <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Rs. {parseFloat(app.consultation_fee).toLocaleString()}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    <span className="font-mono">{app.appointment_time}</span> · {new Date(app.appointment_date).toLocaleDateString()} · {app.clinic_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verification Detail */}
        <div className="card card-static" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!selectedApp ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: 'auto', padding: '20px' }}>Select a patient from the queue to start audit.</p>
          ) : (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                <h4 style={{ fontSize: '1.15rem' }}>Audit: {selectedApp.patient_name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span className="font-mono">{new Date(selectedApp.appointment_date).toLocaleDateString()}</span> · {selectedApp.appointment_time}
                </p>
              </div>

              {actionError && <div className="form-error">{actionError}</div>}
              {actionSuccess && (
                <div className="form-success" style={{ justifyContent: 'space-between' }}>
                  <span>{actionSuccess}</span>
                  {stampAnimating && <span className="stamp stamp-success stamp-animate">Verified</span>}
                </div>
              )}

              {paymentLoading ? (
                <div className="flex-center" style={{ minHeight: '150px' }}><div className="spinner"></div></div>
              ) : !paymentDetails ? (
                <p style={{ textAlign: 'center' }}>No uploaded screenshot associated.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Transaction data */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="eyebrow" style={{ fontSize: '0.7rem' }}>Amount</span>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: '1.05rem' }}>Rs. {parseFloat(paymentDetails.amount).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="eyebrow" style={{ fontSize: '0.7rem' }}>Gateway</span>
                      <div style={{ fontWeight: 600 }}>{paymentDetails.payment_method}</div>
                    </div>
                    {paymentDetails.transaction_ref && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span className="eyebrow" style={{ fontSize: '0.7rem' }}>Transaction Ref</span>
                        <div className="font-mono" style={{ fontWeight: 600 }}>{paymentDetails.transaction_ref}</div>
                      </div>
                    )}
                  </div>

                  {/* Screenshot */}
                  <div>
                    <span className="eyebrow" style={{ marginBottom: '8px', display: 'block' }}>Receipt Screenshot</span>
                    <div style={{ position: 'relative', width: '100%', height: '220px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
                      <img
                        src={`http://localhost:5000${paymentDetails.screenshot_url}`}
                        alt="Payment screenshot"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <button onClick={() => setViewScreenshotFull(true)}
                        className="btn btn-outline btn-icon"
                        style={{ position: 'absolute', right: '8px', bottom: '8px', backgroundColor: 'var(--surface)', width: '32px', height: '32px' }}>
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {!showRejectForm ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button onClick={handleVerify} className="btn btn-primary" style={{ flex: 1, padding: '12px' }} disabled={actionSubmitting}>
                        <Check size={18} /> Approve & confirm
                      </button>
                      <button onClick={() => setShowRejectForm(true)} className="btn btn-danger" style={{ flex: 1, padding: '12px' }} disabled={actionSubmitting}>
                        <X size={18} /> Reject
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRejectSubmit} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--danger)' }}>Rejection reason *</label>
                        <input type="text" className="form-input" placeholder="e.g. Reference ID missing, amount incorrect" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} required disabled={actionSubmitting} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-danger" style={{ flex: 1, padding: '10px' }} disabled={actionSubmitting}>Submit rejection</button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowRejectForm(false)} style={{ padding: '10px' }} disabled={actionSubmitting}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Overlay */}
      {viewScreenshotFull && paymentDetails && (
        <div className="flex-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(29,36,32,0.95)', zIndex: 2000 }}>
          <button onClick={() => setViewScreenshotFull(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
            <X size={30} />
          </button>
          <img src={`http://localhost:5000${paymentDetails.screenshot_url}`} alt="Full screenshot" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
