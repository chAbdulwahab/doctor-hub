import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Plus, Save, Building } from 'lucide-react';

export default function ManageClinics() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [clinicError, setClinicError] = useState('');
  const [clinicSuccess, setClinicSuccess] = useState('');
  const [clinicSubmitting, setClinicSubmitting] = useState(false);

  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [fee, setFee] = useState('');
  const [schedError, setSchedError] = useState('');
  const [schedSuccess, setSchedSuccess] = useState('');
  const [schedSubmitting, setSchedSubmitting] = useState(false);

  const [schedules, setSchedules] = useState([]);

  const fetchClinicsAndSchedules = async () => {
    try {
      const doctorId = user.profile.id;
      const clinicsData = await api.get(`/clinics/${doctorId}`);
      setClinics(clinicsData);
      if (clinicsData.length > 0) {
        setSelectedClinicId(clinicsData[0].id);
        const allScheds = [];
        for (const clinic of clinicsData) {
          const schedData = await api.get(`/schedules/${clinic.id}`);
          allScheds.push(...schedData.map(s => ({ ...s, clinicName: clinic.clinic_name })));
        }
        setSchedules(allScheds);
      }
    } catch (error) { console.error('Fetch clinics error:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user && user.profile) {
      fetchClinicsAndSchedules();
      setFee(user.profile.consultation_fee || '');
    }
  }, [user]);

  const handleClinicSubmit = async (e) => {
    e.preventDefault(); setClinicError(''); setClinicSuccess(''); setClinicSubmitting(true);
    try {
      await api.post('/clinics', { clinicName, address, city, province, contactPhone, mapLink });
      setClinicSuccess('Clinic added successfully!');
      setClinicName(''); setAddress(''); setCity(''); setProvince(''); setContactPhone(''); setMapLink('');
      await fetchClinicsAndSchedules();
    } catch (err) { setClinicError(err.message || 'Failed to add clinic.'); }
    finally { setClinicSubmitting(false); }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClinicId) { setSchedError('Add a clinic first.'); return; }
    setSchedError(''); setSchedSuccess(''); setSchedSubmitting(true);
    try {
      await api.post('/schedules', { clinicId: parseInt(selectedClinicId), dayOfWeek, startTime, endTime, slotDuration: parseInt(slotDuration), fee: parseFloat(fee) });
      setSchedSuccess('Schedule saved!');
      await fetchClinicsAndSchedules();
    } catch (err) { setSchedError(err.message || 'Failed to save schedule.'); }
    finally { setSchedSubmitting(false); }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">Practice Management</span>
        <h2 style={{ marginTop: '6px' }}>Clinics & schedules</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Configure clinic locations and map available time slots for patients.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add Clinic */}
          <div className="card card-static">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
              <Building size={18} style={{ color: 'var(--primary)' }} /> Add clinic location
            </h4>
            {clinicError && <div className="form-error" style={{ marginBottom: '12px' }}>{clinicError}</div>}
            {clinicSuccess && <div className="form-success" style={{ marginBottom: '12px' }}>{clinicSuccess}</div>}

            <form onSubmit={handleClinicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Clinic Name *</label><input type="text" className="form-input" placeholder="City Care Medical Complex" value={clinicName} onChange={e => setClinicName(e.target.value)} required disabled={clinicSubmitting} /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Address *</label><input type="text" className="form-input" placeholder="Suite 5, Block B" value={address} onChange={e => setAddress(e.target.value)} required disabled={clinicSubmitting} /></div>
              <div className="grid-3">
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">City *</label><input type="text" className="form-input" placeholder="Karachi" value={city} onChange={e => setCity(e.target.value)} required disabled={clinicSubmitting} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Province</label><input type="text" className="form-input" placeholder="Sindh" value={province} onChange={e => setProvince(e.target.value)} disabled={clinicSubmitting} /></div>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Phone</label><input type="text" className="form-input" placeholder="+9221345678" value={contactPhone} onChange={e => setContactPhone(e.target.value)} disabled={clinicSubmitting} /></div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Google Maps Link</label><input type="url" className="form-input" placeholder="https://maps.google.com/..." value={mapLink} onChange={e => setMapLink(e.target.value)} disabled={clinicSubmitting} /></div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={clinicSubmitting}><Plus size={16} /> Save clinic</button>
            </form>
          </div>

          {/* Add Schedule */}
          <div className="card card-static">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '16px' }}>
              <Clock size={18} style={{ color: 'var(--accent)' }} /> Configure time slots
            </h4>
            {schedError && <div className="form-error" style={{ marginBottom: '12px' }}>{schedError}</div>}
            {schedSuccess && <div className="form-success" style={{ marginBottom: '12px' }}>{schedSuccess}</div>}

            {clinics.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '16px', fontSize: '0.9rem' }}>Add a clinic location above to configure schedules.</p>
            ) : (
              <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Clinic</label><select className="form-input form-select" value={selectedClinicId} onChange={e => setSelectedClinicId(e.target.value)} required disabled={schedSubmitting}>{clinics.map(c => <option key={c.id} value={c.id}>{c.clinic_name} ({c.city})</option>)}</select></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Day</label><select className="form-input form-select" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required disabled={schedSubmitting}>{daysOfWeek.map(d => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}</select></div>
                </div>
                <div className="grid-4">
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Start</label><input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} required disabled={schedSubmitting} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">End</label><input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} required disabled={schedSubmitting} /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Slot (min)</label><select className="form-input form-select" value={slotDuration} onChange={e => setSlotDuration(e.target.value)} required disabled={schedSubmitting}><option value="15">15</option><option value="20">20</option><option value="30">30</option><option value="45">45</option><option value="60">60</option></select></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Fee (Rs.)</label><input type="number" className="form-input font-mono" min="0" value={fee} onChange={e => setFee(e.target.value)} required disabled={schedSubmitting} /></div>
                </div>
                <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end' }} disabled={schedSubmitting}><Save size={16} /> Save slots</button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Active clinics & schedules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card card-static">
            <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '12px' }}>Registered locations ({clinics.length})</h4>
            {loading ? <p style={{ textAlign: 'center', padding: '16px' }}>Loading...</p> : clinics.length === 0 ? (
              <p style={{ fontSize: '0.85rem' }}>No clinics configured yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clinics.map(clinic => (
                  <div key={clinic.id} style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{clinic.clinic_name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>{clinic.address}, {clinic.city}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-static">
            <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '12px' }}>Active schedule slots</h4>
            {loading ? <p style={{ textAlign: 'center', padding: '16px' }}>Loading...</p> : schedules.length === 0 ? (
              <p style={{ fontSize: '0.85rem' }}>No time slots configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {schedules.map((sched, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>{sched.day_of_week}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                        {sched.clinicName} · <span className="font-mono">{sched.start_time.slice(0, 5)}-{sched.end_time.slice(0, 5)}</span> ({sched.slot_duration}min)
                      </p>
                    </div>
                    <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rs. {parseFloat(sched.fee).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
