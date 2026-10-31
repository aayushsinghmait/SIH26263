import React, { useState } from 'react';
import { 
  ShieldAlert, AlertOctagon, UserX, FileWarning, Search, 
  Filter, Eye, CheckCircle2, XCircle, ArrowUpRight, Download, 
  ExternalLink, Layers, Fingerprint, Lock, ShieldCheck
} from 'lucide-react';
import { maskAadhaar, maskPAN } from '../utils/aiEngine';
import { exportToExcel } from '../utils/excelHelper';

export function FraudIntelligenceView({ applications = [], databases = {}, onFreezeApplication }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Synthesize realistic cross-institution APAAR and AICTE enrolment anomaly signals
  const fraudIncidents = [
    {
      id: 'INC-2026-081',
      applicationId: 'STU-2026-902',
      applicantName: 'Aarav Patel',
      threatType: 'DUPLICATE_CROSS_INSTITUTION_ENROLMENT',
      severity: 'CRITICAL',
      detectedDate: '2026-10-23 13:46:12',
      aadhaarNo: '4567-8901-2345',
      panNo: '2026/EE/102',
      description: 'Critical Anomaly: Student APAAR ID (4567-8901-2345) is simultaneously active in full-time B.Tech programs at IIT Delhi (IITD) and VIT Vellore (VIT), violating AICTE dual enrolment regulations.',
      conflictingMinistries: ['IITD', 'VIT'],
      riskScore: 98,
      status: 'UNDER_ACTIVE_INVESTIGATION',
      evidenceVector: {
        submittedName: 'Aarav Patel',
        primaryEnrollment: 'IIT Delhi (B.Tech EE) - Active',
        secondaryEnrollment: 'VIT Vellore (B.Tech ECE) - Active',
        duplicateStatus: 'CONCURRENT_FULL_TIME_BREACH'
      }
    },
    {
      id: 'INC-2026-082',
      applicationId: 'STU-2026-904',
      applicantName: 'Rohan Mehra',
      threatType: 'SANCTIONED_INTAKE_BREACH_AND_QUOTA_OVERAGE',
      severity: 'HIGH',
      detectedDate: '2026-10-23 11:33:04',
      aadhaarNo: '6789-0123-4567',
      panNo: '2026/ME/055',
      description: 'Intake Capacity Violation: Actual enrolment (65 students) exceeds approved AICTE intake (60 seats) in Mechanical Engineering at VIT. Supernumerary FN admissions exceed the 15% quota ceiling.',
      conflictingMinistries: ['VIT', 'AICTE_CENTRAL'],
      riskScore: 84,
      status: 'REGULATORY_SHOW_CAUSE_ISSUED',
      evidenceVector: {
        submittedName: 'Rohan Mehra',
        sanctionedIntake: '60 Seats',
        actualEnrolled: '65 Students (5 Excess)',
        quotaStatus: 'FN_QUOTA_CEILING_EXCEEDED'
      }
    },
    {
      id: 'INC-2026-083',
      applicationId: 'STU-2026-903',
      applicantName: 'Vikram Singh',
      threatType: 'SYNTHETIC_OR_UNSEEDED_APAAR_ID',
      severity: 'HIGH',
      detectedDate: '2026-10-23 15:21:40',
      aadhaarNo: '9988-7766-5544',
      panNo: '2026/ME/112',
      description: 'Unseeded Academic Identity: Submitted APAAR ID has no cryptographic match in the National Academic Depository (NAD/DigiLocker) and does not map to any recognized school or intermediate board.',
      conflictingMinistries: ['AICTE_CENTRAL', 'NAD_ABC'],
      riskScore: 91,
      status: 'VERIFICATION_HOLD',
      evidenceVector: {
        submittedName: 'Vikram Singh',
        apaarStatus: 'UNSEEDED_IN_CENTRAL_REGISTRY',
        academicLedger: 'NO_BOARD_EXAM_LINKAGE',
        actionRequired: 'MANDATORY_INSTITUTIONAL_AUDIT'
      }
    }
  ];

  const filteredIncidents = fraudIncidents.filter(inc => {
    const matchesSearch = 
      inc.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.threatType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = filterSeverity === 'ALL' || inc.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleExportFraudReport = () => {
    const rows = filteredIncidents.map(inc => ({
      Incident_ID: inc.id,
      Student_ID: inc.applicationId,
      Student_Name: inc.applicantName,
      Threat_Classification: inc.threatType,
      Severity: inc.severity,
      Risk_Score: inc.riskScore,
      Institutions_Involved: inc.conflictingMinistries.join(', '),
      Status: inc.status,
      Description: inc.description
    }));
    exportToExcel(rows, 'AICTE_APAAR_Enrolment_Anomaly_Dossier.xlsx', 'AnomalyDossier');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.75rem',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.75rem',
            color: '#f87171',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            <ShieldAlert size={14} />
            AICTE Forensics & Anomaly Intelligence
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>AICTE Duplicate Enrolment & Intake Anomaly Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Automated detection of concurrent dual enrolments across colleges, unseeded APAAR IDs, and excess admissions breaching approved intake capacities.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleExportFraudReport}>
          <Download size={16} />
          Export Anomaly Dossier (.xlsx)
        </button>
      </div>

      {/* Threat Metrics Overview */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Active Enrolment Anomalies</h3>
            <div className="value" style={{ color: '#f87171' }}>{fraudIncidents.length}</div>
            <span className="badge badge-fail" style={{ marginTop: '0.5rem' }}>Automated Quarantine</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
            <AlertOctagon size={24} color="#f87171" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Cross-College Duplicate Enrolments</h3>
            <div className="value" style={{ color: '#fbbf24' }}>1</div>
            <span className="badge badge-review" style={{ marginTop: '0.5rem' }}>Dual Institution Flag</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--warning-border)', background: 'var(--warning-bg)' }}>
            <Fingerprint size={24} color="#fbbf24" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Sanctioned Intake Breaches</h3>
            <div className="value" style={{ color: 'var(--accent)' }}>1</div>
            <span className="badge badge-neutral" style={{ marginTop: '0.5rem' }}>Capacity Overrun</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
            <UserX size={24} color="var(--accent)" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Protected Sanctioned Seats</h3>
            <div className="value" style={{ color: '#34d399' }}>1,840</div>
            <span className="badge badge-pass" style={{ marginTop: '0.5rem' }}>Intake Integrity Maintained</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
            <ShieldCheck size={24} color="#34d399" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by Applicant, Application ID, Threat Vector, or Ministry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="form-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Threats</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium / Informational</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Threat ID</th>
                <th>Target Application</th>
                <th>Applicant Name</th>
                <th>Aadhaar / PAN</th>
                <th>Threat Classification</th>
                <th>Conflicting Registries</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.id} style={{
                  background: selectedIncident?.id === inc.id ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: '#f87171' }}>
                      {inc.id}
                    </span>
                  </td>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{inc.applicationId}</span></td>
                  <td><strong>{inc.applicantName}</strong></td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>
                      <div>{maskAadhaar(inc.aadhaarNo)}</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{maskPAN(inc.panNo)}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-fail" style={{ fontSize: '0.7rem' }}>
                      {inc.threatType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {inc.conflictingMinistries.map(m => (
                        <span key={m} className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{m}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{
                        width: '38px',
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${inc.riskScore}%`,
                          height: '100%',
                          background: inc.riskScore > 80 ? '#ef4444' : '#f59e0b'
                        }}></div>
                      </div>
                      <strong style={{ color: inc.riskScore > 80 ? '#f87171' : '#fbbf24', fontSize: '0.85rem' }}>
                        {inc.riskScore}/100
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-review" style={{ fontSize: '0.7rem' }}>
                      {inc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedIncident(inc)}
                    >
                      <Eye size={13} />
                      Inspect Forensic Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Inspection Modal / Side Drawer */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-fail" style={{ marginBottom: '0.4rem' }}>
                  Forensic Intelligence Dossier • {selectedIncident.id}
                </span>
                <h2 style={{ fontSize: '1.35rem' }}>{selectedIncident.threatType.replace(/_/g, ' ')}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Target Application: {selectedIncident.applicationId} • Applicant: {selectedIncident.applicantName}
                </p>
              </div>

              <button className="btn-secondary btn-sm" onClick={() => setSelectedIncident(null)}>
                Close
              </button>
            </div>

            {/* Incident Summary Card */}
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger-border)',
              marginBottom: '1.5rem'
            }}>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Forensic Anomaly Finding:</strong>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.35rem', lineHeight: '1.5' }}>
                {selectedIncident.description}
              </p>
            </div>

            {/* Evidence Vector Comparison */}
            <h3 style={{ fontSize: '0.98rem', marginBottom: '0.75rem' }}>Cross-Registry Evidence Comparison:</h3>
            <div className="table-container" style={{ marginBottom: '1.5rem' }}>
              <table className="gov-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Submitted / Discovered Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedIncident.evidenceVector).map(([key, val]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                      </td>
                      <td><span className="mono">{String(val)}</span></td>
                      <td>
                        {String(val).includes('NO_RECORD') || String(val).includes('MISMATCH') || String(val).includes('AUDIT_FLAGGED') ? (
                          <span className="badge badge-fail">ALERT</span>
                        ) : (
                          <span className="badge badge-pass">DISCOVERED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Authorized Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button 
                className="btn-danger"
                onClick={() => {
                  alert(`Application ${selectedIncident.applicationId} has been placed on Statutory Vigilance Freeze. Cross-ministry alert broadcasted.`);
                  setSelectedIncident(null);
                }}
              >
                <Lock size={14} />
                Enforce Statutory Freeze
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  alert(`Summons & clarification notice dispatched to ${selectedIncident.applicantName}.`);
                  setSelectedIncident(null);
                }}
              >
                Issue Clarification Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
