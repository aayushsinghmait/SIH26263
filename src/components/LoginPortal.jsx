import React, { useState } from 'react';
import { ShieldCheck, Building2, Lock, KeyRound, AlertTriangle, UserCheck, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';

export function LoginPortal({ onLoginSuccess, onOpenCitizenRequest, activeBgTheme = 'INDIA', onToggleTheme }) {
  const [selectedPortal, setSelectedPortal] = useState('ADMIN'); // 'ADMIN' or 'INSTITUTION'
  const [institutionRole, setInstitutionRole] = useState('ADMIN'); // 'ADMIN' or 'STAFF'
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    ministryCode: 'IITD'
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedPortal === 'ADMIN') {
      if (!credentials.username || !credentials.password) {
        setErrorMessage('Kripya APAAR Team Username aur Password enter karein.');
        return;
      }
      onLoginSuccess({
        role: 'ADMIN',
        subRole: 'APAAR_TEAM_ADMIN',
        username: credentials.username || 'apaar.admin',
        name: 'APAAR Team Administrator',
        badge: 'APAAR_TEAM',
        permissions: ['MANAGE_PLATFORM', 'VERIFY_STUDENTS', 'ADD_ADMIN', 'ADD_INSTITUTION', 'CONFIGURE_RULES']
      });
    } else {
      if (!credentials.username || !credentials.password) {
        setErrorMessage('Kripya Institution Officer Username aur Password enter karein.');
        return;
      }
      onLoginSuccess({
        role: 'MINISTRY',
        subRole: institutionRole,
        ministryCode: credentials.ministryCode,
        name: `${credentials.ministryCode} ${institutionRole === 'ADMIN' ? 'Institution Admin' : 'Staff Officer'}`,
        badge: institutionRole === 'ADMIN' ? 'INSTITUTION_ADMIN' : 'INSTITUTION_STAFF',
        permissions: institutionRole === 'ADMIN' 
          ? ['MANAGE_ENROLLMENT_DATA', 'UPLOAD_STUDENT_RECORDS', 'ADD_STAFF', 'ADD_ADMIN'] 
          : ['VIEW_ENROLLMENT_DATA', 'UPLOAD_STUDENT_RECORDS']
      });
    }
  };

  const handleQuickDemo = (role, institution = 'IITD', subRole = 'ADMIN') => {
    if (role === 'ADMIN') {
      onLoginSuccess({
        role: 'ADMIN',
        subRole: 'APAAR_TEAM_ADMIN',
        username: 'apaar.admin@aicte.gov.in',
        name: 'Dr. R. Mehta (APAAR Team Lead)',
        badge: 'APAAR_TEAM',
        permissions: ['MANAGE_PLATFORM', 'VERIFY_STUDENTS', 'ADD_ADMIN', 'ADD_INSTITUTION', 'CONFIGURE_RULES']
      });
    } else {
      onLoginSuccess({
        role: 'MINISTRY',
        subRole: subRole,
        ministryCode: institution,
        username: `${subRole.toLowerCase()}@${institution.toLowerCase()}.ac.in`,
        name: `${institution} ${subRole === 'ADMIN' ? 'Registrar' : 'Staff Officer'}`,
        badge: subRole === 'ADMIN' ? 'INSTITUTION_ADMIN' : 'INSTITUTION_STAFF',
        permissions: subRole === 'ADMIN'
          ? ['MANAGE_ENROLLMENT_DATA', 'UPLOAD_STUDENT_RECORDS', 'ADD_STAFF', 'ADD_ADMIN']
          : ['VIEW_ENROLLMENT_DATA', 'UPLOAD_STUDENT_RECORDS']
      });
    }
  };

  return (
    <div className={activeBgTheme === 'AICTE' ? 'ministry-theme-bg' : ''} style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* 1. National Tricolor Strip */}
      <div className="gov-tricolor-strip"></div>

      {/* 2. Official Top Government Bar */}
      <div className="gov-official-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>भारत सरकार</strong> | Government of India</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span><strong>अखिल भारतीय तकनीकी शिक्षा परिषद</strong> | AICTE</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ color: 'var(--gov-amber)' }}>APAAR Student Verification Gateway</span>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'var(--gov-white)',
              padding: '0.15rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            🏛️ Toggle: {activeBgTheme === 'INDIA' ? 'Gov of India Backdrop' : 'AICTE Backdrop'}
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem'
      }}>
        <div style={{
          maxWidth: '540px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Header Emblem */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'var(--gov-navy)',
              border: '2px solid var(--gov-white)',
              boxShadow: '0 4px 15px rgba(18, 59, 93, 0.25)',
              marginBottom: '0.85rem'
            }}>
              <GraduationCap size={36} color="var(--gov-white)" />
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--gov-navy)', marginBottom: '0.25rem' }}>
              APAAR <span style={{ color: 'var(--gov-teal)' }}>Student Verify</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
              APAAR-Based Student Data Management & Verification Platform
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.6rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'var(--gov-white)',
              border: '1px solid var(--gov-crimson)',
              fontSize: '0.75rem',
              color: 'var(--gov-crimson)',
              fontWeight: 700
            }}>
              <Lock size={12} />
              AICTE Authorized Access • APAAR Secured Platform
            </div>
          </div>

          {/* Card Box */}
          <div className="glass-panel" style={{ padding: '2rem', border: '2px solid var(--gov-navy)', background: 'var(--gov-white)' }}>
            
            {/* Live Student Verification Banner */}
            {onOpenCitizenRequest && (
              <div style={{
                marginBottom: '1.25rem',
                background: 'linear-gradient(135deg, rgba(255,153,51,0.12), rgba(19,136,8,0.12))',
                border: '1.5px solid #FF9933',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="live-dot" style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--gov-navy)' }}>Verify Student Record (APAAR):</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Verify a student's APAAR ID & enrollment status in real-time</div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCitizenRequest}
                  style={{
                    background: '#FF9933',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 5px rgba(255,153,51,0.4)'
                  }}
                >
                  🎓 Verify Student
                </button>
              </div>
            )}

            {/* Dual Portal Switch */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              background: 'var(--gov-ice)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setSelectedPortal('ADMIN')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedPortal === 'ADMIN' ? 'var(--gov-navy)' : 'transparent',
                  color: selectedPortal === 'ADMIN' ? 'var(--gov-white)' : 'var(--gov-navy)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShieldCheck size={18} />
                APAAR Team Portal
              </button>

              <button
                type="button"
                onClick={() => setSelectedPortal('INSTITUTION')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedPortal === 'INSTITUTION' ? 'var(--gov-teal)' : 'transparent',
                  color: selectedPortal === 'INSTITUTION' ? 'var(--gov-white)' : 'var(--gov-navy)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <GraduationCap size={18} />
                Institution Portal
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy)', marginBottom: '0.2rem' }}>
                {selectedPortal === 'ADMIN' ? 'APAAR Team / AICTE Central Authentication' : 'AICTE-Approved Institution Login'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedPortal === 'ADMIN' 
                  ? 'Central student data verification, APAAR validation, and regulatory oversight.' 
                  : 'Upload student enrollment data, manage records, and track APAAR compliance.'}
              </p>
            </div>

            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gov-white)',
                border: '1.5px solid var(--gov-crimson)',
                color: 'var(--gov-crimson)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.25rem'
              }}>
                <AlertTriangle size={18} />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {selectedPortal === 'INSTITUTION' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Select AICTE-Approved Institution</label>
                    <select
                      className="form-select"
                      value={credentials.ministryCode}
                      onChange={(e) => setCredentials({ ...credentials, ministryCode: e.target.value })}
                    >
                      <option value="IITD">IIT Delhi — Engineering & Technology</option>
                      <option value="BITS">BITS Pilani — Engineering & Sciences</option>
                      <option value="VIT">VIT Vellore — Engineering & Management</option>
                      <option value="NITT">NIT Tiruchirappalli — Engineering & Architecture</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institution Role & Access Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <div
                        onClick={() => setInstitutionRole('ADMIN')}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          border: `2px solid ${institutionRole === 'ADMIN' ? 'var(--gov-navy)' : 'var(--border-subtle)'}`,
                          background: institutionRole === 'ADMIN' ? 'var(--gov-ice)' : 'var(--gov-white)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--gov-navy)' }}>
                          <ShieldCheck size={16} color="var(--gov-navy)" />
                          Institution Admin
                        </div>
                        <ul style={{ marginTop: '0.35rem', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          <li>Manage enrollment database</li>
                          <li>Upload student records</li>
                        </ul>
                      </div>

                      <div
                        onClick={() => setInstitutionRole('STAFF')}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          border: `2px solid ${institutionRole === 'STAFF' ? 'var(--gov-teal)' : 'var(--border-subtle)'}`,
                          background: institutionRole === 'STAFF' ? 'rgba(15, 118, 110, 0.08)' : 'var(--gov-white)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--gov-teal)' }}>
                          <UserCheck size={16} color="var(--gov-teal)" />
                          Institution Staff
                        </div>
                        <ul style={{ marginTop: '0.35rem', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          <li>View enrollment data (read-only)</li>
                          <li>Upload student records</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">{selectedPortal === 'ADMIN' ? 'APAAR Team Email / Authorized ID' : 'Institution Email / Authorized ID'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={selectedPortal === 'ADMIN' ? 'e.g. admin@apaar.aicte.gov.in' : `e.g. ${institutionRole.toLowerCase()}@${credentials.ministryCode.toLowerCase()}.ac.in`}
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Security Access PIN / Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className={selectedPortal === 'ADMIN' ? 'btn-primary' : 'btn-teal'}
                style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
              >
                <KeyRound size={18} />
                Authenticate & Enter {selectedPortal === 'ADMIN' ? 'APAAR Team Portal' : `${credentials.ministryCode} Institution Portal`}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--gov-navy)', fontWeight: 700, marginBottom: '0.65rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Instant Demonstration Access (Presets)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('ADMIN')}
                >
                  <ShieldCheck size={14} color="var(--gov-navy)" />
                  APAAR Team Admin
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('INSTITUTION', 'IITD', 'ADMIN')}
                >
                  <GraduationCap size={14} color="var(--gov-teal)" />
                  IIT Delhi (Admin)
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('INSTITUTION', 'BITS', 'STAFF')}
                >
                  <UserCheck size={14} color="var(--gov-teal)" />
                  BITS Pilani (Staff)
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('INSTITUTION', 'VIT', 'ADMIN')}
                >
                  <Building2 size={14} color="var(--gov-amber)" />
                  VIT Vellore (Admin)
                </button>
              </div>
            </div>
          </div>

          {/* Security Disclaimers */}
          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--gov-navy)',
            fontWeight: 600
          }}>
            Protected under IT Act 2000 & Digital Personal Data Protection (DPDP) Act 2023. AICTE Authorized Access Only.
          </div>
        </div>
      </div>
    </div>
  );
}
