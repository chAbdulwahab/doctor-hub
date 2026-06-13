import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Upload, MessageSquare, FileText, X, Clock, MapPin } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeAppointment, setActiveAppointment] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [activeChatAppointmentId, setActiveChatAppointmentId] = useState(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('JazzCash');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  const [prescription, setPrescription] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  const fetchAppointments = async () => {
    try { const data = await api.get('/appointments'); setAppointments(data); }
    catch (error) { console.error('Fetch appointments error:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const openUploadModal = (app) => {
    setActiveAppointment(app);
    setAmount(parseFloat(app.consultation_fee) || '');
    setPaymentMethod('JazzCash'); setTransactionRef(''); setScreenshotFile(null);
    setUploadError(''); setUploadSuccess(''); setShowUploadModal(true);
  };

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setScreenshotFile(e.target.files[0]); };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!screenshotFile) { setUploadError('Please choose a screenshot file to upload.'); return; }
    setUploadError(''); setUploadSuccess(''); setUploadSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('appointmentId', activeAppointment.appointment_id);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionRef', transactionRef);
      formData.append('screenshot', screenshotFile);
      await api.post('/payments', formData, true);
      setUploadSuccess('Payment proof uploaded — awaiting verification.');
      setTimeout(() => { setShowUploadModal(false); fetchAppointments(); }, 2000);
    } catch (err) { setUploadError(err.message || 'Upload failed — try a JPG or PNG under 5MB.'); }
    finally { setUploadSubmitting(false); }
  };

  const openPrescriptionModal = async (appId) => {
    setShowPrescriptionModal(true); setPrescriptionLoading(true); setPrescription(null);
    try { const data = await api.get(`/prescriptions/${appId}`); setPrescription(data); }
    catch (err) { console.error('Fetch prescription error:', err); }
    finally { setPrescriptionLoading(false); }
  };

  const getStampClass = (status) => {
    if (!status) return 'stamp-muted';
    if (status === 'confirmed' || status === 'completed' || status === 'verified') return 'stamp-success';
    if (status === 'pending' || status === 'payment_uploaded' || status === 'uploaded') return 'stamp-pending';
    if (status === 'cancelled' || status === 'rejected') return 'stamp-danger';
    return 'stamp-muted';
  };

  const upcoming = appointments.filter(a => a.appointment_status !== 'completed' && a.appointment_status !== 'cancelled');
  const past = appointments.filter(a => a.appointment_status === 'completed' || a.appointment_status === 'cancelled');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return { day: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(), full: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  };

  const renderAppointmentCard = (app) => {
    const date = formatDate(app.appointment_date);
    const isCancelled = app.appointment_status === 'cancelled';

    return (
      <div key={app.appointment_id} className={`token-stub${isCancelled ? ' token-stub-cancelled' : ''}`}>
        {/* Stub */}
        <div className="token-stub-number">
          <span className="token-id font-mono">#{app.appointment_id}</span>
          <span className="token-day">{date.day}</span>
          <span className="token-time">{app.appointment_time || 'N/A'}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', marginTop: '2px' }}>{date.full}</span>
        </div>

        {/* Details */}
        <div className="token-stub-details" style={{ gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0, color: 'var(--ink)' }}>{app.doctor_name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                {app.specialization} · {app.treatment_type}
              </p>
            </div>
            <span className={`stamp ${getStampClass(app.appointment_status)}`}>
              {(app.appointment_status || 'unknown').replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} /> {app.clinic_name} ({app.city})
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {(app.appointment_status === 'pending' || app.appointment_status === 'rejected') && (
              <button onClick={() => openUploadModal(app)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                <Upload size={14} /> Upload proof
              </button>
            )}
            {(app.appointment_status === 'confirmed' || app.appointment_status === 'completed') && (
              <button
                onClick={() => setActiveChatAppointmentId(activeChatAppointmentId === app.appointment_id ? null : app.appointment_id)}
                className={`btn ${activeChatAppointmentId === app.appointment_id ? 'btn-outline' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <MessageSquare size={14} /> {activeChatAppointmentId === app.appointment_id ? 'Close chat' : 'Consult'}
              </button>
            )}
            {app.appointment_status === 'completed' && (
              <button onClick={() => openPrescriptionModal(app.appointment_id)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                <FileText size={14} /> Prescription
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: activeChatAppointmentId ? '1fr 380px' : '1fr', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <span className="eyebrow">Your File</span>
          <h2 style={{ marginTop: '6px' }}>My appointments</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Track booking status, upload payments, and access prescriptions.</p>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '30vh' }}><div className="spinner"></div></div>
        ) : appointments.length === 0 ? (
          <div className="card flex-center" style={{ minHeight: '35vh', flexDirection: 'column', gap: '12px' }}>
            <p>No appointments yet — search for a doctor to get started.</p>
            <Link to="/search" className="btn btn-primary">Find doctors</Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="eyebrow">Upcoming</span>
                {upcoming.map(renderAppointmentCard)}
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="eyebrow" style={{ marginTop: '16px' }}>Past</span>
                {past.map(renderAppointmentCard)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Pane */}
      {activeChatAppointmentId && (
        <div className="animate-slide" style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ChatWindow appointmentId={activeChatAppointmentId} onClose={() => setActiveChatAppointmentId(null)} />
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && activeAppointment && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <button onClick={() => setShowUploadModal(false)} className="modal-close"><X size={20} /></button>
            <h3 style={{ marginBottom: '4px' }}>Upload payment proof</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
              Transfer <strong className="font-mono">Rs. {activeAppointment.consultation_fee ? parseFloat(activeAppointment.consultation_fee).toLocaleString() : '0'}</strong> and upload the receipt screenshot.
            </p>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {uploadError && <div className="form-error">{uploadError}</div>}
              {uploadSuccess && <div className="form-success">{uploadSuccess}</div>}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount Paid (Rs.)</label>
                <input type="number" className="form-input font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Gateway</label>
                <select className="form-input form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash at Clinic</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Transaction Reference (optional)</label>
                <input type="text" className="form-input font-mono" placeholder="TXN98765432" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Receipt Screenshot</label>
                <div className="drop-zone" style={{ padding: '16px' }}>
                  <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} required style={{ width: '100%' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={uploadSubmitting}>
                {uploadSubmitting ? 'Uploading...' : 'Submit payment proof'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal — Rx Pad style */}
      {showPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px', padding: 0, borderTop: '4px solid var(--primary)' }}>
            <button onClick={() => setShowPrescriptionModal(false)} className="modal-close" style={{ top: '12px', right: '12px' }}><X size={20} /></button>
            {prescriptionLoading ? (
              <div className="flex-center" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
            ) : !prescription ? (
              <div style={{ padding: '32px', textAlign: 'center' }}><p>Prescription not available.</p></div>
            ) : (
              <div className="rx-pad" style={{ border: 'none', boxShadow: 'none' }}>
                {/* Letterhead */}
                <div className="rx-pad-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>Prescription</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: 0 }}>
                      {new Date(prescription.prescription_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{prescription.doctor_name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', textTransform: 'capitalize', margin: 0 }}>{prescription.specialization} · {prescription.clinic_name}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="rx-pad-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p><strong>Diagnosis:</strong> {prescription.diagnosis || 'General wellness check'}</p>
                    {prescription.general_notes && <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '4px' }}><strong>Advice:</strong> {prescription.general_notes}</p>}
                  </div>

                  <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescription.items.map((item, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{item.medicine_name}</td>
                            <td>{item.dosage}</td>
                            <td>{item.frequency}</td>
                            <td>{item.duration || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {prescription.follow_up_in_days && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Follow up in {prescription.follow_up_in_days} days</span>
                    )}
                    <span className="stamp stamp-muted stamp-sm">Locked</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
