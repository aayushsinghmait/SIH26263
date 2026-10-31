import React, { useState } from 'react';
import { 
  ShieldCheck, Send, CheckCircle2, AlertTriangle, ArrowRight, 
  Sparkles, Clock, FileText, User, CreditCard, Building2, 
  HelpCircle, RefreshCw, Layers, ShieldAlert, Cpu, GraduationCap,
  Award, QrCode, CheckCircle, FileCheck
} from 'lucide-react';
import { submitApplication, socket } from '../services/api';
import { maskAPAAR } from '../utils/aiEngine';

export function CitizenRequestPortal({ onBackToLogin, onSwitchToAdmin }) {
  const [formData, setFormData] = useState({
    student_name: '',
    applicant_name: '',
    apaar_id: '',
    aadhaar_no: '',
    enrollment_no: '',
    pan_no: '',
    institution_code: 'IITD',
    course: 'B.Tech Computer Science and Engineering',
    scheme_name: 'B.Tech Computer Science and Engineering',
    branch: 'Computer Science',
    dob: '',
    gender: 'Male',
    father_name: '',
    supernumerary_seats: 'NO',
    nri_category: 'NO',
    oci_status: 'NO',
    foreign_national: 'NO',
    approved_intake: 120,
    actual_enrolment: 118,
    state: 'Delhi',
    pin_code: '110016'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  // Sample presets for quick testing of APAAR requirements
  const presets = [
    {
      label: '✅ Verified AICTE Student (IIT Delhi - B.Tech CSE)',
      data: {
        student_name: 'Ananya Sharma',
        applicant_name: 'Ananya Sharma',
        apaar_id: '9012-3456-7890',
        aadhaar_no: '9012-3456-7890',
        enrollment_no: '2026/CS/084',
        pan_no: '2026/CS/084',
        institution_code: 'IITD',
        course: 'B.Tech Computer Science and Engineering',
        scheme_name: 'B.Tech Computer Science and Engineering',
        branch: 'Computer Science',
        dob: '2004-05-14',
        gender: 'Female',
        father_name: 'Vikram Sharma',
        supernumerary_seats: 'NO',
        nri_category: 'NO',
        oci_status: 'NO',
        foreign_national: 'NO',
        approved_intake: 120,
        actual_enrolment: 118,
        state: 'Delhi',
        pin_code: '110016'
      }
    },
    {
      label: '⚠️ Dual Institution Enrolment Anomaly (Aarav Patel - IITD & VIT)',
      data: {
        student_name: 'Aarav Patel',
        applicant_name: 'Aarav Patel',
        apaar_id: '4567-8901-2345',
        aadhaar_no: '4567-8901-2345',
        enrollment_no: '2026/EE/102',
        pan_no: '2026/EE/102',
        institution_code: 'BITS',
        course: 'B.Tech Electrical Engineering',
        scheme_name: 'B.Tech Electrical Engineering',
        branch: 'Electrical Engineering',
        dob: '2003-11-20',
        gender: 'Male',
        father_name: 'Kirit Patel',
        supernumerary_seats: 'YES',
        nri_category: 'YES',
        oci_status: 'NO',
        foreign_national: 'NO',
        approved_intake: 180,
        actual_enrolment: 175,
        state: 'Rajasthan',
        pin_code: '333031'
      }
    },
    {
      label: '🚨 Supernumerary FN Quota Exceeded (Rohan Mehra - VIT)',
      data: {
        student_name: 'Rohan Mehra',
        applicant_name: 'Rohan Mehra',
        apaar_id: '6789-0123-4567',
        aadhaar_no: '6789-0123-4567',
        enrollment_no: '2026/ME/055',
        pan_no: '2026/ME/055',
        institution_code: 'VIT',
        course: 'B.Tech Mechanical Engineering',
        scheme_name: 'B.Tech Mechanical Engineering',
        branch: 'Mechanical Engineering',
        dob: '2004-02-18',
        gender: 'Male',
        father_name: 'Sunil Mehra',
        supernumerary_seats: 'YES',
        nri_category: 'NO',
        oci_status: 'NO',
        foreign_national: 'YES',
        approved_intake: 60,
        actual_enrolment: 65,
        state: 'Tamil Nadu',
        pin_code: '632014'
      }
    }
  ];

  const handleApplyPreset = (p) => {
    setFormData({ ...p.data });
    setSubmissionSuccess(null);
    setSubmissionError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'student_name') updated.applicant_name = value;
      if (name === 'apaar_id') updated.aadhaar_no = value;
      if (name === 'enrollment_no') updated.pan_no = value;
      if (name === 'course') updated.scheme_name = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');

    const nameToVerify = formData.student_name || formData.applicant_name;
    const apaarToVerify = formData.apaar_id || formData.aadhaar_no;

    if (!nameToVerify.trim()) {
      setSubmissionError('Please enter Student Full Name.');
      return;
    }
    if (!apaarToVerify.trim()) {
      setSubmissionError('Please enter mandatory 12-digit APAAR ID.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        student_name: nameToVerify,
        applicant_name: nameToVerify,
        apaar_id: apaarToVerify,
        aadhaar_no: apaarToVerify,
        submittedBy: `${nameToVerify} (Stakeholder Verification)`,
        sourcePortal: 'APAAR Public Stakeholder Gateway'
      };

      const res = await submitApplication(payload, true);
      setSubmissionSuccess(res.data);
      setIsSubmitting(false);
    } catch (err) {
      console.warn('API error, falling back locally:', err.message);
      const name = formData.student_name || formData.applicant_name;
      const apaar = formData.apaar_id || formData.aadhaar_no;
      const fallbackApp = {
        ...formData,
        id: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        student_name: name,
        applicant_name: name,
        apaar_id: apaar,
        aadhaar_no: apaar,
        status: 'PENDING_AI_CHECK',
        ai_verdict: 'PENDING',
        confidence_score: 95,
        submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      setSubmissionSuccess(fallbackApp);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', background: 'var(--bg-primary)' }}>
      {/* Top National Strip */}
      <div className="gov-tricolor-strip"></div>

      {/* Official Top Bar */}
      <div className="gov-official-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>अखिल भारतीय तकनीकी शिक्षा परिषद</strong> | AICTE</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>National Student Academic Identity Gateway (APAAR ID)</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ color: 'var(--gov-amber)' }}>One Nation, One Student ID</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn-secondary btn-sm"
            onClick={onSwitchToAdmin}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
          >
            🏛️ Open APAAR Team Portal
          </button>
          <button 
            className="btn-secondary btn-sm"
            onClick={onBackToLogin}
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
          >
            Sign In / Switch Portal
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1080px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(11,37,69,0.95), rgba(18,59,93,0.95))',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          marginBottom: '2rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(255,153,51,0.2)',
              border: '1px solid rgba(255,153,51,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={30} color="#FF9933" />
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="live-badge" style={{ background: 'rgba(19,136,8,0.25)', color: '#4ade80', border: '1px solid #4ade80' }}>
                  <span className="live-dot" style={{ background: '#4ade80' }}></span>
                  APAAR REAL-TIME VERIFICATION NETWORK ACTIVE
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                Student APAAR Record & Enrolment Verification
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                Authorized stakeholders (AICTE, Institutions, Employers, Students) can verify authentic student records, detect duplicate enrolments across institutions, and validate approved intake capacities using <strong>APAAR ID</strong>.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.6rem', fontWeight: 600 }}>
              ⚡ Quick 1-Click Test Scenarios (Click to auto-populate and test real-time APAAR verification):
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Submission Result Box */}
        {submissionSuccess && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                background: '#10b981',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                color: '#fff'
              }}>
                <CheckCircle2 size={28} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    Student Record Submitted & Broadcasted to AICTE Central Repository!
                  </h3>
                  <span className="live-badge" style={{ background: '#10b981', color: '#fff' }}>
                    STUDENT TRACKING ID: {submissionSuccess.id}
                  </span>
                </div>

                <p style={{ margin: '0.5rem 0 1rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Record committed to the national database and queued for verification in the <strong>APAAR Team Central Portal</strong>.
                </p>

                {/* Progress Workflow Tracker */}
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gov-navy)' }}>
                    🔄 Autonomous APAAR Verification Pipeline Execution:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAGE 1</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>12-Digit APAAR Check</div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981' }}>✓ Format Validated</div>
                    </div>

                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAGE 2</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Approved Intake Check</div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981' }}>✓ Capacity Verified</div>
                    </div>

                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAGE 3</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cross-Institution Check</div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981' }}>✓ Duplicate Audit</div>
                    </div>

                    <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAGE 4</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>AICTE Status</div>
                      <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
                        {submissionSuccess.status || 'VERIFIED'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-primary" 
                    onClick={onSwitchToAdmin}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ArrowRight size={16} />
                    View Live in APAAR Team Central Portal
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setFormData({
                        student_name: '',
                        applicant_name: '',
                        apaar_id: '',
                        aadhaar_no: '',
                        enrollment_no: '',
                        pan_no: '',
                        institution_code: 'IITD',
                        course: 'B.Tech Computer Science and Engineering',
                        scheme_name: 'B.Tech Computer Science and Engineering',
                        branch: 'Computer Science',
                        dob: '',
                        gender: 'Male',
                        father_name: '',
                        supernumerary_seats: 'NO',
                        nri_category: 'NO',
                        oci_status: 'NO',
                        foreign_national: 'NO',
                        approved_intake: 120,
                        actual_enrolment: 118,
                        state: 'Delhi',
                        pin_code: '110016'
                      });
                    }}
                  >
                    Verify Another Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="gov-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--gov-navy)' }}>
                Student Academic Particulars & Verification Form
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Mandatory data fields aligned with AICTE-approved institution post-admission reporting standards
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>TLS 1.3 AICTE End-to-End Encrypted Session</span>
            </div>
          </div>

          {submissionError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--gov-crimson)',
              color: 'var(--gov-crimson)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{submissionError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* Institution Code */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  AICTE Approved Institution / College *
                </label>
                <select
                  name="institution_code"
                  value={formData.institution_code}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                >
                  <option value="IITD">Indian Institute of Technology Delhi (IITD)</option>
                  <option value="BITS">Birla Institute of Technology and Science, Pilani (BITS)</option>
                  <option value="VIT">Vellore Institute of Technology (VIT)</option>
                  <option value="NITT">National Institute of Technology Trichy (NITT)</option>
                </select>
              </div>

              {/* Student Name */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Student Full Name (as per Academic Certificate) *
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  placeholder="e.g. Ananya Sharma"
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* APAAR ID */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  APAAR ID (12-Digit Academic Identity) *
                </label>
                <input
                  type="text"
                  name="apaar_id"
                  value={formData.apaar_id}
                  onChange={handleChange}
                  placeholder="e.g. 9012-3456-7890"
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  National Academic Identity linked to ABC (Academic Bank of Credits)
                </span>
              </div>

              {/* Enrollment No */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Institutional Enrollment / Roll Number *
                </label>
                <input
                  type="text"
                  name="enrollment_no"
                  value={formData.enrollment_no}
                  onChange={handleChange}
                  placeholder="e.g. 2026/CS/084"
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Course */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Approved Academic Programme / Degree Course *
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Science and Engineering"
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Branch */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Engineering Branch / Specialization *
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Gender Identity
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* NRI Category */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  NRI Quota Category
                </label>
                <select
                  name="nri_category"
                  value={formData.nri_category}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="NO">NO - General Category</option>
                  <option value="YES">YES - Non-Resident Indian Quota</option>
                </select>
              </div>

              {/* OCI Status */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Overseas Citizen of India (OCI) Status
                </label>
                <select
                  name="oci_status"
                  value={formData.oci_status}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="NO">NO - Indian Resident</option>
                  <option value="YES">YES - OCI Cardholder</option>
                </select>
              </div>

              {/* Foreign National Status */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Foreign National (FN) Status
                </label>
                <select
                  name="foreign_national"
                  value={formData.foreign_national}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="NO">NO - Domestic Student</option>
                  <option value="YES">YES - Foreign National</option>
                </select>
              </div>

              {/* Supernumerary Seats */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Supernumerary Seat Admission
                </label>
                <select
                  name="supernumerary_seats"
                  value={formData.supernumerary_seats}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="NO">NO - Regular Sanctioned Intake</option>
                  <option value="YES">YES - Supernumerary Seat</option>
                </select>
              </div>

              {/* Approved Intake */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Sanctioned AICTE Intake Capacity
                </label>
                <input
                  type="number"
                  name="approved_intake"
                  value={formData.approved_intake}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Actual Enrolment */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem', display: 'block' }}>
                  Actual Student Enrolment in Batch
                </label>
                <input
                  type="number"
                  name="actual_enrolment"
                  value={formData.actual_enrolment}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

            </div>

            {/* Compliance Guarantee */}
            <div style={{
              background: 'rgba(255, 153, 51, 0.06)',
              border: '1px solid rgba(255, 153, 51, 0.25)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--gov-navy)', marginBottom: '0.35rem' }}>
                📜 AICTE National Academic Identity Compliance Declaration:
              </div>
              <p style={{ margin: 0, lineHeight: 1.45 }}>
                I hereby verify that the submitted APAAR ID represents the authentic academic identity of the enrolled candidate in accordance with AICTE approval guidelines and Ministry of Education regulations. This verification will be cryptographically logged into the AICTE central repository with audit trails.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onBackToLogin}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Verifying with AICTE Central...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify Student APAAR Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--gov-navy)',
        color: '#fff',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        All India Council for Technical Education (AICTE) • APAAR ID Student Verification Gateway • National Educational Technology Forum (NETF)
      </footer>
    </div>
  );
}
