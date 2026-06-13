import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Clock, CheckCircle, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingTop: '40px' }}>
      {/* Hero — Clean editorial, no gradient blobs */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '48px' }}>
        <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>Healthcare Consultation Platform</span>
          <h1 style={{ fontSize: '3rem', lineHeight: 1.08 }}>
            Find the right doctor,<br />book your token.
          </h1>
          <p style={{ fontSize: '1.1rem', maxWidth: '520px', lineHeight: 1.7 }}>
            Doctor Hub connects patients with certified Allopathic, Homeopathic, and Herbal 
            specialists. Manage appointments, verify payments, and access immutable health records — 
            all from one place.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            {user ? (
              <Link to={
                user.role === 'patient' ? '/search' :
                user.role === 'doctor' ? '/doctor-dashboard' :
                user.role === 'assistant' ? '/assistant-dashboard' : '/admin-dashboard'
              } className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                  Get started
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Visual: Stacked token-stub preview cards */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Token stub preview 1 */}
          <div className="token-stub" style={{ maxWidth: '420px' }}>
            <div className="token-stub-number">
              <span className="token-id">#A-0231</span>
              <span className="token-day">MON</span>
              <span className="token-time">09:30 AM</span>
            </div>
            <div className="token-stub-details">
              <h4 style={{ fontSize: '1rem', margin: 0 }}>Dr. Ahmed Raza</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>General Physician · Allopathic</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>City Care Clinic, Karachi</p>
              <div style={{ marginTop: '4px' }}>
                <span className="stamp stamp-success">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Token stub preview 2 */}
          <div className="token-stub" style={{ maxWidth: '420px', marginLeft: '24px' }}>
            <div className="token-stub-number">
              <span className="token-id">#A-0458</span>
              <span className="token-day">WED</span>
              <span className="token-time">02:00 PM</span>
            </div>
            <div className="token-stub-details">
              <h4 style={{ fontSize: '1rem', margin: 0 }}>Dr. Sara Malik</h4>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Dermatologist · Herbal</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Green Life Clinic, Lahore</p>
              <div style={{ marginTop: '4px' }}>
                <span className="stamp stamp-pending">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Categories — Cards with left-border accent */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ maxWidth: '520px' }}>
          <span className="eyebrow">Three disciplines, one platform</span>
          <h2 style={{ marginTop: '8px' }}>Consultation categories</h2>
        </div>

        <div className="grid-3">
          <div className="card card-allopathic" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--allopathic)', display: 'inline-block' }}></span>
              <span className="eyebrow" style={{ color: 'var(--allopathic)' }}>Allopathic</span>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Western Medicine</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Consult certified general physicians, cardiologists, dermatologists, and pediatricians 
              using validated scientific treatment protocols.
            </p>
          </div>

          <div className="card card-homeopathic" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--homeopathic)', display: 'inline-block' }}></span>
              <span className="eyebrow" style={{ color: 'var(--homeopathic)' }}>Homeopathic</span>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Holistic Remedies</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Natural remedies based on similarity principles and holistic healing. 
              Registered homeopaths offer gentle, tailored therapy pathways.
            </p>
          </div>

          <div className="card card-herbal" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--herbal)', display: 'inline-block' }}></span>
              <span className="eyebrow" style={{ color: 'var(--herbal)' }}>Herbal</span>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Phytotherapy</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Traditional natural phytotherapy using active botanical extracts. 
              Connect with certified herbal practitioners for clinical formulations.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works — Clean steps without glass */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ maxWidth: '520px' }}>
          <span className="eyebrow">Simple process</span>
          <h2 style={{ marginTop: '8px' }}>How it works</h2>
        </div>
        <div className="grid-4">
          {[
            { num: '01', title: 'Search specialists', desc: 'Filter doctors by name, disease, specialization, or treatment type.' },
            { num: '02', title: 'Book your token', desc: 'Select a clinic, pick a date, and reserve your consultation time slot.' },
            { num: '03', title: 'Verify payment', desc: 'Upload your JazzCash or Easypaisa screenshot. Assistants verify it.' },
            { num: '04', title: 'Consult & prescribe', desc: 'Receive digital prescriptions and secure immutable health records.' }
          ].map((step) => (
            <div key={step.num} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.3 }}>{step.num}</span>
              <h4>{step.title}</h4>
              <p style={{ fontSize: '0.875rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
