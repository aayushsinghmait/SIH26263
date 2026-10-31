import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Global Socket.io instance
export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000
});

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errBody.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[GovVerify API] Request failed for ${endpoint}:`, err.message);
    throw err;
  }
}

// Check Backend Health
export async function checkBackendHealth() {
  try {
    return await request('/health');
  } catch (err) {
    return { status: 'OFFLINE', error: err.message };
  }
}

// Applications API
export async function getApplications(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await request(`/applications${query ? `?${query}` : ''}`);
}

export async function getApplicationById(id) {
  return await request(`/applications/${id}`);
}

export async function submitApplication(data, autoVerify = false) {
  return await request(`/applications?autoVerify=${autoVerify}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function uploadApplicationsExcel(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/applications/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Excel upload failed');
  }

  return await res.json();
}

export async function triggerVerifyApplication(id) {
  return await request(`/applications/${id}/verify`, {
    method: 'POST'
  });
}

export async function triggerVerifyAllApplications() {
  return await request(`/applications/verify-all`, {
    method: 'POST'
  });
}

export async function commitDecision(id, decisionData) {
  return await request(`/applications/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify(decisionData)
  });
}

// Ministries API
export async function getMinistries() {
  return await request('/ministries');
}

export async function createMinistry(data) {
  return await request('/ministries', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Datasets API
export async function getDatasets(ministryCode) {
  return await request(`/datasets${ministryCode ? `?ministryCode=${ministryCode}` : ''}`);
}

export async function saveDataset(data) {
  return await request('/datasets', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Rules API
export async function getRules() {
  return await request('/rules');
}

export async function createRule(data) {
  return await request('/rules', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Audit Logs API
export async function getAuditLogs() {
  return await request('/audit');
}

export async function logAudit(data) {
  return await request('/audit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Telemetry API
export async function getTelemetry() {
  return await request('/audit/telemetry');
}

// Reset Platform State
export async function resetPlatformState() {
  return await request('/reset', {
    method: 'POST'
  });
}
