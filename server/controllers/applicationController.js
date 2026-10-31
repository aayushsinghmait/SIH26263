import xlsx from 'xlsx';
import { memoryStore, saveStoreToDisk } from '../config/db.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import { 
  generateVerificationPlan, 
  executeDynamicVerification 
} from '../utils/aiVerificationEngine.js';

// Helper to broadcast live socket events
export function broadcastLiveEvent(req, eventName, payload) {
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit(eventName, payload);
    }
  } catch (err) {
    console.warn(`Socket broadcast warning for ${eventName}:`, err.message);
  }
}

// 1. GET ALL APPLICATIONS
export async function getApplications(req, res) {
  try {
    const { status, search, ministry } = req.query;

    let apps = [...memoryStore.applications];

    if (status && status !== 'ALL') {
      apps = apps.filter(a => a.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a => 
        (a.applicant_name && a.applicant_name.toLowerCase().includes(q)) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.aadhaar_no && a.aadhaar_no.includes(q)) ||
        (a.pan_no && a.pan_no.toLowerCase().includes(q)) ||
        (a.scheme_name && a.scheme_name.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: apps.length,
      data: apps
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 2. GET SINGLE APPLICATION BY ID
export async function getApplicationById(req, res) {
  try {
    const { id } = req.params;
    const app = memoryStore.applications.find(a => a.id === id);

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Generate dynamic plan and evidence on demand
    const plan = generateVerificationPlan(app, memoryStore.datasets, memoryStore.rules);
    const dynamicResult = executeDynamicVerification(app, plan, memoryStore.datasets);

    res.json({
      success: true,
      data: {
        ...app,
        dynamicPlan: plan,
        dynamicResult
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 3. CREATE APPLICATION(S) / LIVE REQUEST INGESTION
export async function createApplication(req, res) {
  try {
    const incomingData = req.body;
    const items = Array.isArray(incomingData) ? incomingData : [incomingData];

    const createdApps = [];

    for (const raw of items) {
      const appId = raw.id || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const appName = raw.applicant_name || raw.Applicant_Name || raw.full_name || raw.name || 'Applicant Citizen';
      
      const newApp = {
        ...raw,
        id: appId,
        applicant_name: appName,
        scheme_name: raw.scheme_name || raw.Scheme_Name || 'National Public Welfare Scheme',
        dob: raw.dob || raw.DOB || '',
        gender: raw.gender || raw.Gender || '',
        father_name: raw.father_name || raw.Father_Name || '',
        aadhaar_no: raw.aadhaar_no || raw.Aadhaar_No || '',
        pan_no: raw.pan_no || raw.PAN_No || '',
        education_roll: raw.education_roll || raw.Roll_No || raw.roll_no || '',
        claimed_income: raw.claimed_income || raw.Income || raw.income || '',
        state: raw.state || raw.State || 'India',
        pin_code: raw.pin_code || raw.Pin_Code || '',
        status: raw.status || 'PENDING_AI_CHECK',
        ai_verdict: raw.ai_verdict || 'PENDING',
        confidence_score: raw.confidence_score || 0,
        submitted_at: raw.submitted_at || new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      // Check if auto-verification requested or run immediately
      if (req.query.autoVerify === 'true') {
        const plan = generateVerificationPlan(newApp, memoryStore.datasets, memoryStore.rules);
        const dynamicResult = executeDynamicVerification(newApp, plan, memoryStore.datasets);

        newApp.status = dynamicResult.overallVerdict === 'PASSED' 
          ? 'VERIFIED' 
          : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' 
            ? 'FLAGGED' 
            : 'NEEDS_REVIEW';
        newApp.ai_verdict = dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW';
        newApp.confidence_score = dynamicResult.confidenceScore;
        newApp.verification_report = dynamicResult;
      }

      // Prepend to store
      memoryStore.applications.unshift(newApp);
      createdApps.push(newApp);

      // Audit Log
      const auditEntry = {
        id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actor: req.body.submittedBy || 'Citizen / Ministry Gateway',
        portal: req.body.sourcePortal || 'Public Request Portal',
        action: 'LIVE_APPLICATION_INGESTED',
        details: `Application #${newApp.id} for "${newApp.applicant_name}" ingested live into Central Queue. Status: ${newApp.status}.`,
        severity: newApp.status === 'FLAGGED' ? 'DANGER' : 'INFO'
      };
      memoryStore.auditLogs.unshift(auditEntry);

      // Update telemetry
      memoryStore.telemetry.totalQueries += 1;

      // Broadcast single live event over Socket.io
      broadcastLiveEvent(req, 'application:new', newApp);
      broadcastLiveEvent(req, 'audit:new', auditEntry);
      broadcastLiveEvent(req, 'telemetry:event', {
        type: 'APPLICATION_INGESTED',
        appId: newApp.id,
        applicant: newApp.applicant_name,
        timestamp: new Date().toISOString(),
        totalQueries: memoryStore.telemetry.totalQueries
      });
    }

    saveStoreToDisk();

    res.status(201).json({
      success: true,
      count: createdApps.length,
      data: createdApps.length === 1 ? createdApps[0] : createdApps,
      message: `Successfully processed and broadcasted ${createdApps.length} application(s) live!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 4. UPLOAD APPLICATIONS EXCEL BATCH
export async function uploadApplicationsExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No Excel file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel file is empty' });
    }

    const createdApps = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const appId = r.Application_ID || r.application_id || r.id || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const appName = r.Applicant_Name || r.applicant_name || r.full_name || r.Name || r.name || `Applicant ${i + 1}`;

      const newApp = {
        ...r,
        id: appId,
        applicant_name: appName,
        scheme_name: r.scheme_name || r.Scheme_Name || 'National Development Grant Scheme',
        dob: r.dob || r.Date_of_Birth || r.DOB || '',
        gender: r.gender || r.Gender || '',
        father_name: r.father_name || r.Father_Name || '',
        aadhaar_no: r.aadhaar_no || r.Aadhaar_No || '',
        pan_no: r.pan_no || r.PAN_No || '',
        education_roll: r.education_roll || r.Roll_No || '',
        claimed_income: r.claimed_income || r.Claimed_Income || '',
        state: r.state || r.State || '',
        pin_code: r.pin_code || r.Pin_Code || '',
        status: 'PENDING_AI_CHECK',
        ai_verdict: 'PENDING',
        confidence_score: 0,
        submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      memoryStore.applications.unshift(newApp);
      createdApps.push(newApp);
    }

    const auditEntry = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Admin / Ministry Upload',
      portal: 'Central Ingestion Service',
      action: 'BATCH_EXCEL_INGESTED',
      details: `Batch of ${createdApps.length} applications ingested from "${req.file.originalname}".`,
      severity: 'SUCCESS'
    };
    memoryStore.auditLogs.unshift(auditEntry);

    // Broadcast batch event
    broadcastLiveEvent(req, 'application:batch', createdApps);
    broadcastLiveEvent(req, 'audit:new', auditEntry);

    saveStoreToDisk();

    res.status(201).json({
      success: true,
      count: createdApps.length,
      data: createdApps,
      message: `Batch of ${createdApps.length} applications loaded successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 5. TRIGGER AI VERIFICATION FOR SINGLE APPLICATION
export async function verifyApplication(req, res) {
  try {
    const { id } = req.params;
    const index = memoryStore.applications.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const app = memoryStore.applications[index];
    const plan = generateVerificationPlan(app, memoryStore.datasets, memoryStore.rules);
    const dynamicResult = executeDynamicVerification(app, plan, memoryStore.datasets);

    let status = 'VERIFIED';
    if (dynamicResult.overallVerdict === 'MISMATCH_DETECTED') status = 'FLAGGED';
    else if (dynamicResult.overallVerdict === 'MANUAL_REVIEW_REQUIRED') status = 'NEEDS_REVIEW';

    const updatedApp = {
      ...app,
      status,
      ai_verdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
      confidence_score: dynamicResult.confidenceScore,
      verification_report: dynamicResult
    };

    memoryStore.applications[index] = updatedApp;

    const auditEntry = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Central AI Engine v3.0',
      portal: 'Automated AI Engine',
      action: 'APPLICATION_VERIFIED',
      details: `Verified Application #${app.id} (${app.applicant_name}). Verdict: ${updatedApp.ai_verdict} (${updatedApp.confidence_score}% match).`,
      severity: updatedApp.status === 'FLAGGED' ? 'DANGER' : 'SUCCESS'
    };
    memoryStore.auditLogs.unshift(auditEntry);

    broadcastLiveEvent(req, 'application:updated', updatedApp);
    broadcastLiveEvent(req, 'audit:new', auditEntry);

    saveStoreToDisk();

    res.json({
      success: true,
      data: updatedApp,
      plan,
      result: dynamicResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 6. TRIGGER BATCH AI VERIFICATION
export async function verifyAllApplications(req, res) {
  try {
    const updated = memoryStore.applications.map(app => {
      const plan = generateVerificationPlan(app, memoryStore.datasets, memoryStore.rules);
      const dynamicResult = executeDynamicVerification(app, plan, memoryStore.datasets);

      let status = 'VERIFIED';
      if (dynamicResult.overallVerdict === 'MISMATCH_DETECTED') status = 'FLAGGED';
      else if (dynamicResult.overallVerdict === 'MANUAL_REVIEW_REQUIRED') status = 'NEEDS_REVIEW';

      return {
        ...app,
        status,
        ai_verdict: dynamicResult.overallVerdict === 'PASSED' ? 'PASS' : dynamicResult.overallVerdict === 'MISMATCH_DETECTED' ? 'FAIL' : 'NEEDS_REVIEW',
        confidence_score: dynamicResult.confidenceScore,
        verification_report: dynamicResult
      };
    });

    memoryStore.applications = updated;

    const auditEntry = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Central AI Engine v3.0',
      portal: 'Automated AI Engine',
      action: 'BATCH_VERIFICATION_COMPLETE',
      details: `Discovered and verified all ${updated.length} applications across Central Dataset Registry.`,
      severity: 'SUCCESS'
    };
    memoryStore.auditLogs.unshift(auditEntry);

    broadcastLiveEvent(req, 'application:batch_updated', updated);
    broadcastLiveEvent(req, 'audit:new', auditEntry);

    saveStoreToDisk();

    res.json({
      success: true,
      count: updated.length,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 7. COMMIT REVIEWER DECISION
export async function commitDecision(req, res) {
  try {
    const { id } = req.params;
    const { decision, reviewer, notes } = req.body; // 'APPROVE', 'REJECT', 'ESCALATE'

    const index = memoryStore.applications.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const app = memoryStore.applications[index];

    let newStatus = 'VERIFIED';
    if (decision === 'APPROVE') newStatus = 'APPROVED';
    else if (decision === 'REJECT') newStatus = 'REJECTED';
    else if (decision === 'ESCALATE') newStatus = 'FLAGGED';

    const updatedApp = {
      ...app,
      status: newStatus,
      reviewer_decision: {
        decision,
        reviewer: reviewer || 'Authorized Reviewer',
        notes: notes || '',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
      }
    };

    memoryStore.applications[index] = updatedApp;

    const auditEntry = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: reviewer || 'Authorized Reviewer',
      portal: 'Admin Review Portal',
      action: `DECISION_${decision}`,
      details: `Reviewer finalized decision "${decision}" for Application #${app.id}. Note: ${notes || 'None'}`,
      severity: decision === 'APPROVE' ? 'SUCCESS' : decision === 'REJECT' ? 'DANGER' : 'WARNING'
    };
    memoryStore.auditLogs.unshift(auditEntry);

    broadcastLiveEvent(req, 'application:updated', updatedApp);
    broadcastLiveEvent(req, 'audit:new', auditEntry);

    saveStoreToDisk();

    res.json({
      success: true,
      data: updatedApp
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 8. DELETE APPLICATION
export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;
    const index = memoryStore.applications.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const deleted = memoryStore.applications.splice(index, 1)[0];
    saveStoreToDisk();

    broadcastLiveEvent(req, 'application:deleted', { id });

    res.json({ success: true, message: `Application ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
