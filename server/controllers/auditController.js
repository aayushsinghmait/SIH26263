import { memoryStore, saveStoreToDisk } from '../config/db.js';
import { broadcastLiveEvent } from './applicationController.js';

export async function getAuditLogs(req, res) {
  try {
    res.json({ success: true, count: memoryStore.auditLogs.length, data: memoryStore.auditLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAuditLog(req, res) {
  try {
    const { actor, portal, action, details, severity } = req.body;

    const newLog = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: actor || 'Authorized Officer',
      portal: portal || 'Central Gateway',
      action: action || 'GENERIC_AUDIT',
      details: details || '',
      severity: severity || 'INFO'
    };

    memoryStore.auditLogs.unshift(newLog);
    saveStoreToDisk();

    broadcastLiveEvent(req, 'audit:new', newLog);

    res.status(201).json({ success: true, data: newLog });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getTelemetry(req, res) {
  try {
    res.json({
      success: true,
      data: {
        ...memoryStore.telemetry,
        totalApplications: memoryStore.applications.length,
        verifiedCount: memoryStore.applications.filter(a => a.status === 'VERIFIED' || a.status === 'APPROVED').length,
        flaggedCount: memoryStore.applications.filter(a => a.status === 'FLAGGED' || a.status === 'REJECTED').length,
        reviewCount: memoryStore.applications.filter(a => a.status === 'NEEDS_REVIEW').length,
        pendingCount: memoryStore.applications.filter(a => a.status === 'PENDING_AI_CHECK').length,
        ministriesCount: memoryStore.ministries.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
