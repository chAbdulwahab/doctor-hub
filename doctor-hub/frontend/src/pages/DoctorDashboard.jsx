import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Clipboard, Plus, MessageSquare, ClipboardCheck, Trash2, X, PlusCircle } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedApp, setSelectedApp] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  // Medical History Form
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [labResults, setLabResults] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [historySuccess, setHistorySuccess] = useState('');
  const [historySubmitting, setHistorySubmitting] = useState(false);

  // Prescription Form
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [followUpInDays, setFollowUpInDays] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicineName: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' }
  ]);
  const [prescError, setPrescError] = useState('');
  const [prescSuccess, setPrescSuccess] = useState('');
  const [prescSubmitting, setPrescSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try { const data = await api.get('/appointments'); setAppointments(data); }
    catch (error) { console.error('Fetch appointments error:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const openHistoryModal = (app) => {
    setSelectedApp(app); setDiagnosis(''); setChiefComplaint(app.reason_for_visit || '');
    setSymptomsInput(''); setTreatmentGiven(''); setLabResults(''); setDoctorNotes('');
    setBp(''); setPulse(''); setTemp(''); setWeight(''); setHeight('');
    setHistoryError(''); setHistorySuccess(''); setShowHistoryModal(true);
  };

  const handleHistorySubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis) { setHistoryError('Diagnosis is required.'); return; }
    setHistoryError(''); setHistorySuccess(''); setHistorySubmitting(true);
    try {
      const res = await api.post('/history', {
        patientId: selectedApp.patient_id, appointmentId: selectedApp.appointment_id,
        chiefComplaint, diagnosis,
        symptoms: symptomsInput ? symptomsInput.split(',').map(s => s.trim()).filter(Boolean) : [],
        vitalSigns: { bp, pulse, temp, weight, height },
        labResults, treatmentGiven, doctorNotes
      });
      setHistorySuccess(res.message);
      setTimeout(() => { setShowHistoryModal(false); fetchAppointments(); }, 2000);
    } catch (err) { setHistoryError(err.message || 'Failed to save record.'); }
    finally { setHistorySubmitting(false); }
  };

  const openPrescriptionModal = (app) => {
    setSelectedApp(app); setPrescriptionDiagnosis(''); setGeneralNotes(''); setFollowUpInDays('');
    setPrescriptionItems([{ medicineName: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' }]);
    setPrescError(''); setPrescSuccess(''); setShowPrescriptionModal(true);
  };

  const addPrescriptionRow = () => setPrescriptionItems([...prescriptionItems, { medicineName: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' }]);
  const removePrescriptionRow = (index) => { if (prescriptionItems.length === 1) return; setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index)); };
  const handlePrescItemChange = (index, field, value) => { const updated = [...prescriptionItems]; updated[index][field] = value; setPrescriptionItems(updated); };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (prescriptionItems.some(item => !item.medicineName || !item.dosage || !item.frequency)) {
      setPrescError('Each medicine must have name, dosage, and frequency.'); return;
    }
    setPrescError(''); setPrescSuccess(''); setPrescSubmitting(true);
    try {
      const res = await api.post('/prescriptions', {
        appointmentId: selectedApp.appointment_id, patientId: selectedApp.patient_id,
        diagnosis: prescriptionDiagnosis, generalNotes,
        followUpInDays: followUpInDays ? parseInt(followUpInDays) : null,
        items: prescriptionItems
      });
      setPrescSuccess(res.message);
      setTimeout(() => { setShowPrescriptionModal(false); fetchAppointments(); }, 2000);
    } catch (err) { setPrescError(err.message || 'Failed to issue prescription.'); }
    finally { setPrescSubmitting(false); }
  };

  const activeBookings = appointments.filter(a => a.appointment_status === 'confirmed');
  const otherBookings = appointments.filter(a => a.appointment_status !== 'confirmed');

  const getStampClass = (status) => {
    if (status === 'confirmed' || status === 'completed') return 'stamp-success';
    if (status === 'pending' || status === 'payment_uploaded') return 'stamp-pending';
    if (status === 'cancelled' || status === 'rejected') return 'stamp-danger';
    return 'stamp-muted';
  };

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: activeChatId ? '1fr 380px' : '1fr', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <span className="eyebrow">Physician Console</span>
          <h2 style={{ marginTop: '6px' }}>Consultation dashboard</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Manage patient queues, clinical notes, and prescriptions.</p>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '30vh' }}><div className="spinner"></div></div>
        ) : (
          <>
            {/* Today's tokens — horizontal scroll */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="eyebrow" style={{ color: 'var(--accent)' }}>Confirmed Patients Queue ({activeBookings.length})</span>
              </div>

              {activeBookings.length === 0 ? (
                <div className="card flex-center" style={{ padding: '24px' }}>
                  <p>No confirmed bookings in queue — waiting for payment verification.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {activeBookings.map((app) => (
                    <div key={app.appointment_id} className="token-stub" style={{ minWidth: '340px', flexShrink: 0 }}>
                      <div className="token-stub-number">
                        <span className="token-id font-mono">#{app.appointment_id}</span>
                        <span className="token-time">{app.appointment_time}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{new Date(app.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="token-stub-details" style={{ gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', margin: 0 }}>{app.patient_name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: 0 }}>{app.clinic_name}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <button onClick={() => setActiveChatId(activeChatId === app.appointment_id ? null : app.appointment_id)}
                            className={`btn ${activeChatId === app.appointment_id ? 'btn-outline' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            <MessageSquare size={12} /> {activeChatId === app.appointment_id ? 'Close' : 'Chat'}
                          </button>
                          <button onClick={() => openHistoryModal(app)} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            <Clipboard size={12} /> Record
                          </button>
                          <button onClick={() => openPrescriptionModal(app)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            <Plus size={12} /> Rx
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other appointments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="eyebrow">All Appointments</span>
              {otherBookings.length === 0 ? (
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}><p>No other appointments recorded.</p></div>
              ) : (
                <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Clinic</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherBookings.map((app) => (
                        <tr key={app.appointment_id}>
                          <td style={{ fontWeight: 600 }}>{app.patient_name}</td>
                          <td className="font-mono" style={{ fontSize: '0.85rem' }}>{new Date(app.appointment_date).toLocaleDateString()} {app.appointment_time}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{app.clinic_name}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`stamp ${getStampClass(app.appointment_status)}`}>{app.appointment_status.replace('_', ' ')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Chat pane */}
      {activeChatId && (
        <div className="animate-slide" style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <ChatWindow appointmentId={activeChatId} onClose={() => setActiveChatId(null)} />
        </div>
      )}

      {/* Medical History Modal */}
      {showHistoryModal && selectedApp && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowHistoryModal(false)} className="modal-close"><X size={20} /></button>
            <h3 style={{ marginBottom: '4px' }}>Log clinical record</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
              Patient: <strong>{selectedApp.patient_name}</strong> · Complaint: "{selectedApp.reason_for_visit || 'N/A'}"
            </p>

            <form onSubmit={handleHistorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {historyError && <div className="form-error">{historyError}</div>}
              {historySuccess && <div className="form-success">{historySuccess}</div>}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Diagnosis *</label>
                <input type="text" className="form-input" placeholder="e.g. Acute Viral Bronchitis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chief Complaint</label>
                  <input type="text" className="form-input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Symptoms (comma separated)</label>
                  <input type="text" className="form-input" placeholder="dry cough, wheezing" value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)} />
                </div>
              </div>

              {/* Vitals */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)' }}>
                <span className="eyebrow" style={{ color: 'var(--accent)', marginBottom: '10px', display: 'block' }}>Vital Signs</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ fontSize: '0.7rem' }}>BP (mmHg)</label><input type="text" className="form-input" placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ fontSize: '0.7rem' }}>Pulse (bpm)</label><input type="text" className="form-input" placeholder="72" value={pulse} onChange={(e) => setPulse(e.target.value)} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ fontSize: '0.7rem' }}>Temp (°C)</label><input type="text" className="form-input" placeholder="37.2" value={temp} onChange={(e) => setTemp(e.target.value)} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ fontSize: '0.7rem' }}>Weight (kg)</label><input type="text" className="form-input" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label" style={{ fontSize: '0.7rem' }}>Height (cm)</label><input type="text" className="form-input" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Lab Results</label><textarea className="form-input" rows="2" placeholder="Chest X-Ray normal" value={labResults} onChange={(e) => setLabResults(e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Treatment Given</label><textarea className="form-input" rows="2" placeholder="Nebulizer administered" value={treatmentGiven} onChange={(e) => setTreatmentGiven(e.target.value)} /></div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Doctor Notes</label><textarea className="form-input" rows="2" placeholder="Warning signs, follow-up..." value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} /></div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={historySubmitting}>
                {historySubmitting ? 'Saving...' : 'Save record (completes appointment)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedApp && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowPrescriptionModal(false)} className="modal-close"><X size={20} /></button>
            <h3 style={{ marginBottom: '4px' }}>Write prescription</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
              Patient: <strong>{selectedApp.patient_name}</strong> · Appointment <span className="font-mono">#{selectedApp.appointment_id}</span>
            </p>

            <form onSubmit={handlePrescriptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prescError && <div className="form-error">{prescError}</div>}
              {prescSuccess && <div className="form-success">{prescSuccess}</div>}

              <div className="grid-3">
                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label className="form-label">Diagnosis</label>
                  <input type="text" className="form-input" placeholder="Acute Viral Bronchitis" value={prescriptionDiagnosis} onChange={(e) => setPrescriptionDiagnosis(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Follow-up (days)</label>
                  <input type="number" className="form-input" placeholder="7" value={followUpInDays} onChange={(e) => setFollowUpInDays(e.target.value)} />
                </div>
              </div>

              {/* Medicine Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="eyebrow">Prescribed Medicines</span>
                  <button type="button" onClick={addPrescriptionRow} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                    <PlusCircle size={12} /> Add medicine
                  </button>
                </div>

                {prescriptionItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 28px', gap: '6px', alignItems: 'center', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)' }}>
                    <input type="text" className="form-input" placeholder="Medicine *" value={item.medicineName} onChange={e => handlePrescItemChange(idx, 'medicineName', e.target.value)} required style={{ fontSize: '0.85rem', padding: '8px' }} />
                    <input type="text" className="form-input" placeholder="Dosage *" value={item.dosage} onChange={e => handlePrescItemChange(idx, 'dosage', e.target.value)} required style={{ fontSize: '0.85rem', padding: '8px' }} />
                    <input type="text" className="form-input" placeholder="Frequency *" value={item.frequency} onChange={e => handlePrescItemChange(idx, 'frequency', e.target.value)} required style={{ fontSize: '0.85rem', padding: '8px' }} />
                    <input type="text" className="form-input" placeholder="Duration" value={item.duration} onChange={e => handlePrescItemChange(idx, 'duration', e.target.value)} style={{ fontSize: '0.85rem', padding: '8px' }} />
                    <input type="text" className="form-input" placeholder="Instructions" value={item.instructions} onChange={e => handlePrescItemChange(idx, 'instructions', e.target.value)} style={{ fontSize: '0.85rem', padding: '8px' }} />
                    <button type="button" onClick={() => removePrescriptionRow(idx)} className="btn btn-icon btn-danger" style={{ width: '28px', height: '28px' }} disabled={prescriptionItems.length === 1}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">General Advice</label>
                <textarea className="form-input" rows="2" placeholder="Warm water, bed rest..." value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={prescSubmitting}>
                {prescSubmitting ? 'Saving...' : 'Issue prescription'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 380px"] { grid-template-columns: 1fr !important; }
          div[style*="position: sticky"] { position: relative !important; top: 0 !important; }
        }
      `}</style>
    </div>
  );
}
