import React, { useState } from 'react';
import { 
  FileCheck2, Download, FileSpreadsheet, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, ArrowLeft, Building2, UserCheck, Scale, History,
  FileText, Check, X, HelpCircle, GraduationCap
} from 'lucide-react';
import { generateVerificationPDF, exportToExcel } from '../utils/excelHelper';
import { maskAadhaar, maskPAN, maskAPAAR } from '../utils/aiEngine';

export function VerificationReportView({ report, application, onBack, onDecisionSubmit }) {
  const [reviewerDecision, setReviewerDecision] = useState(
    report.reviewerRecommendation?.action || 'APPROVE'
  );
  const [reviewerNotes, setReviewerNotes] = useState(
    'Student academic credentials and APAAR ID verified against AICTE central repository and institutional intake.'
  );
  const [decisionSaved, setDecisionSaved] = useState(false);

  const handleDownloadPDF = () => {
    generateVerificationPDF(report, application);
  };

  const handleExportExcel = () => {
    const exportRows = (report.fieldComparisons || []).map(f => ({
      Application_ID: report.applicationId,
      Applicant_Name: report.applicantName,
      Field: f.field,
      Source_Ministry: f.sourceMinistry,
      Submitted_Value: f.submittedValue,
      Verified_Registry_Value: f.verifiedValue,
      Match_Status: f.matchStatus,
      Confidence_Percent: f.confidence,
      Notes: f.notes
    }));
    exportToExcel(exportRows, `Report_${report.applicationId}_FieldAnalysis.xlsx`, 'FieldComparison');
  };

  const handleSaveDecision = () => {
    setDecisionSaved(true);
    if (onDecisionSubmit) {
      onDecisionSubmit({
        applicationId: report.applicationId,
        decision: reviewerDecision,
        notes: reviewerNotes,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Student Queue
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} color="#34d399" />
            Export Tables (Excel)
          </button>
          <button className="btn-primary" onClick={handleDownloadPDF}>
            <Download size={16} />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--border-glow)' }}>
        {/* Report Official Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'var(--gov-ice)',
              border: '1px solid var(--gov-navy)',
              fontSize: '0.75rem',
              color: 'var(--gov-navy)',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.75rem'
            }}>
              <GraduationCap size={14} />
              AICTE Consolidated Student Verification Report
            </div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--gov-navy)' }}>
              Student Record #{report.applicationId}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Program: <strong style={{ color: 'var(--gov-navy)' }}>{application?.course || application?.scheme_name || 'B.Tech Program'}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Audit Trace Reference: <span className="mono">{report.verifiedAt}</span>
            </p>
          </div>

          {/* Verdict Box */}
          <div style={{
            background: 'var(--gov-white)',
            border: '2px solid var(--gov-navy)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 2rem',
            textAlign: 'center',
            minWidth: '220px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gov-navy)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
              Consolidated Verdict
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.35rem',
              color: (report.overallVerdict === 'PASS' || report.overallVerdict === 'PASSED') ? 'var(--gov-teal)' : (report.overallVerdict === 'FAIL' || report.overallVerdict === 'MISMATCH_DETECTED') ? 'var(--gov-crimson)' : 'var(--gov-amber)'
            }}>
              {(report.overallVerdict === 'PASS' || report.overallVerdict === 'PASSED') && 'FAIL / NOT FOUND' !== report.overallVerdict && (report.confidenceScore >= 80 ? 'PASS' : 'FAIL')}
              {(report.overallVerdict === 'FAIL' || report.overallVerdict === 'MISMATCH_DETECTED') && 'FAIL'}
              {(report.overallVerdict === 'NEEDS_REVIEW' || report.overallVerdict === 'MANUAL_REVIEW_REQUIRED') && 'NEEDS REVIEW'}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}>
              AI Confidence: <strong>{report.confidenceScore}%</strong>
            </div>
          </div>
        </div>

        {/* Section 1: Application Summary & Sources */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} color="var(--primary-light)" />
            1. Student Academic Profile & Queried Institutional Registries
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Legal Name</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>{report.applicantName}</p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                DOB: <strong style={{ color: '#fff' }}>{application?.dob || 'N/A'}</strong> • Gender: <strong style={{ color: '#fff' }}>{application?.gender || 'N/A'}</strong>
              </div>
              <div style={{ marginTop: '0.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Father's Name: <strong style={{ color: '#fff' }}>{application?.father_name || 'N/A'}</strong>
              </div>
            </div>

            <div style={{
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>National Academic Coordinates</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                APAAR ID: <span className="mono">{maskAPAAR(application?.apaar_id || application?.aadhaar_no)}</span>
              </p>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem' }}>
                Enrollment No: <span className="mono">{application?.enrollment_no || application?.pan_no}</span>
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Institution: <strong style={{ color: '#fff' }}>{application?.institution_code || application?.state || 'IITD'}</strong> • Branch: <strong style={{ color: '#fff' }}>{application?.branch || 'Engineering'}</strong>
              </div>
              <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                Intake: {application?.actual_enrolment || 118}/{application?.approved_intake || 120} • NRI: {application?.nri_category || 'NO'} • OCI: {application?.oci_status || 'NO'} • FN: {application?.foreign_national || 'NO'}
              </div>
            </div>

            <div style={{
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jurisdiction & State</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>{application?.state || 'N/A'}</p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Postal PIN Code: <span className="mono" style={{ color: '#fff' }}>{application?.pin_code || 'N/A'}</span>
              </div>
            </div>

            {/* Custom Application Fields Card (e.g. House No, Counthouse, etc.) */}
            {(() => {
              const standardKeys = ['id', 'scheme_name', 'applicant_name', 'dob', 'gender', 'father_name', 'aadhaar_no', 'pan_no', 'education_roll', 'claimed_income', 'state', 'pin_code', 'status', 'submittedAt', 'submitted_at', 'ai_verdict', 'confidence_score'];
              const customFields = Object.keys(application || {}).filter(k => !standardKeys.includes(k) && !!application[k]);
              if (customFields.length === 0) return null;
              return (
                <div style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--gov-ice)',
                  border: '1.5px solid var(--gov-navy)',
                  gridColumn: '1 / -1'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gov-navy)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Custom Application Fields & Ingested Data
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {customFields.map((f, i) => (
                      <div key={i}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.replace(/_/g, ' ')}:</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{String(application[f])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dataset Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            padding: '1rem',
            background: 'var(--gov-ice)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--gov-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} />
              AI Queried Datasets:
            </span>
            {(report.datasetsQueried || []).map((ds, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '4px',
                  background: 'var(--gov-white)',
                  border: `1.5px solid ${ds.recordMatched ? 'var(--gov-teal)' : 'var(--gov-crimson)'}`,
                  color: ds.recordMatched ? 'var(--gov-teal)' : 'var(--gov-crimson)',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {ds.recordMatched ? <CheckCircle2 size={14} color="var(--gov-teal)" /> : <XCircle size={14} color="var(--gov-crimson)" />}
                <strong>{ds.ministry}</strong>: {ds.datasetName}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Feature 5 Dynamic Multi-Database Evidence & Audit Ledger */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} color="var(--primary-light)" />
              2. Cross-Ministry Multi-Entity Field Reconciliation & Evidence Trail
            </h2>
            <span className="badge badge-info">Feature 5 Evidence Standard • Source Attribution</span>
          </div>

          <div className="table-container" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Field & Type</th>
                  <th>Source Dataset & Adapter</th>
                  <th>Submitted Form Value</th>
                  <th>Verified Registry Value</th>
                  <th>Status & Confidence</th>
                  <th>Source Freshness</th>
                  <th>Reviewer Next Action</th>
                </tr>
              </thead>
              <tbody>
                {report.evidenceLogs && report.evidenceLogs.length > 0 ? (
                  report.evidenceLogs.map((ev, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{ev.field}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {ev.verificationType}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{ev.owningMinistry}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {ev.sourceDatasetName}
                        </div>
                        <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {ev.adapterType}
                        </div>
                      </td>
                      <td><span className="mono">{String(ev.submittedValue || '—')}</span></td>
                      <td><span className="mono">{String(ev.referenceValue || '—')}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {ev.status === 'PASSED' && <span className="badge badge-pass">PASSED</span>}
                          {ev.status === 'MISMATCH_DETECTED' && <span className="badge badge-fail">MISMATCH</span>}
                          {ev.status === 'MANUAL_REVIEW_REQUIRED' && <span className="badge badge-review">NEEDS REVIEW</span>}
                          {ev.status === 'NO_MATCHING_RECORD' && <span className="badge badge-warning">NO RECORD</span>}
                          {ev.status === 'INGESTED' && <span className="badge badge-neutral">FORM METADATA</span>}
                          {ev.status === 'SOURCE_UNAVAILABLE' && <span className="badge badge-neutral">UNAVAILABLE</span>}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Confidence: <strong>{ev.matchConfidence !== null && ev.matchConfidence !== undefined ? `${ev.matchConfidence}%` : 'N/A'}</strong>
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {ev.sourceFreshness || 'Verified Real-time'}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          {ev.requiredReviewerAction || 'CLEAR'}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: '200px', marginTop: '0.2rem' }}>
                          {ev.explanation}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (report.fieldComparisons || []).map((field, idx) => (
                    <tr key={idx}>
                      <td><strong>{field.field}</strong></td>
                      <td><span className="badge badge-neutral">{field.sourceMinistry}</span></td>
                      <td><span className="mono">{field.submittedValue || '—'}</span></td>
                      <td><span className="mono">{field.verifiedValue || '—'}</span></td>
                      <td>
                        {field.matchStatus === 'EXACT_MATCH' && <span className="badge badge-pass">Exact Match</span>}
                        {field.matchStatus === 'FUZZY_MATCH' && <span className="badge badge-review">Fuzzy Match</span>}
                        {field.matchStatus === 'MISMATCH' && <span className="badge badge-fail">Mismatch</span>}
                        {field.matchStatus === 'NOT_FOUND' && <span className="badge badge-fail">Not Found</span>}
                      </td>
                      <td>Verified Real-time</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {field.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Regulatory Compliance Checklist */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary-light)" />
            3. Regulatory Compliance Rules Evaluation
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(report.complianceRules || []).map((rule, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rule.code}</span>
                    <strong style={{ fontSize: '0.95rem' }}>{rule.name}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Evidence: {rule.evidence}
                  </p>
                </div>

                <div>
                  {rule.status === 'Pass' && <span className="badge badge-pass"><Check size={14} /> Pass</span>}
                  {rule.status === 'Fail' && <span className="badge badge-fail"><X size={14} /> Fail</span>}
                  {rule.status === 'Needs Review' && <span className="badge badge-review"><AlertTriangle size={14} /> Needs Review</span>}
                  {rule.status === 'Not Applicable' && <span className="badge badge-neutral"><HelpCircle size={14} /> Not Applicable</span>}
                  {rule.status === 'Unable to Verify' && <span className="badge badge-warning"><AlertTriangle size={14} /> Unable to Verify</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Anomalies and Tampering Indicators */}
        {report.anomalies && report.anomalies.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <ShieldAlert size={18} color="#f87171" />
              4. Inconsistencies & Possible Tampering Indicators Flagged
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {report.anomalies.map((ano, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong style={{ color: '#fca5a5', fontSize: '0.95rem' }}>{ano.title}</strong>
                    <span className="badge badge-fail">{ano.severity} SEVERITY</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#fecaca', marginBottom: '0.5rem' }}>
                    {ano.description}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Recommended Next Action: <strong style={{ color: '#fff' }}>{ano.suggestedAction}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Authorized Human Reviewer Final Decision */}
        <div style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-glow)'
        }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} color="var(--primary-light)" />
            5. Final Authorized Reviewer Decision & Sign-off
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label">Reviewer Official Decision</label>
              <select
                className="form-select"
                value={reviewerDecision}
                onChange={(e) => setReviewerDecision(e.target.value)}
              >
                <option value="APPROVE">🟢 APPROVE APPLICATION (Clear for grant/license)</option>
                <option value="REJECT">🔴 REJECT APPLICATION (Severe mismatch/fraud)</option>
                <option value="ESCALATE_TO_SENIOR_REVIEWER">🟡 ESCALATE TO SENIOR NODAL OFFICER</option>
                <option value="REQUEST_CLARIFICATION">🔵 REQUEST CLARIFICATION FROM APPLICANT</option>
              </select>
            </div>

            <div>
              <label className="form-label">Reviewer Compliance Remarks</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Enter mandatory reviewer justification..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {decisionSaved ? (
                <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                  <CheckCircle2 size={14} /> Decision recorded and synced to Page 17 Audit Ledger.
                </span>
              ) : (
                'Reviewer decision will be permanently archived in the immutable audit history.'
              )}
            </div>

            <button className="btn-primary" onClick={handleSaveDecision}>
              <CheckCircle2 size={16} />
              Commit Reviewer Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
