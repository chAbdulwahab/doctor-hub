import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { MapPin, Calendar, Clock, Star, Award } from 'lucide-react';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const getMinMaxDates = () => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const future = new Date(today); future.setDate(future.getDate() + 14);
    return { min: tomorrow.toISOString().split('T')[0], max: future.toISOString().split('T')[0] };
  };
  const { min: minDate, max: maxDate } = getMinMaxDates();

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const data = await api.get(`/doctors/${id}`);
        setDoctor(data);
        if (data.clinics && data.clinics.length > 0) setSelectedClinic(data.clinics[0]);
      } catch (error) { console.error('Fetch doctor profile error:', error); }
      finally { setLoading(false); }
    };
    fetchDoctorProfile();
  }, [id]);

  useEffect(() => {
    if (!bookingDate || !selectedClinic || !doctor) return;
    const dateObj = new Date(bookingDate);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = days[dateObj.getDay()];
    const clinicSchedules = doctor.schedules.filter(s => s.clinic_id === selectedClinic.id && s.day_of_week === selectedDayName);
    const slots = [];
    clinicSchedules.forEach((schedule) => {
      const { start_time, end_time, slot_duration } = schedule;
      let currentHour = parseInt(start_time.split(':')[0]);
      let currentMin = parseInt(start_time.split(':')[1]);
      const endTotalMins = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
      while ((currentHour * 60 + currentMin) < endTotalMins) {
        slots.push({ time: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`, scheduleId: schedule.id });
        currentMin += slot_duration;
        if (currentMin >= 60) { currentHour += Math.floor(currentMin / 60); currentMin = currentMin % 60; }
      }
    });
    setAvailableSlots(slots);
    setSelectedSlot('');
    setBookingError('');
  }, [bookingDate, selectedClinic]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) { setBookingError('Please select a time slot.'); return; }
    setBookingError(''); setBookingSuccess(''); setBookingSubmitting(true);
    try {
      const slotData = availableSlots.find((s) => s.time === selectedSlot);
      const res = await api.post('/appointments', {
        doctorId: doctor.id, clinicId: selectedClinic.id, scheduleId: slotData.scheduleId,
        appointmentDate: bookingDate, appointmentTime: selectedSlot, reasonForVisit: reason
      });
      setBookingSuccess(res.message);
      setTimeout(() => { navigate('/appointments'); }, 2500);
    } catch (err) { setBookingError(err.message || 'Booking failed — time slot may be taken.'); }
    finally { setBookingSubmitting(false); }
  };

  if (loading) return <div className="flex-center animate-fade" style={{ minHeight: '50vh' }}><div className="spinner"></div></div>;
  if (!doctor) return <div className="card flex-center" style={{ minHeight: '30vh' }}><p>Doctor profile not found.</p></div>;

  const getAccentClass = (type) => {
    if (type === 'allopathic') return 'card-allopathic';
    if (type === 'homeopathic') return 'card-homeopathic';
    if (type === 'herbal') return 'card-herbal';
    return '';
  };

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px', alignItems: 'flex-start' }}>
      {/* Profile Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ID Card Header */}
        <div className={`card ${getAccentClass(doctor.treatment_type)}`} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: 'var(--radius)',
            backgroundColor: 'var(--primary-soft)', color: 'var(--primary)',
            fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>DR</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem' }}>{doctor.full_name}</h2>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>
                  {doctor.specialization} · {doctor.treatment_type}
                </p>
              </div>
              <span className="stamp stamp-success" style={{ marginTop: '4px' }}>Active</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '8px' }}>
              <span><strong>PMDC:</strong> <span className="font-mono">{doctor.pmdc_number}</span></span>
              <span><strong>Experience:</strong> {doctor.experience_years} years</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--pending)' }}>
                <Star size={14} fill="currentColor" />
                {parseFloat(doctor.rating) > 0 ? parseFloat(doctor.rating).toFixed(1) : 'New'} ({doctor.total_reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className="card card-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Professional biography</h4>
          <p style={{ fontSize: '0.9rem' }}>{doctor.bio || 'No professional biography provided.'}</p>
        </div>

        {/* Diseases */}
        {doctor.diseases_treated && doctor.diseases_treated.length > 0 && (
          <div className="card card-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Conditions treated</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {doctor.diseases_treated.map((d, i) => (
                <span key={i} style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Clinics */}
        <div className="card card-static" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>Clinic locations</h4>
          {doctor.clinics.length === 0 ? (
            <p style={{ fontSize: '0.9rem' }}>No clinics configured.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {doctor.clinics.map((clinic) => (
                <div key={clinic.id} style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <MapPin size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: '1rem' }}>{clinic.clinic_name}</h4>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>{clinic.address}, {clinic.city}</p>
                      {clinic.contact_phone && <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: 0 }}>{clinic.contact_phone}</p>}
                    </div>
                  </div>
                  {clinic.map_link && (
                    <a href={clinic.map_link} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Directions</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Widget */}
      <div className="card card-static" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '4px solid var(--primary)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          Book consultation
        </h4>

        {doctor.clinics.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Booking unavailable — no clinics configured.</p>
        ) : (
          <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookingError && <div className="form-error">{bookingError}</div>}
            {bookingSuccess && <div className="form-success">{bookingSuccess}</div>}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select clinic</label>
              <select className="form-input form-select" value={selectedClinic ? selectedClinic.id : ''} onChange={(e) => setSelectedClinic(doctor.clinics.find(c => c.id === parseInt(e.target.value)))} required>
                {doctor.clinics.map((c) => <option key={c.id} value={c.id}>{c.clinic_name} ({c.city})</option>)}
              </select>
            </div>

            <div className="fee-callout">
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Consultation fee</span>
              <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>Rs. {parseFloat(doctor.consultation_fee).toLocaleString()}</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Consultation date</label>
              <input type="date" className="form-input" min={minDate} max={maxDate} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
            </div>

            {bookingDate && (
              <div className="form-group animate-fade" style={{ marginBottom: 0 }}>
                <label className="form-label">Available slots</label>
                {availableSlots.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', padding: '10px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}>
                    No slots scheduled for this day.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {availableSlots.map((slot, i) => (
                      <button key={i} type="button" onClick={() => setSelectedSlot(slot.time)}
                        className="font-mono"
                        style={{
                          fontSize: '0.8rem', padding: '8px 4px', textAlign: 'center',
                          border: `1px solid ${selectedSlot === slot.time ? 'var(--primary)' : 'var(--line)'}`,
                          backgroundColor: selectedSlot === slot.time ? 'var(--primary)' : 'var(--primary-soft)',
                          color: selectedSlot === slot.time ? '#fff' : 'var(--ink)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontWeight: selectedSlot === slot.time ? 700 : 400,
                          transition: 'all 120ms ease-out'
                        }}
                      >{slot.time}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason for visit</label>
              <textarea className="form-input" rows="2" placeholder="e.g. chronic headache, checkup" value={reason} onChange={(e) => setReason(e.target.value)} style={{ resize: 'none' }} />
            </div>

            {/* Live token preview */}
            {selectedSlot && bookingDate && (
              <div className="token-stub animate-fade" style={{ fontSize: '0.85rem' }}>
                <div className="token-stub-number" style={{ minWidth: '80px', padding: '12px 14px' }}>
                  <span className="token-day">{new Date(bookingDate).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</span>
                  <span className="token-time">{selectedSlot}</span>
                </div>
                <div className="token-stub-details" style={{ padding: '12px 14px' }}>
                  <strong style={{ color: 'var(--ink)' }}>{doctor.full_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{selectedClinic?.clinic_name}</span>
                  <span className="stamp stamp-pending stamp-sm" style={{ marginTop: '4px', alignSelf: 'flex-start' }}>Your token</span>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }} disabled={bookingSubmitting || !selectedSlot}>
              {bookingSubmitting ? 'Confirming...' : 'Book appointment'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 420px"] { grid-template-columns: 1fr !important; }
          div[style*="position: sticky"] { position: relative !important; top: 0 !important; }
        }
      `}</style>
    </div>
  );
}
