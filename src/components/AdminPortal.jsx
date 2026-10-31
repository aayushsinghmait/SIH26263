import React, { useState } from 'react';
import { 
  LayoutDashboard, Send, Cpu, FileCheck2, History, Building2, 
  ShieldAlert, UserPlus, PlusCircle, CheckCircle2, AlertTriangle, 
  XCircle, Upload, Download, RefreshCw, Eye, ArrowRight, Sparkles, Filter,
  Layers, Database, Compass, Check, X, Shield, Lock,
  Activity, AlertOctagon, Scale, Server, GraduationCap
} from 'lucide-react';
import { runAICrossVerification, maskAadhaar, maskPAN, maskAPAAR } from '../utils/aiEngine';
import { generateVerificationPlan, executeDynamicVerification } from '../utils/dynamicVerificationEngine';
import { parseExcelFile, downloadApplicationTemplate, exportToExcel } from '../utils/excelHelper';
import { VerificationReportView } from './VerificationReportView';
import { AuditHistoryView } from './AuditHistoryView';
import { TelemetryView } from './TelemetryView';
import { FraudIntelligenceView } from './FraudIntelligenceView';
import { RuleStudioView } from './RuleStudioView';
import { 
  submitApplication, 
  triggerVerifyApplication, 
  triggerVerifyAllApplications 
} from '../services/api';

