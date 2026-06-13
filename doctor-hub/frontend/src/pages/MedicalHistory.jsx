import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Activity, Info } from 'lucide-react';

export default function MedicalHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try { const data = await api.get('/history'); setHistory(data); }
      catch (error) { console.error('Fetch history error:', error); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">Your File</span>
        <h2 style={{ marginTop: '6px' }}>Clinical health records</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Immutable record of all diagnoses, checkups, and treatments received.</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}><div className="spinner"></div></div>
      ) : history.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '35vh', flexDirection: 'column', gap: '12px' }}>
          <Info size={32} style={{ color: 'var(--ink-soft)' }} />
          <p>No clinical records on file — they'll appear here after a consultation.</p>
        </div>
      ) : (
        <div className="timeline">
          {history.map((record) => {
            const vitals = typeof record.vital_signs === 'string' ? JSON.parse(record.vital_signs) : record.vital_signs;
            const visitDate = new Date(record.visit_date);

            return (
              <div key={record.id} className="timeline-entry">
                {/* Date rail */}
                <div className="timeline-date">
                  <div style={{ fontWeight: 500 }}>{visitDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: '0.7rem' }}>{visitDate.getFullYear()}</div>
                </div>

                {/* Timeline dot */}
                <div className="timeline-dot"></div>

                {/* Record card */}
                <div className="timeline-card">
                  {/* LOCKED stamp */}
                  <span className="stamp stamp-muted stamp-sm" style={{ position: 'absolute', top: '12px', right: '12px' }}>Locked</span>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--line)', marginBottom: '16px', paddingRight: '70px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{record.diagnosis}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '4px 0 0' }}>
                        Issued by <strong style={{ color: 'var(--ink)' }}>{record.doctor_name}</strong> · {record.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <span className="eyebrow">Chief Complaint</span>
                        <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>{record.chief_complaint || 'Not recorded'}</p>
                      </div>

                      <div>
                        <span className="eyebrow">Symptoms</span>
                        {record.symptoms && record.symptoms.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {record.symptoms.map((s, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)', textTransform: 'capitalize', color: 'var(--ink-soft)' }}>{s}</span>
                            ))}
                          </div>
                        ) : <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>None recorded</p>}
                      </div>

                      <div>
                        <span className="eyebrow">Treatment</span>
                        <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>{record.treatment_given || 'No immediate treatment prescribed'}</p>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {vitals && (
                        <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <Activity size={14} style={{ color: 'var(--accent)' }} />
                            <span className="eyebrow" style={{ color: 'var(--accent)' }}>Vital Signs</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                            {vitals.bp && <div><span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>BP</span><div style={{ fontWeight: 600 }}>{vitals.bp} mmHg</div></div>}
                            {vitals.pulse && <div><span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>Pulse</span><div style={{ fontWeight: 600 }}>{vitals.pulse} bpm</div></div>}
                            {vitals.temp && <div><span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>Temp</span><div style={{ fontWeight: 600 }}>{vitals.temp}°C</div></div>}
                            {vitals.weight && <div><span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>Weight</span><div style={{ fontWeight: 600 }}>{vitals.weight} kg</div></div>}
                            {vitals.height && <div><span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>Height</span><div style={{ fontWeight: 600 }}>{vitals.height} cm</div></div>}
                          </div>
                        </div>
                      )}

                      {record.lab_results && (
                        <div>
                          <span className="eyebrow">Lab Results</span>
                          <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>{record.lab_results}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor Notes */}
                  {record.doctor_notes && (
                    <div style={{ marginTop: '16px', borderLeft: '3px solid var(--primary)', padding: '12px 16px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', background: 'var(--primary-soft)' }}>
                      <span className="eyebrow" style={{ color: 'var(--primary)' }}>Physician's Notes</span>
                      <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--ink)' }}>{record.doctor_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .timeline { padding-left: 24px; }
          .timeline::before { left: 4px; }
          .timeline-date { position: relative; left: 0; top: 0; width: auto; text-align: left; margin-bottom: 8px; display: flex; gap: 6px; }
          .timeline-dot { left: -20px; }
        }
      `}</style>
    </div>
  );
}
