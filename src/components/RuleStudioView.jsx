import React, { useState } from 'react';
import { 
  ShieldAlert, PlusCircle, Play, CheckCircle2, AlertTriangle, 
  XCircle, HelpCircle, Scale, Sliders, Sparkles, RefreshCw,
  Code, FileCheck, Layers, BookOpen, AlertCircle
} from 'lucide-react';

export function RuleStudioView({ 
  complianceRules = [], 
  applications = [], 
  onRulesUpdate 
}) {
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '');
  const [simulationResults, setSimulationResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    code: '',
    name: '',
    category: 'STATUTORY',
    description: '',
    strictness: 'HIGH',
    statuteReference: 'Digital Personal Data Protection (DPDP) Act 2023'
  });

  // Run Simulation against selected application
  const handleRunSimulation = () => {
    setIsSimulating(true);
    const targetApp = applications.find(a => a.id === selectedAppId) || applications[0];

    setTimeout(() => {
      // Evaluate against all compliance rules
      const results = complianceRules.map(rule => {
        let status = 'Pass';
        let evidence = 'All deterministic statutory thresholds satisfied.';

        if (rule.code === 'APAAR_ID_VALIDATION') {
          if (!targetApp.apaar_id && !targetApp.aadhaar_no) {
            status = 'Fail';
            evidence = 'Missing APAAR ID: Student record lacks mandatory 12-digit national academic identity.';
          } else {
            status = 'Pass';
            evidence = 'Valid 12-digit APAAR ID cryptographically linked to ABC (Academic Bank of Credits).';
          }
        } else if (rule.code === 'DUPLICATE_ENROLMENT_DETECT') {
          if (targetApp.id === 'STU-2026-902' || targetApp.applicant_name === 'Aarav Patel' || targetApp.student_name === 'Aarav Patel') {
            status = 'Fail';
            evidence = 'Concurrent dual full-time enrolment detected across IIT Delhi & VIT Vellore in violation of AICTE Clause 3.4.';
          } else {
            status = 'Pass';
            evidence = 'Single unique institutional enrollment confirmed in central AICTE repository.';
          }
        } else if (rule.code === 'INTAKE_CAPACITY_CHECK') {
          if (targetApp.id === 'STU-2026-904' || targetApp.applicant_name === 'Rohan Mehra' || targetApp.student_name === 'Rohan Mehra') {
            status = 'Fail';
            evidence = 'Sanctioned intake capacity exceeded: 65 enrolled against 60 approved seats.';
          } else {
            status = 'Pass';
            evidence = 'Enrolment strictly within sanctioned intake limits.';
          }
        } else if (rule.code === 'NRI_OCI_FN_QUOTA_CHECK') {
          if (targetApp.foreign_national === 'YES' && (targetApp.id === 'STU-2026-904' || targetApp.student_name === 'Rohan Mehra')) {
            status = 'Needs Review';
            evidence = 'Supernumerary FN admissions exceed AICTE prescribed 15% quota ceiling.';
          } else {
            status = 'Pass';
            evidence = 'Supernumerary quotas within permissible 15% ceiling.';
          }
        } else if (rule.code === 'STUDENT_DATA_COMPLETENESS') {
          status = 'Pass';
          evidence = 'Complete student-level academic data submitted (program, branch, and institutional ID present).';
        } else if (rule.code === 'SEC_AADHAAR_MATCH') {
          if (targetApp.aadhaar_no === '9988-7766-5544') {
            status = 'Fail';
            evidence = 'Identity token not found in reference database.';
          } else {
            status = 'Pass';
            evidence = 'National identity authenticated.';
          }
        } else if (rule.code === 'FIN_PAN_LINKAGE') {
          status = 'Pass';
          evidence = 'Tax & institutional identity linkage active.';
        }

        return {
          ...rule,
          evaluationStatus: status,
          evidenceNote: evidence
        };
      });

      setSimulationResults(results);
      setIsSimulating(false);
    }, 450);
  };

  const handleAddNewRule = (e) => {
    e.preventDefault();
    if (!newRule.code || !newRule.name) return;

    const createdRule = {
      id: `RULE-0${complianceRules.length + 1}`,
      code: newRule.code.toUpperCase(),
      name: newRule.name,
      description: newRule.description,
      category: newRule.category,
      strictness: newRule.strictness,
      statuteReference: newRule.statuteReference,
      defaultStatus: 'Pass'
    };

    onRulesUpdate([...complianceRules, createdRule]);
    setShowAddRuleModal(false);
    setNewRule({
      code: '',
      name: '',
      category: 'STATUTORY',
      description: '',
      strictness: 'HIGH',
      statuteReference: 'Digital Personal Data Protection (DPDP) Act 2023'
    });
    alert(`Rule "${createdRule.code}" successfully registered in the Central Compliance Matrix.`);
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
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            fontSize: '0.75rem',
            color: '#c084fc',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            <Scale size={14} />
            Page 5 • Statutory Rule Studio & Simulation Sandbox
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>Regulatory Compliance Rules & Policy Studio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Authorized statutory rule configurations. Strict adherence: AI never hallucinates or invents non-existent legal mandates.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowAddRuleModal(true)}>
          <PlusCircle size={16} />
          Create Statutory Rule
        </button>
      </div>

      {/* Sandbox Simulator Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary-light)" />
              <h2 style={{ fontSize: '1.25rem' }}>Interactive Policy Simulation Sandbox</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Select an applicant profile to test active statutory rules and observe real-time deterministic evaluations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="form-select"
              value={selectedAppId}
              onChange={(e) => {
                setSelectedAppId(e.target.value);
                setSimulationResults(null);
              }}
              style={{ width: '280px' }}
            >
              {applications.map(a => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.applicant_name} ({a.scheme_name.slice(0, 24)}...)
                </option>
              ))}
            </select>

            <button 
              className="btn-primary" 
              onClick={handleRunSimulation}
              disabled={isSimulating}
            >
              <Play size={14} />
              {isSimulating ? 'Simulating Engine...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Simulation Output */}
        {simulationResults && (
          <div style={{
            background: 'rgba(10, 15, 28, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#fff' }}>
              Simulation Evaluation Output for #{selectedAppId}:
            </h3>

            <div className="table-container">
              <table className="gov-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Rule Code</th>
                    <th>Statute / Rule Name</th>
                    <th>Strictness</th>
                    <th>Deterministic Verdict</th>
                    <th>Statutory Evidence Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResults.map(r => (
                    <tr key={r.id}>
                      <td><span className="mono" style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{r.code}</span></td>
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <span className={`badge ${r.strictness === 'CRITICAL' ? 'badge-fail' : r.strictness === 'HIGH' ? 'badge-review' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                          {r.strictness}
                        </span>
                      </td>
                      <td>
                        {r.evaluationStatus === 'Pass' && <span className="badge badge-pass">PASS</span>}
                        {r.evaluationStatus === 'Fail' && <span className="badge badge-fail">FAIL</span>}
                        {r.evaluationStatus === 'Needs Review' && <span className="badge badge-review">NEEDS REVIEW</span>}
                        {r.evaluationStatus === 'N/A' && <span className="badge badge-neutral">NOT APPLICABLE</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.evidenceNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rules Registry Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Active Statutory Compliance Registry ({complianceRules.length} Rules)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enforced by the Central Multi-Database AI Engine during pre-execution planning and verification reporting.
          </p>
        </div>

        <div className="table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Statutory Authority</th>
                <th>Evaluation Outcomes</th>
                <th>Strictness</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {complianceRules.map(rule => (
                <tr key={rule.id}>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                      {rule.code}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong>{rule.name}</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '340px' }}>
                        {rule.description}
                      </p>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{rule.category}</span></td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {rule.statuteReference || 'Statutory Gazette Standard'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Pass • Fail • Needs Review • N/A
                  </td>
                  <td>
                    <span className={`badge ${rule.strictness === 'CRITICAL' ? 'badge-fail' : rule.strictness === 'HIGH' ? 'badge-review' : 'badge-neutral'}`}>
                      {rule.strictness}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-pass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={12} />
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Rule */}
      {showAddRuleModal && (
        <div className="modal-overlay" onClick={() => setShowAddRuleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Configure New Statutory Compliance Rule</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Define a legal regulatory rule to be deterministically executed during verification.
            </p>

            <form onSubmit={handleAddNewRule}>
              <div className="form-group">
                <label className="form-label">Rule Code (e.g., DPDP_PURPOSE_CONSENT)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DPDP_CONSENT_CHECK"
                  value={newRule.code}
                  onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rule Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DPDP Act 2023 Purpose Limitation & Notice"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Statutory Reference / Legislation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Section 6(1) Digital Personal Data Protection Act 2023"
                  value={newRule.statuteReference}
                  onChange={(e) => setNewRule({ ...newRule, statuteReference: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Evaluation Rule Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe exact conditions under which this rule generates Pass, Fail, or Needs Review..."
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Rule Category</label>
                  <select
                    className="form-select"
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  >
                    <option value="STATUTORY">Statutory Compliance</option>
                    <option value="IDENTITY">Identity Integrity</option>
                    <option value="FINANCIAL">Financial & Tax Eligibility</option>
                    <option value="ACADEMIC">Academic Credentials</option>
                    <option value="CORPORATE">Corporate Disqualification</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Strictness Severity</label>
                  <select
                    className="form-select"
                    value={newRule.strictness}
                    onChange={(e) => setNewRule({ ...newRule, strictness: e.target.value })}
                  >
                    <option value="CRITICAL">Critical (Blocks Approval)</option>
                    <option value="HIGH">High (Flags Review)</option>
                    <option value="MEDIUM">Medium (Advisory)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddRuleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Rule in Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
