import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Search, MapPin, Award, Star } from 'lucide-react';

export default function SearchDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [disease, setDisease] = useState('');
  const [treatmentType, setTreatmentType] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (specialization) params.append('specialization', specialization);
      if (disease) params.append('disease', disease);
      if (treatmentType) params.append('treatmentType', treatmentType);

      const data = await api.get(`/doctors?${params.toString()}`);
      setDoctors(data);
    } catch (error) {
      console.error('Fetch doctors error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, [treatmentType]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchDoctors(); };

  const clearFilters = () => {
    setName(''); setSpecialization(''); setDisease(''); setTreatmentType('');
    setTimeout(() => { fetchDoctors(); }, 50);
  };

  const getAccentClass = (type) => {
    if (type === 'allopathic') return 'card-allopathic';
    if (type === 'homeopathic') return 'card-homeopathic';
    if (type === 'herbal') return 'card-herbal';
    return '';
  };

  const getTagClass = (type) => {
    if (type === 'allopathic') return 'tag-allopathic';
    if (type === 'homeopathic') return 'tag-homeopathic';
    if (type === 'herbal') return 'tag-herbal';
    return '';
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span className="eyebrow">Doctor Directory</span>
        <h2 style={{ marginTop: '6px' }}>Find medical specialists</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Browse certified doctors, read profiles, and book consultations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Filter Sidebar */}
        <div className="card card-static" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} /> Filters
          </h4>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Doctor Name</label>
              <input type="text" className="form-input" placeholder="e.g. Raza" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Specialization</label>
              <input type="text" className="form-input" placeholder="e.g. Cardiologist" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Disease / Symptom</label>
              <input type="text" className="form-input" placeholder="e.g. diabetes" value={disease} onChange={(e) => setDisease(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Apply filters</button>
            <button type="button" className="btn btn-outline" onClick={clearFilters} style={{ width: '100%' }}>Clear all</button>
          </form>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Treatment type file-tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--line)' }}>
            {[
              { value: '', label: 'All Types', color: 'var(--ink-soft)' },
              { value: 'allopathic', label: 'Allopathic', color: 'var(--allopathic)' },
              { value: 'homeopathic', label: 'Homeopathic', color: 'var(--homeopathic)' },
              { value: 'herbal', label: 'Herbal', color: 'var(--herbal)' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setTreatmentType(tab.value)}
                style={{
                  padding: '10px 20px',
                  background: treatmentType === tab.value ? 'var(--surface)' : 'transparent',
                  border: treatmentType === tab.value ? '1px solid var(--line)' : '1px solid transparent',
                  borderBottom: treatmentType === tab.value ? '1px solid var(--surface)' : '1px solid transparent',
                  marginBottom: '-1px',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontWeight: treatmentType === tab.value ? 700 : 500,
                  fontSize: '0.85rem',
                  color: treatmentType === tab.value ? tab.color : 'var(--ink-soft)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 120ms ease-out',
                  boxShadow: treatmentType === tab.value ? 'var(--shadow-card)' : 'none'
                }}
              >
                {tab.value && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tab.color, display: 'inline-block' }}></span>}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Doctor count */}
          <div style={{ fontSize: '0.85rem' }}>
            <span className="font-mono" style={{ fontWeight: 500, color: 'var(--ink)' }}>{doctors.length}</span>
            <span style={{ color: 'var(--ink-soft)', marginLeft: '4px' }}>doctors found</span>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex-center" style={{ minHeight: '30vh' }}><div className="spinner"></div></div>
          ) : doctors.length === 0 ? (
            <div className="card flex-center" style={{ minHeight: '30vh', flexDirection: 'column', gap: '12px' }}>
              <p>No active doctors match your search criteria.</p>
              <button className="btn btn-outline" onClick={clearFilters}>Reset filters</button>
            </div>
          ) : (
            <div className="grid-2">
              {doctors.map((doc) => (
                <div key={doc.doctor_id} className={`card ${getAccentClass(doc.treatment_type)}`} style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{doc.doctor_name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                          {doc.specialization}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--pending)' }}>
                        <Star size={13} fill="currentColor" />
                        {parseFloat(doc.rating) > 0 ? parseFloat(doc.rating).toFixed(1) : 'New'}
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={14} />
                        <span>{doc.experience_years} years experience</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`tag ${getTagClass(doc.treatment_type)}`}>{doc.treatment_type}</span>
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>Consultation fee</span>
                        <div className="font-mono" style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '1rem' }}>
                          Rs. {parseFloat(doc.consultation_fee).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {doc.diseases_treated && doc.diseases_treated.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                        {doc.diseases_treated.slice(0, 3).map((d, i) => (
                          <span key={i} style={{ fontSize: '0.7rem', background: 'var(--bg)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>{d}</span>
                        ))}
                        {doc.diseases_treated.length > 3 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', padding: '2px 4px' }}>+{doc.diseases_treated.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link to={`/doctors/${doc.doctor_id}`} className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }}>
                    View profile & book
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 280px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
