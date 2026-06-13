import React from 'react';
import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      padding: '32px 0',
      marginTop: 'auto',
      backgroundColor: 'var(--bg)',
      fontSize: '0.875rem',
      color: 'var(--ink-soft)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>
            DOCTOR<span style={{ color: 'var(--primary)' }}>HUB</span>
          </span>
          <span style={{ color: 'var(--ink-soft)' }}>
            &copy; {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: 'var(--ink-soft)', transition: 'color 150ms' }}
            onMouseOver={e => e.target.style.color = 'var(--primary)'}
            onMouseOut={e => e.target.style.color = 'var(--ink-soft)'}
          >Privacy</a>
          <a href="#" style={{ color: 'var(--ink-soft)', transition: 'color 150ms' }}
            onMouseOver={e => e.target.style.color = 'var(--primary)'}
            onMouseOut={e => e.target.style.color = 'var(--ink-soft)'}
          >Terms</a>
          <a href="#" style={{ color: 'var(--ink-soft)', transition: 'color 150ms' }}
            onMouseOver={e => e.target.style.color = 'var(--primary)'}
            onMouseOut={e => e.target.style.color = 'var(--ink-soft)'}
          >Support</a>
        </div>
      </div>
    </footer>
  );
}
