import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ClipboardList, Activity } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Patient specific
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('male');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Doctor specific
  const [pmdcNumber, setPmdcNumber] = useState('');
  const [specialization, setSpecialization] = useState('General Physician');
  const [treatmentType, setTreatmentType] = useState('allopathic');
  const [experienceYears, setExperienceYears] = useState(1);
  const [consultationFee, setConsultationFee] = useState(500);
  const [bio, setBio] = useState('');
  const [diseasesInput, setDiseasesInput] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = { fullName, email, phone, password, role };

    if (role === 'patient') {
      payload.dateOfBirth = dateOfBirth || null;
      payload.gender = gender;
      payload.bloodGroup = bloodGroup;
    } else {
      payload.pmdcNumber = pmdcNumber;
      payload.specialization = specialization;
      payload.treatmentType = treatmentType;
      payload.experienceYears = parseInt(experienceYears) || 0;
      payload.consultationFee = parseFloat(consultationFee) || 0.0;
      payload.bio = bio;
      payload.diseasesTreated = diseasesInput
        ? diseasesInput.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    try {
      const res = await register(payload);
      setSuccess(res.message || 'Account created — redirecting to sign in.');
      setTimeout(() => { navigate('/login'); }, 3000);
    } catch (err) {
      setError(err.message || 'Registration failed — please try again.');
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
        <h1>Join the clinic<br />network today.</h1>
        <p>
          Register as a patient to book appointments, or as a doctor to manage 
          your practice, schedules, and prescriptions — all in one place.
        </p>
      </div>

      {/* Form Panel */}
      <div className="auth-panel-form" style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
        <div className="auth-form-card" style={{ maxWidth: '560px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Create your account</h2>
            <p style={{ fontSize: '0.9rem' }}>Select your role and complete the form below</p>
          </div>

          {/* File-Tab Role Selector */}
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab${role === 'patient' ? ' active' : ''}`}
              onClick={() => { setRole('patient'); setError(''); }}
            >
              <User size={16} />
              Patient
            </button>
            <button
              type="button"
              className={`role-tab${role === 'doctor' ? ' active' : ''}`}
              onClick={() => { setRole('doctor'); setError(''); }}
            >
              <ClipboardList size={16} />
              Doctor
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Common Fields */}
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="Ali Hassan" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={submitting} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="ali@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="+923109876543" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={submitting} />
              </div>
            </div>

            {/* Patient Fields */}
            {role === 'patient' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="divider"></div>
                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={submitting} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Gender</label>
                    <select className="form-input form-select" value={gender} onChange={(e) => setGender(e.target.value)} disabled={submitting}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Blood Group</label>
                    <select className="form-input form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} disabled={submitting}>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Fields */}
            {role === 'doctor' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="divider"></div>

                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">PMDC Registration Number</label>
                    <input type="text" className="form-input font-mono" placeholder="PMDC-54321" value={pmdcNumber} onChange={(e) => setPmdcNumber(e.target.value)} required disabled={submitting} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Specialization</label>
                    <input type="text" className="form-input" placeholder="Pediatrician, Cardiologist" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required disabled={submitting} />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Treatment Type</label>
                    <select className="form-input form-select" value={treatmentType} onChange={(e) => setTreatmentType(e.target.value)} disabled={submitting}>
                      <option value="allopathic">Allopathic</option>
                      <option value="homeopathic">Homeopathic</option>
                      <option value="herbal">Herbal</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Experience (Years)</label>
                    <input type="number" className="form-input" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} disabled={submitting} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Consultation Fee (Rs.)</label>
                    <input type="number" className="form-input" min="0" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} disabled={submitting} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Diseases Treated (comma separated)</label>
                  <input type="text" className="form-input" placeholder="flu, diabetes, asthma, arthritis" value={diseasesInput} onChange={(e) => setDiseasesInput(e.target.value)} disabled={submitting} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Professional Biography</label>
                  <textarea className="form-input" rows="3" placeholder="Tell patients about your medical background..." value={bio} onChange={(e) => setBio(e.target.value)} disabled={submitting} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '8px' }} disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <p>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