export function AdminPortal({ 
  applications = [], 
  ministries = [], 
  databases = {}, 
  datasetRegistry = [],
  complianceRules = [], 
  auditLogs = [], 
  isSocketConnected = true,
  onOpenCitizenRequest,
  onApplicationsUpdate, 
  onMinistriesUpdate, 
  onDatasetRegistryUpdate,
  onRulesUpdate, 
  onDecisionSubmit,
  onLogAudit 
}) {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD', 'SEND_APP', 'QUEUE', 'TELEMETRY', 'FRAUD', 'MINISTRIES', 'REGISTRY', 'RULE_STUDIO', 'AUDIT', 'REPORT'
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiProcessingStep, setAiProcessingStep] = useState('');
  const [uploadedBatchFileName, setUploadedBatchFileName] = useState('');
  const [stagedApplications, setStagedApplications] = useState([]);

  // Modals
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', roleLevel: 'SUPER_ADMIN' });
  const [adminList, setAdminList] = useState([
    { id: 'ADM-01', name: 'Dr. A. Verma', email: 'admin.apaar@aicte-india.org', role: 'APAAR Central Lead Administrator' },
    { id: 'ADM-02', name: 'Rohit Deshmukh', email: 'r.deshmukh@aicte-india.org', role: 'AICTE Institutional Data Reviewer' },
    { id: 'ADM-03', name: 'Meenakshi Sundaram', email: 'm.sundaram@aicte-india.org', role: 'APAAR Academic Audit Officer' }
  ]);

  const [showAddMinistryModal, setShowAddMinistryModal] = useState(false);
  const [newMinistry, setNewMinistry] = useState({
    code: '',
    name: '',
    category: 'AICTE Approved Institution',
    adminEmail: ''
  });

  // Calculate Metrics
  const totalApps = applications.length;
  const verifiedApps = applications.filter(a => a.status === 'VERIFIED').length;
  const reviewApps = applications.filter(a => a.status === 'NEEDS_REVIEW').length;
  const flaggedApps = applications.filter(a => a.status === 'FLAGGED').length;

  // Preview Dynamic Verification Plan (Feature 3)
  const handlePreviewPlan = (app) => {
    const plan = generateVerificationPlan(app, datasetRegistry, complianceRules);
    setActivePlan(plan);
    setShowPlanModal(true);
  };

  // View Report for an application (Page 16)
  const handleViewReport = (app) => {
    // Generate dynamic verification plan and execute cross-database checks
    const plan = generateVerificationPlan(app, datasetRegistry, complianceRules);
    const dynamicResult = executeDynamicVerification(app, plan, databases);
    const standardReport = runAICrossVerification(app, databases, complianceRules);

    // Merge into consolidated report format
    const consolidatedReport = {
      ...standardReport,
      verificationPlan: plan,
      evidenceLogs: dynamicResult.evidenceLogs,
      overallVerdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
      confidenceScore: dynamicResult.confidenceScore
    };

    setActiveReport(consolidatedReport);
    setSelectedApplicationId(app.id);
    setActiveTab('REPORT');
  };

  // Quick Test Live Student Record Generator (Simulates incoming student record submission)
  const handleQuickSendTestRequest = async () => {
    const samplePresets = [
      {
        applicant_name: 'Ananya Sharma',
        student_name: 'Ananya Sharma',
        scheme_name: 'B.Tech Computer Science and Engineering',
        course: 'B.Tech Computer Science and Engineering',
        branch: 'Computer Science',
        apaar_id: '9012-3456-7890',
        aadhaar_no: '9012-3456-7890',
        pan_no: '2026/CS/084',
        enrollment_no: '2026/CS/084',
        institution_code: 'IITD',
        state: 'Delhi',
        dob: '2004-05-14',
        gender: 'Female',
        claimed_income: 'N/A',
        education_roll: '2026/CS/084',
        approved_intake: 120,
        actual_enrolment: 118,
        supernumerary_seats: 'NO',
        nri_category: 'NO',
        oci_status: 'NO',
        foreign_national: 'NO',
        status: 'PENDING_AI_CHECK'
      },
      {
        applicant_name: 'Aarav Patel',
        student_name: 'Aarav Patel',
        scheme_name: 'B.Tech Electrical Engineering',
        course: 'B.Tech Electrical Engineering',
        branch: 'Electrical Engineering',
        apaar_id: '4567-8901-2345',
        aadhaar_no: '4567-8901-2345',
        pan_no: '2026/EE/102',
        enrollment_no: '2026/EE/102',
        institution_code: 'BITS',
        state: 'Rajasthan',
        dob: '2003-11-20',
        gender: 'Male',
        claimed_income: 'N/A',
        education_roll: '2026/EE/102',
        approved_intake: 180,
        actual_enrolment: 175,
        supernumerary_seats: 'YES',
        nri_category: 'YES',
        oci_status: 'NO',
        foreign_national: 'NO',
        status: 'PENDING_AI_CHECK'
      },
      {
        applicant_name: 'Rohan Mehra',
        student_name: 'Rohan Mehra',
        scheme_name: 'B.Tech Mechanical Engineering',
        course: 'B.Tech Mechanical Engineering',
        branch: 'Mechanical Engineering',
        apaar_id: '6789-0123-4567',
        aadhaar_no: '6789-0123-4567',
        pan_no: '2026/ME/055',
        enrollment_no: '2026/ME/055',
        institution_code: 'VIT',
        state: 'Tamil Nadu',
        dob: '2004-02-18',
        gender: 'Male',
        claimed_income: 'N/A',
        education_roll: '2026/ME/055',
        approved_intake: 60,
        actual_enrolment: 65,
        supernumerary_seats: 'YES',
        nri_category: 'NO',
        oci_status: 'NO',
        foreign_national: 'YES',
        status: 'PENDING_AI_CHECK'
      }
    ];

    const pick = samplePresets[Math.floor(Math.random() * samplePresets.length)];
    const newId = `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await submitApplication({
        ...pick,
        id: newId,
        submittedBy: `${pick.applicant_name} (Live Test Stream)`,
        sourcePortal: 'MERN Live Generator'
      });
      // Will broadcast via socket.io immediately!
    } catch (err) {
      console.warn('API error, applying locally:', err.message);
      const fallbackApp = {
        ...pick,
        id: newId,
        ai_verdict: 'PENDING',
        confidence_score: 0,
        submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      if (onApplicationsUpdate) {
        onApplicationsUpdate(prev => [fallbackApp, ...prev]);
      }
    }
  };

  // Verify single application via API
  const handleVerifySingle = async (appId) => {
    try {
      await triggerVerifyApplication(appId);
    } catch (err) {
      const target = applications.find(a => a.id === appId);
      if (!target) return;
      const plan = generateVerificationPlan(target, datasetRegistry, complianceRules);
      const dynamicResult = executeDynamicVerification(target, plan, databases);
      let status = 'VERIFIED';
      if (dynamicResult.overallVerdict === 'MISMATCH_DETECTED') status = 'FLAGGED';
      else if (dynamicResult.overallVerdict === 'MANUAL_REVIEW_REQUIRED') status = 'NEEDS_REVIEW';

      if (onApplicationsUpdate) {
        onApplicationsUpdate(prev => prev.map(a => a.id === appId ? {
          ...a,
          status,
          ai_verdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
          confidence_score: dynamicResult.confidenceScore
        } : a));
      }
    }
  };

  // Run AI Verification on all pending / selected applications using Central Dynamic Discovery
  const handleRunBatchVerification = async () => {
    setIsProcessingAI(true);
    setAiProcessingStep('Querying Central Dataset Registry for active schemas & sharing agreements...');
    await new Promise(r => setTimeout(r, 500));

    setAiProcessingStep('Executing dynamic cross-checks & rule evaluations on MERN backend...');

    try {
      await triggerVerifyAllApplications();
    } catch (err) {
      console.warn('API batch verify error, falling back locally:', err.message);
      const updated = applications.map(app => {
        const plan = generateVerificationPlan(app, datasetRegistry, complianceRules);
        const dynamicResult = executeDynamicVerification(app, plan, databases);

        let status = 'VERIFIED';
        if (dynamicResult.overallVerdict === 'MISMATCH_DETECTED') status = 'FLAGGED';
        else if (dynamicResult.overallVerdict === 'MANUAL_REVIEW_REQUIRED') status = 'NEEDS_REVIEW';

        return {
          ...app,
          status,
          ai_verdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
          confidence_score: dynamicResult.confidenceScore
        };
      });

      if (onApplicationsUpdate) {
        onApplicationsUpdate(updated);
      }
    }

    setIsProcessingAI(false);
    setAiProcessingStep('');

    if (onLogAudit) {
      onLogAudit({
        actor: 'GovVerify Central AI Engine v3.0',
        portal: 'Automated AI Engine',
        action: 'DYNAMIC_MULTI_DATABASE_BATCH_COMPLETE',
        details: `Successfully discovered and executed dynamic verification plans across Central Dataset Registry for ${applications.length} applications.`,
        severity: 'SUCCESS'
      });
    }
  };

  // Handle Student Enrollment Excel Upload
  const handleApplicationFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadedBatchFileName(file.name);
      const rows = await parseExcelFile(file);
      if (rows && rows.length > 0) {
        const parsedApps = rows.map((r, i) => ({
          ...r,
          id: r.id || r.Student_ID || r.student_id || r.Application_ID || `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          student_name: r.student_name || r.Student_Name || r.applicant_name || r.Applicant_Name || r.full_name || r.Name || 'Student ' + (i + 1),
          applicant_name: r.student_name || r.Student_Name || r.applicant_name || r.Applicant_Name || r.full_name || r.Name || 'Student ' + (i + 1),
          apaar_id: r.apaar_id || r.APAAR_ID || r.apaar_no || r.aadhaar_no || '',
          aadhaar_no: r.apaar_id || r.APAAR_ID || r.apaar_no || r.aadhaar_no || '',
          enrollment_no: r.enrollment_no || r.Enrollment_No || r.roll_no || r.pan_no || '',
          pan_no: r.enrollment_no || r.Enrollment_No || r.roll_no || r.pan_no || '',
          course: r.course || r.Course || r.program || r.degree || 'B.Tech Computer Science and Engineering',
          branch: r.branch || r.Branch || 'Computer Science',
          scheme_name: r.course || r.Course || 'B.Tech Computer Science and Engineering',
          dob: r.dob || r.Date_of_Birth || r.DOB || '2004-01-01',
          gender: r.gender || r.Gender || 'Not Specified',
          father_name: r.father_name || r.Father_Name || '',
          institution_code: r.institution_code || r.Institution_Code || 'IITD',
          state: r.state || r.State || 'Delhi',
          pin_code: r.pin_code || r.Pin_Code || '110016',
          approved_intake: Number(r.approved_intake || r.Approved_Intake || 120),
          actual_enrolment: Number(r.actual_enrolment || r.Actual_Enrolment || 118),
          supernumerary_seats: r.supernumerary_seats || r.Supernumerary_Seats || 'NO',
          nri_category: r.nri_category || r.NRI_Category || 'NO',
          oci_status: r.oci_status || r.OCI_Status || 'NO',
          foreign_national: r.foreign_national || r.Foreign_National || 'NO',
          status: 'PENDING_AI_CHECK',
          ai_verdict: 'PENDING',
          confidence_score: 0,
          submitted_at: new Date().toLocaleString()
        }));

        setStagedApplications(parsedApps);
      }
    } catch (err) {
      alert('Error parsing student enrollment Excel: ' + err.message);
    }
  };

  // Commit Staged Student Records via API
  const handleCommitApplications = async () => {
    if (stagedApplications.length === 0) return;

    try {
      await submitApplication(stagedApplications);
    } catch (err) {
      const combined = [...stagedApplications, ...applications];
      if (onApplicationsUpdate) {
        onApplicationsUpdate(combined);
      }
    }

    if (onLogAudit) {
      onLogAudit({
        actor: 'APAAR Admin User',
        portal: 'APAAR Team Portal',
        action: 'UPLOAD_STUDENT_ENROLLMENT_BATCH',
        details: `Submitted new student enrollment batch "${uploadedBatchFileName}" containing ${stagedApplications.length} entries. Ready for AICTE APAAR inspection.`,
        severity: 'INFO'
      });
    }

    alert(`Successfully loaded ${stagedApplications.length} student records into the APAAR verification queue!`);
    setStagedApplications([]);
    setActiveTab('QUEUE');
  };

  // Add Another APAAR Team Member
  const handleAddAdminSubmit = (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) return;

    const added = {
      id: `ADM-0${adminList.length + 1}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.roleLevel === 'SUPER_ADMIN' ? 'APAAR Central Administrator' : 'Institutional Data Reviewer'
    };

    setAdminList([...adminList, added]);
    setShowAddAdminModal(false);
    setNewAdmin({ name: '', email: '', roleLevel: 'SUPER_ADMIN' });

    if (onLogAudit) {
      onLogAudit({
        actor: 'APAAR Lead (ADM-01)',
        portal: 'APAAR Team Portal',
        action: 'ADD_APAAR_MEMBER',
        details: `Created new APAAR administrative officer account for ${added.name} (${added.email}) with role [${added.role}].`,
        severity: 'INFO'
      });
    }
  };

  // Add Institution (Only authorized institutions can login)
  const handleAddMinistrySubmit = (e) => {
    e.preventDefault();
    if (!newMinistry.code || !newMinistry.name || !newMinistry.adminEmail) return;

    const addedMin = {
      id: `inst-${newMinistry.code.toLowerCase()}`,
      code: newMinistry.code.toUpperCase(),
      name: newMinistry.name,
      category: newMinistry.category || 'AICTE Approved Institution',
      adminEmail: newMinistry.adminEmail,
      status: 'ACTIVE',
      recordsCount: 0,
      approvedIntake: 600,
      actualEnrolment: 0,
      lastSync: new Date().toLocaleString()
    };

    onMinistriesUpdate([...ministries, addedMin]);
    setShowAddMinistryModal(false);
    setNewMinistry({ code: '', name: '', category: 'AICTE Approved Institution', adminEmail: '' });

    if (onLogAudit) {
      onLogAudit({
        actor: 'APAAR Lead (ADM-01)',
        portal: 'APAAR Team Portal',
        action: 'ADD_INSTITUTION',
        details: `Provisioned authorized institution portal access for "${addedMin.name}" [Code: ${addedMin.code}]. Allowed login for ${addedMin.adminEmail}.`,
        severity: 'SUCCESS'
      });
    }

    alert(`Institution "${addedMin.name}" has been authorized! Only this institution can now log into the Institution Portal.`);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Admin Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="brand-tag">APAAR Team Central Portal</span>
            <span className="badge badge-info">Multi-Institution Student Oversight</span>
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>Automated APAAR Student Verification & AICTE Oversight</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Autonomous APAAR validation, intake capacity verification, and duplicate enrolment detection across AICTE-approved institutions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setShowAddAdminModal(true)}>
            <UserPlus size={16} />
            Add APAAR Member
          </button>

          <button className="btn-secondary" onClick={() => setShowAddMinistryModal(true)}>
            <GraduationCap size={16} color="var(--gov-teal)" />
            Add Institution
          </button>

          <button
            className="btn-primary"
            onClick={handleRunBatchVerification}
            disabled={isProcessingAI}
          >
            <Sparkles size={16} />
            {isProcessingAI ? 'APAAR Verification Running...' : 'Execute APAAR Cross-Check on All'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-header" style={{ flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
          onClick={() => setActiveTab('DASHBOARD')}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>

        <button
          className={`tab-btn ${activeTab === 'SEND_APP' ? 'active' : ''}`}
          onClick={() => setActiveTab('SEND_APP')}
        >
          <Upload size={16} />
          Upload Student Records
        </button>

        <button
          className={`tab-btn ${activeTab === 'QUEUE' ? 'active' : ''}`}
          onClick={() => setActiveTab('QUEUE')}
        >
          <Cpu size={16} />
          Student Record Queue ({applications.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'TELEMETRY' ? 'active' : ''}`}
          onClick={() => setActiveTab('TELEMETRY')}
        >
          <Activity size={16} />
          Live Telemetry
        </button>

        <button
          className={`tab-btn ${activeTab === 'FRAUD' ? 'active' : ''}`}
          onClick={() => setActiveTab('FRAUD')}
          style={activeTab === 'FRAUD' ? {} : { color: 'var(--gov-crimson)' }}
        >
          <AlertOctagon size={16} />
          Anomaly & Duplicate Detection
        </button>

        <button
          className={`tab-btn ${activeTab === 'MINISTRIES' ? 'active' : ''}`}
          onClick={() => setActiveTab('MINISTRIES')}
        >
          <GraduationCap size={16} />
          Institutions ({ministries.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'REGISTRY' ? 'active' : ''}`}
          onClick={() => setActiveTab('REGISTRY')}
        >
          <Layers size={16} />
          Dataset Registry ({datasetRegistry.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'RULE_STUDIO' ? 'active' : ''}`}
          onClick={() => setActiveTab('RULE_STUDIO')}
        >
          <Scale size={16} />
          AICTE Rule Studio ({complianceRules.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'AUDIT' ? 'active' : ''}`}
          onClick={() => setActiveTab('AUDIT')}
        >
          <History size={16} />
          Immutable Audit Log
        </button>

        {activeReport && (
          <button
            className={`tab-btn ${activeTab === 'REPORT' ? 'active' : ''}`}
            onClick={() => setActiveTab('REPORT')}
            style={{ borderColor: 'var(--primary)' }}
          >
            <FileCheck2 size={16} color="var(--primary-light)" />
            Report: #{activeReport.applicationId}
          </button>
        )}
      </div>

      {/* AI Processing Banner */}
      {isProcessingAI && (
        <div className="glass-panel" style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--primary)',
          background: 'rgba(99, 102, 241, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="pulse-indicator" style={{ width: '14px', height: '14px', background: 'var(--primary)' }}></div>
            <div>
              <strong style={{ fontSize: '1rem', color: '#fff' }}>APAAR AICTE Verification Engine Active</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--primary-light)', marginTop: '0.2rem' }}>
                {aiProcessingStep}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: DASHBOARD (PAGE 2) */}
      {activeTab === 'DASHBOARD' && (
        <div>
          {/* KPI Metrics */}
          <div className="metrics-grid">
            <div className="glass-panel metric-card">
              <div className="metric-info">
                <h3>Total Student Records</h3>
                <div className="value">{totalApps}</div>
                <span className="badge badge-neutral" style={{ marginTop: '0.5rem' }}>AICTE Enrolment Repository</span>
              </div>
              <div className="metric-icon-box">
                <GraduationCap size={24} color="var(--gov-navy)" />
              </div>
            </div>

            <div className="glass-panel metric-card border-teal">
              <div className="metric-info">
                <h3>Verified Authentic Students</h3>
                <div className="value" style={{ color: 'var(--gov-teal)' }}>{verifiedApps}</div>
                <span className="badge badge-pass" style={{ marginTop: '0.5rem' }}>100% APAAR Matched</span>
              </div>
              <div className="metric-icon-box" style={{ borderColor: 'var(--gov-teal)', background: 'var(--gov-white)' }}>
                <CheckCircle2 size={24} color="var(--gov-teal)" />
              </div>
            </div>

            <div className="glass-panel metric-card border-amber">
              <div className="metric-info">
                <h3>Pending / Discrepancy</h3>
                <div className="value" style={{ color: 'var(--gov-amber)' }}>{reviewApps}</div>
                <span className="badge badge-review" style={{ marginTop: '0.5rem' }}>Intake / Quota Flags</span>
              </div>
              <div className="metric-icon-box" style={{ borderColor: 'var(--gov-amber)', background: 'var(--gov-white)' }}>
                <AlertTriangle size={24} color="var(--gov-amber)" />
              </div>
            </div>

            <div className="glass-panel metric-card border-crimson">
              <div className="metric-info">
                <h3>Flagged / Duplicate Enrolment</h3>
                <div className="value" style={{ color: 'var(--gov-crimson)' }}>{flaggedApps}</div>
                <span className="badge badge-fail" style={{ marginTop: '0.5rem' }}>Dual Institution / Excess</span>
              </div>
              <div className="metric-icon-box" style={{ borderColor: 'var(--gov-crimson)', background: 'var(--gov-white)' }}>
                <XCircle size={24} color="var(--gov-crimson)" />
              </div>
            </div>
          </div>

          {/* Quick Queue Summary Table */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>Recent Student Records & APAAR Verification Status</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Click "Report" on any row to open the complete academic verification breakdown.
                </p>
              </div>

              <button className="btn-secondary btn-sm" onClick={() => setActiveTab('QUEUE')}>
                View Complete Student Queue
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>APAAR ID</th>
                    <th>Enrollment No</th>
                    <th>Institution / State</th>
                    <th>AI Confidence</th>
                    <th>Verdict</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id}>
                      <td><span className="mono" style={{ fontWeight: 600 }}>{app.id}</span></td>
                      <td><strong>{app.student_name || app.applicant_name}</strong></td>
                      <td><span className="mono">{maskAPAAR(app.apaar_id || app.aadhaar_no)}</span></td>
                      <td><span className="mono">{app.enrollment_no || app.pan_no}</span></td>
                      <td>{app.institution_code || app.state}</td>
                      <td>
                        <strong>{app.confidence_score || '—'}%</strong>
                      </td>
                      <td>
                        {app.ai_verdict === 'PASS' && <span className="badge badge-pass">PASS</span>}
                        {app.ai_verdict === 'NEEDS_REVIEW' && <span className="badge badge-review">NEEDS REVIEW</span>}
                        {app.ai_verdict === 'FAIL' && <span className="badge badge-fail">FAIL</span>}
                        {(!app.ai_verdict || app.ai_verdict === 'PENDING') && (
                          <span className="badge badge-neutral">PENDING CHECK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => handlePreviewPlan(app)}
                            title="Preview Dynamic AICTE Verification Plan"
                          >
                            <Compass size={13} color="var(--primary-light)" />
                            Plan
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => handleViewReport(app)}
                          >
                            <Eye size={13} />
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD STUDENT ENROLLMENT BATCH */}
      {activeTab === 'SEND_APP' && (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--border-glow)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Upload size={32} color="var(--primary-light)" />
              </div>
              <h1 style={{ fontSize: '1.65rem', marginBottom: '0.4rem' }}>
                Upload Student Enrollment Batch (AICTE Ingestion)
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                Upload post-admission student records in Excel format (.xlsx, .xls, .csv). The AICTE Central APAAR Engine will automatically validate 12-digit APAAR IDs, check against approved intake capacities, verify supernumerary NRI/OCI/FN seats, and detect cross-institution duplicate enrolments.
              </p>
            </div>

            {stagedApplications.length === 0 ? (
              <div>
                <label className="dropzone" style={{ display: 'block', marginBottom: '1.5rem' }}>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleApplicationFileUpload}
                  />
                  <Upload size={32} color="var(--primary-light)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>Click to browse or drop Student Enrollment Excel</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Expected columns: Student_ID, Student_Name, APAAR_ID, Enrollment_No, Course, Branch, Approved_Intake, Actual_Enrolment, NRI_Category, OCI_Status, Foreign_National, Supernumerary_Seats
                  </p>
                </label>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={downloadApplicationTemplate}>
                    <Download size={16} />
                    Download Student Enrollment Excel Template (.xlsx)
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <strong style={{ color: '#fff' }}>File: {uploadedBatchFileName}</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {stagedApplications.length} valid student records extracted and parsed.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setStagedApplications([])}>
                      Discard
                    </button>
                    <button className="btn-primary btn-sm" onClick={handleCommitApplications}>
                      <CheckCircle2 size={16} />
                      Send to APAAR Verification Queue
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Batch Preview:</h3>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>APAAR ID</th>
                        <th>Enrollment No</th>
                        <th>Course / Branch</th>
                        <th>Intake & Quotas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedApplications.map((app, idx) => (
                        <tr key={idx}>
                          <td><span className="mono">{app.id}</span></td>
                          <td><strong>{app.student_name || app.applicant_name}</strong></td>
                          <td><span className="mono">{maskAPAAR(app.apaar_id || app.aadhaar_no)}</span></td>
                          <td><span className="mono">{app.enrollment_no || app.pan_no}</span></td>
                          <td>{app.course || app.scheme_name}</td>
                          <td>
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              Intake: {app.actual_enrolment || 0}/{app.approved_intake || 0}
                              {app.nri_category === 'YES' ? ' • NRI' : ''}
                              {app.oci_status === 'YES' ? ' • OCI' : ''}
                              {app.foreign_national === 'YES' ? ' • FN' : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATION QUEUE */}
      {activeTab === 'QUEUE' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Active Student Enrollment Queue & APAAR Match Index</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                AICTE Central Engine inspects each submitted student record against national APAAR registries, institutional intake quotas, and cross-college databases.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={handleQuickSendTestRequest}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#FF9933', color: 'var(--text-primary)', fontWeight: 600 }}
                title="Simulate a live student record submission to test real-time WebSocket receipt"
              >
                <Send size={15} color="#FF9933" />
                ⚡ Simulate Live Ingestion
              </button>

              {onOpenCitizenRequest && (
                <button
                  className="btn-secondary"
                  onClick={onOpenCitizenRequest}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  title="Open Student / Employer Verification Portal"
                >
                  <UserPlus size={15} />
                  Public Verification Portal
                </button>
              )}

              <button
                className="btn-primary"
                onClick={handleRunBatchVerification}
                disabled={isProcessingAI}
              >
                <Cpu size={16} />
                {isProcessingAI ? 'Running APAAR AI Engine...' : 'Run APAAR Cross-Verification'}
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Program / Branch</th>
                    <th>Student Name</th>
                    <th>APAAR ID</th>
                    <th>Enrollment No</th>
                    <th>Intake & Quotas</th>
                    <th>AI Confidence</th>
                    <th>Verdict</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td><span className="mono" style={{ fontWeight: 700 }}>{app.id}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        {app.course || app.scheme_name}
                      </td>
                      <td><strong>{app.student_name || app.applicant_name}</strong></td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.82rem' }}>
                          {maskAPAAR(app.apaar_id || app.aadhaar_no)}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.82rem' }}>
                          {app.enrollment_no || app.pan_no}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          Intake: {app.actual_enrolment || 118}/{app.approved_intake || 120}
                          {app.nri_category === 'YES' ? ' • NRI' : ''}
                          {app.oci_status === 'YES' ? ' • OCI' : ''}
                          {app.foreign_national === 'YES' ? ' • FN' : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '40px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${app.confidence_score || 0}%`,
                              height: '100%',
                              background: (app.confidence_score || 0) >= 80 ? 'var(--success)' : (app.confidence_score || 0) >= 50 ? 'var(--warning)' : 'var(--danger)'
                            }}></div>
                          </div>
                          <strong>{app.confidence_score || 0}%</strong>
                        </div>
                      </td>
                      <td>
                        {app.ai_verdict === 'PASS' && <span className="badge badge-pass">PASS</span>}
                        {app.ai_verdict === 'NEEDS_REVIEW' && <span className="badge badge-review">NEEDS REVIEW</span>}
                        {app.ai_verdict === 'FAIL' && <span className="badge badge-fail">FAIL</span>}
                        {(!app.ai_verdict || app.ai_verdict === 'PENDING') && (
                          <span className="badge badge-neutral">PENDING</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {(!app.ai_verdict || app.ai_verdict === 'PENDING' || app.status === 'PENDING_AI_CHECK') && (
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => handleVerifySingle(app.id)}
                              title="Run autonomous APAAR verification on this student record"
                              style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                            >
                              <Sparkles size={13} color="#f59e0b" />
                              Run AI
                            </button>
                          )}
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => handlePreviewPlan(app)}
                            title="Preview Dynamic AICTE Verification Plan"
                          >
                            <Compass size={13} color="var(--primary-light)" />
                            Plan
                          </button>
                          <button className="btn-primary btn-sm" onClick={() => handleViewReport(app)}>
                            <FileCheck2 size={13} />
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CENTRAL DATASET REGISTRY (FEATURE 1) */}
      {activeTab === 'REGISTRY' && (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-info">Feature 1 • Central Dataset Registry</span>
                <span className="badge badge-pass">Auto-Registered & Synced</span>
              </div>
              <h2 style={{ fontSize: '1.45rem' }}>Authorized Cross-Ministry Dataset Registry</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Catalog of authorized government datasets accessible by the AI verification engine with strict purpose limitations and DPDP compliance.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  exportToExcel(datasetRegistry, 'Central_Dataset_Registry_Catalog.xlsx', 'Registry');
                }}
              >
                <Download size={16} />
                Export Registry (Excel)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {datasetRegistry.map((ds) => (
              <div key={ds.datasetId} className="glass-panel" style={{ padding: '1.75rem', border: '1px solid var(--border-glow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                    {ds.datasetId}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className={`badge ${ds.sensitivity === 'CONFIDENTIAL' ? 'badge-fail' : ds.sensitivity === 'RESTRICTED' ? 'badge-review' : 'badge-neutral'}`}>
                      <Lock size={12} />
                      {ds.sensitivity}
                    </span>
                    <span className="badge badge-pass">
                      {ds.sharingAgreementActive ? 'SHARING AGREEMENT ACTIVE' : 'PENDING AGREEMENT'}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{ds.name}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Owning Authority: <strong style={{ color: '#fff' }}>{ds.owningMinistry}</strong>
                </p>

                <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>Statutory Purpose</div>
                  <p style={{ color: 'var(--text-secondary)' }}>{ds.purpose}</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Supported Search Keys & Verification Methods:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {ds.supportedSearchKeys.map((k, idx) => (
                      <span key={idx} className="mono" style={{ padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--primary-light)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Available Schema Fields ({ds.availableFields.length} columns):
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {ds.availableFields.map((f, idx) => (
                      <span key={idx} title={`${f.field} (${f.type}): ${f.description}`} style={{ padding: '0.15rem 0.45rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                        {f.field}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Adapter: <strong style={{ color: '#fff' }}>{ds.adapterType}</strong></span>
                  <span>Sync: {ds.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUTHORIZED INSTITUTIONS */}
      {activeTab === 'MINISTRIES' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>AICTE-Approved Institutions & Student Registries</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Only institutions authorized by the AICTE APAAR Team can log in and submit student enrollment data.
              </p>
            </div>

            <button className="btn-primary" onClick={() => setShowAddMinistryModal(true)}>
              <GraduationCap size={16} />
              Add Institution
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {ministries.map((min) => {
              const recCount = (databases[min.code] || []).length;
              return (
                <div key={min.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-glow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-light)'
                    }}>
                      <GraduationCap size={24} />
                    </div>
                    <span className="badge badge-pass">AICTE APPROVED</span>
                  </div>

                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                    CODE: {min.code}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                    {min.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Category: {min.category}
                  </p>

                  <div style={{
                    padding: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}>
                    <div>Registrar / Nodal Email: <strong style={{ color: '#fff' }}>{min.adminEmail}</strong></div>
                    <div style={{ marginTop: '0.35rem' }}>
                      Approved Intake Capacity: <strong style={{ color: 'var(--primary-light)' }}>{min.approvedIntake || 600} seats</strong>
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      Submitted Student Records: <strong style={{ color: 'var(--primary-light)' }}>{recCount} records</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Registry Status: Synchronized for Central APAAR Discovery
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: COMPLIANCE RULES */}
      {activeTab === 'RULES' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>AICTE Approved Regulatory Compliance Rules</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Statutory admission and APAAR verification rules configured by AICTE administrators.
            </p>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Rule Code</th>
                    <th>Rule Name</th>
                    <th>Category</th>
                    <th>Regulatory Description</th>
                    <th>Strictness</th>
                    <th>Evaluation Outputs</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRules.map((rule) => (
                    <tr key={rule.id}>
                      <td><span className="mono" style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{rule.code}</span></td>
                      <td><strong>{rule.name}</strong></td>
                      <td><span className="badge badge-neutral">{rule.category}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
                        {rule.description}
                      </td>
                      <td>
                        <span className={`badge ${rule.strictness === 'CRITICAL' ? 'badge-fail' : rule.strictness === 'HIGH' ? 'badge-review' : 'badge-neutral'}`}>
                          {rule.strictness}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Pass • Fail • Needs Review • N/A • Unable to Verify
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TELEMETRY (PAGE 3) */}
      {activeTab === 'TELEMETRY' && (
        <TelemetryView applications={applications} ministries={ministries} />
      )}

      {/* TAB: FRAUD INTELLIGENCE (PAGE 4) */}
      {activeTab === 'FRAUD' && (
        <FraudIntelligenceView applications={applications} databases={databases} />
      )}

      {/* TAB: RULE STUDIO (PAGE 5) */}
      {activeTab === 'RULE_STUDIO' && (
        <RuleStudioView
          complianceRules={complianceRules}
          applications={applications}
          onRulesUpdate={onRulesUpdate}
        />
      )}

      {/* TAB: AUDIT HISTORY */}
      {activeTab === 'AUDIT' && (
        <AuditHistoryView logs={auditLogs} />
      )}

      {/* TAB: VERIFICATION REPORT (PAGE 16) */}
      {activeTab === 'REPORT' && activeReport && (
        <VerificationReportView
          report={activeReport}
          application={applications.find(a => a.id === activeReport.applicationId)}
          onBack={() => setActiveTab('QUEUE')}
          onDecisionSubmit={(decisionData) => {
            if (onDecisionSubmit) {
              onDecisionSubmit(decisionData);
            }
            if (onLogAudit) {
              onLogAudit({
                actor: 'APAAR Team Admin (ADM-01)',
                portal: 'APAAR Team Portal',
                action: 'FINAL_AUTHORIZED_DECISION',
                details: `Recorded decision [${decisionData.decision}] for ${decisionData.applicationId}. Remarks: "${decisionData.notes}"`,
                severity: decisionData.decision === 'APPROVE' ? 'SUCCESS' : decisionData.decision === 'REJECT' ? 'CRITICAL' : 'WARNING'
              });
            }
            alert(`Authorized decision [${decisionData.decision}] committed to the Immutable Audit Ledger!`);
          }}
        />
      )}

      {/* Modal: Add APAAR Team Member */}
      {showAddAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAddAdminModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Add APAAR Team Member</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Provision another administrative officer to the AICTE Central APAAR verification team.
            </p>

            <form onSubmit={handleAddAdminSubmit}>
              <div className="form-group">
                <label className="form-label">Officer Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sanjeev Kapoor"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official AICTE / MoE Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. s.kapoor@aicte-india.org"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permission Level</label>
                <select
                  className="form-select"
                  value={newAdmin.roleLevel}
                  onChange={(e) => setNewAdmin({ ...newAdmin, roleLevel: e.target.value })}
                >
                  <option value="SUPER_ADMIN">APAAR Central Lead Admin (Full Control)</option>
                  <option value="REVIEWER">Institutional Data Reviewer (Verification Sign-off)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddAdminModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Authorize APAAR Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Institution */}
      {showAddMinistryModal && (
        <div className="modal-overlay" onClick={() => setShowAddMinistryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Authorize New AICTE Institution</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Only institutions provisioned here will be allowed to log into the Institution Portal and submit student data.
            </p>

            <form onSubmit={handleAddMinistrySubmit}>
              <div className="form-group">
                <label className="form-label">Institution Code (Uppercase)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IITB, IITK, NITW"
                  value={newMinistry.code}
                  onChange={(e) => setNewMinistry({ ...newMinistry, code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Institution Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Indian Institute of Technology Bombay"
                  value={newMinistry.name}
                  onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Central University / Deemed University / AICTE Approved College"
                  value={newMinistry.category}
                  onChange={(e) => setNewMinistry({ ...newMinistry, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Authorized Registrar / Nodal Officer Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. registrar@iitb.ac.in"
                  value={newMinistry.adminEmail}
                  onChange={(e) => setNewMinistry({ ...newMinistry, adminEmail: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddMinistryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Institution Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DYNAMIC VERIFICATION PLAN (FEATURE 3 & 6) */}
      {showPlanModal && activePlan && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-info">Feature 3 • Dynamic Verification Plan</span>
                  <span className="badge badge-pass">Deterministic No-Hallucination Execution</span>
                </div>
                <h2 style={{ fontSize: '1.5rem' }}>AI Verification Plan: #{activePlan.applicationId}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Applicant: <strong style={{ color: '#fff' }}>{activePlan.applicantName}</strong> • Generated At: <span className="mono">{activePlan.generatedAt}</span>
                </p>
              </div>

              <button className="btn-secondary btn-sm" onClick={() => setShowPlanModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* 1. Fields to Validate */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} />
                1. Fields & Parameters to Validate ({activePlan.fieldsToValidate.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {activePlan.fieldsToValidate.map((f, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{f.label}</strong>
                      <span className={`badge ${f.priority === 'CRITICAL' ? 'badge-fail' : 'badge-review'}`} style={{ fontSize: '0.65rem' }}>{f.priority}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Dynamically Discovered Candidate Datasets */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Compass size={16} />
                2. AI-Discovered Datasets & Selection Rationale (No Hardcoding)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activePlan.selectedDatasets.map((ds, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{ds.name}</strong>
                      <span className="badge badge-pass">Access Authorized & Active</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Owning Authority: <strong>{ds.owningMinistry}</strong> • Keys: <span className="mono" style={{ color: 'var(--primary-light)' }}>{ds.matchedSearchKeys.join(', ')}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>
                      Selection Rationale: {ds.selectionRationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Automatic Check Expansions */}
            {activePlan.proposedExpansions && activePlan.proposedExpansions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  3. Automatic Check Expansion Proposal (Feature 6)
                </h3>
                {activePlan.proposedExpansions.map((exp, idx) => (
                  <div key={idx} style={{ padding: '0.9rem', background: 'rgba(245, 158, 11, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#fde68a', fontSize: '0.9rem' }}>{exp.targetDataset}</strong>
                      <span className="badge badge-review">Triggered Expansion</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Trigger: {exp.triggeredBy}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Objective: {exp.rationale}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button className="btn-secondary" onClick={() => setShowPlanModal(false)}>
                Close Plan
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const targetApp = applications.find(a => a.id === activePlan.applicationId);
                  setShowPlanModal(false);
                  if (targetApp) {
                    handleViewReport(targetApp);
                  }
                }}
              >
                <Cpu size={16} />
                Execute Cross-Verification on Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
