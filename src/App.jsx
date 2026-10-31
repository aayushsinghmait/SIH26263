import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Building2, UserCheck, LogOut, ArrowRightLeft, 
  Sparkles, CheckCircle2, AlertTriangle, Layers, Send, Bell, 
  Activity, Radio, Globe, Wifi, WifiOff, GraduationCap
} from 'lucide-react';
import { 
  INITIAL_MINISTRIES, 
  INITIAL_MINISTRY_DATABASES, 
  INITIAL_NAMED_DATASETS,
  INITIAL_APPLICATIONS, 
  INITIAL_COMPLIANCE_RULES, 
  INITIAL_AUDIT_LOGS,
  INITIAL_DATASET_REGISTRY
} from './data/mockData';
import { 
  socket, 
  getApplications, 
  getMinistries, 
  getDatasets, 
  getRules, 
  getAuditLogs, 
  logAudit as apiLogAudit,
  submitApplication,
  commitDecision
} from './services/api';
import { LoginPortal } from './components/LoginPortal';
import { AdminPortal } from './components/AdminPortal';
import { MinistryPortal } from './components/MinistryPortal';
import { CitizenRequestPortal } from './components/CitizenRequestPortal';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null); // null when logged out, or { role, username, name, badge, ministryCode, subRole }
  const [currentView, setCurrentView] = useState('MAIN'); // 'MAIN' or 'CITIZEN'

  // Global Shared State across Portals
  const [ministries, setMinistries] = useState(INITIAL_MINISTRIES);
  const [databases, setDatabases] = useState(INITIAL_MINISTRY_DATABASES);
  const [namedDatasets, setNamedDatasets] = useState(INITIAL_NAMED_DATASETS);
  const [datasetRegistry, setDatasetRegistry] = useState(INITIAL_DATASET_REGISTRY);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [complianceRules, setComplianceRules] = useState(INITIAL_COMPLIANCE_RULES);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // MERN Live Socket Connection & Notification State
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [liveNotification, setLiveNotification] = useState(null);
  const [newLiveAppCount, setNewLiveAppCount] = useState(0);

  // Background Theme: 'INDIA' (uses /assets/gov-bg-india.png) or 'AICTE' (uses /assets/gov-bg-aicte.png)
  const [activeBgTheme, setActiveBgTheme] = useState('INDIA');

  // 1. Initial Load from Express MERN Backend
  useEffect(() => {
    async function loadBackendData() {
      try {
        const appsRes = await getApplications();
        if (appsRes?.data?.length > 0) setApplications(appsRes.data);

        const minRes = await getMinistries();
        if (minRes?.data?.length > 0) setMinistries(minRes.data);

        const dsRes = await getDatasets();
        if (dsRes?.data?.length > 0) setDatasetRegistry(dsRes.data);

        const rulesRes = await getRules();
        if (rulesRes?.data?.length > 0) setComplianceRules(rulesRes.data);

        const auditRes = await getAuditLogs();
        if (auditRes?.data?.length > 0) setAuditLogs(auditRes.data);
      } catch (err) {
        console.warn('Backend loading warning (using resilient local defaults):', err.message);
      }
    }
    loadBackendData();
  }, []);

  // 2. Real-Time Socket.IO Synchronization (Live Ingestion)
  useEffect(() => {
    function onConnect() {
      console.log('⚡ Socket connected to APAAR MERN backend');
      setIsSocketConnected(true);
    }

    function onDisconnect() {
      console.log('🔌 Socket disconnected');
      setIsSocketConnected(false);
    }

    // When ANY user, institution, or stakeholder sends a student record!
    function onApplicationNew(newApp) {
      console.log('🔔 Live student record received via socket:', newApp);
      setApplications(prev => {
        const exists = prev.some(a => a.id === newApp.id);
        if (exists) return prev;
        return [newApp, ...prev];
      });

      setNewLiveAppCount(c => c + 1);

      // Trigger high-visibility animated notification
      setLiveNotification({
        id: newApp.id,
        applicant: newApp.applicant_name,
        scheme: newApp.scheme_name,
        status: newApp.status,
        timestamp: new Date().toLocaleTimeString(),
        type: 'NEW_RECORD'
      });

      // Auto dismiss notification after 8 seconds
      setTimeout(() => {
        setLiveNotification(prev => (prev?.id === newApp.id ? null : prev));
      }, 8000);
    }

    function onApplicationBatch(batch) {
      setApplications(prev => {
        const newIds = new Set(batch.map(b => b.id));
        const filtered = prev.filter(p => !newIds.has(p.id));
        return [...batch, ...filtered];
      });
      setLiveNotification({
        id: `BATCH (${batch.length})`,
        applicant: `${batch.length} Student Records Uploaded`,
        scheme: 'Batch Enrollment Ingestion',
        status: 'PENDING_VERIFICATION',
        timestamp: new Date().toLocaleTimeString(),
        type: 'BATCH_INGEST'
      });
    }

    function onApplicationUpdated(updatedApp) {
      setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
    }

    function onApplicationBatchUpdated(allUpdated) {
      setApplications(allUpdated);
    }

    function onApplicationDeleted({ id }) {
      setApplications(prev => prev.filter(a => a.id !== id));
    }

    function onAuditNew(newLog) {
      setAuditLogs(prev => [newLog, ...prev]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('application:new', onApplicationNew);
    socket.on('application:batch', onApplicationBatch);
    socket.on('application:updated', onApplicationUpdated);
    socket.on('application:batch_updated', onApplicationBatchUpdated);
    socket.on('application:deleted', onApplicationDeleted);
    socket.on('audit:new', onAuditNew);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('application:new', onApplicationNew);
      socket.off('application:batch', onApplicationBatch);
      socket.off('application:updated', onApplicationUpdated);
      socket.off('application:batch_updated', onApplicationBatchUpdated);
      socket.off('application:deleted', onApplicationDeleted);
      socket.off('audit:new', onAuditNew);
    };
  }, []);

  // Audit Logger callback
  const logAudit = async (logEntry) => {
    const newLog = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: logEntry.actor || currentUser?.name || 'Authorized Officer',
      portal: logEntry.portal || (currentUser?.role === 'ADMIN' ? 'APAAR Team Portal' : 'Institution Portal'),
      action: logEntry.action || 'GENERIC_OP',
      details: logEntry.details || '',
      severity: logEntry.severity || 'INFO'
    };

    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await apiLogAudit(newLog);
    } catch (err) {
      // Handled locally
    }
  };

  // Handle Student Record Batch or Single Upload via API
  const handleApplicationUpload = async (newApps) => {
    try {
      await submitApplication(newApps);
    } catch (err) {
      console.warn('API upload error, applying locally:', err.message);
      setApplications(prev => [...newApps, ...prev]);
    }
  };

  // Handle Reviewer Decision Commit via API
  const handleDecisionSubmit = async ({ applicationId, decision, notes }) => {
    try {
      await commitDecision(applicationId, {
        decision,
        reviewer: currentUser?.name || 'APAAR Authorized Reviewer',
        notes
      });
    } catch (err) {
      console.warn('Decision commit API error, updating locally:', err.message);
      setApplications(prev => prev.map(a => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'FLAGGED'
          };
        }
        return a;
      }));
    }
  };

  // Named Datasets updater (allows multiple independent datasets per institution)
  const handleNamedDatasetUpdate = (ministryCode, updatedDatasets) => {
    setNamedDatasets(prev => ({
      ...prev,
      [ministryCode]: updatedDatasets
    }));

    const flatRecords = updatedDatasets.flatMap(ds => ds.records || []);

    setDatabases(prev => ({
      ...prev,
      [ministryCode]: flatRecords
    }));

    setMinistries(prev => prev.map(m => {
      if (m.code === ministryCode) {
        return {
          ...m,
          recordsCount: flatRecords.length,
          lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
      }
      return m;
    }));
  };

  // Database updater (fallback when flat array is updated directly)
  const handleDatabaseUpdate = (ministryCode, updatedRecords) => {
    setDatabases(prev => ({
      ...prev,
      [ministryCode]: updatedRecords
    }));

    setMinistries(prev => prev.map(m => {
      if (m.code === ministryCode) {
        return {
          ...m,
          recordsCount: updatedRecords.length,
          lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
      }
      return m;
    }));
  };

  // Switch between portals on the fly
  const handleSwitchPortal = () => {
    if (currentUser?.role === 'ADMIN') {
      setCurrentUser({
        role: 'MINISTRY',
        ministryCode: 'IITD',
        username: 'registrar@iitd.ac.in',
        name: 'IIT Delhi Registrar',
        badge: 'INSTITUTION_ADMIN'
      });
      logAudit({
        actor: 'IIT Delhi Registrar',
        portal: 'Institution Portal (IITD)',
        action: 'PORTAL_SWITCH',
        details: 'Navigated to IIT Delhi Institution Portal.',
        severity: 'INFO'
      });
    } else {
      setCurrentUser({
        role: 'ADMIN',
        username: 'apaar.admin@aicte.gov.in',
        name: 'Dr. R. Mehta (APAAR Team Lead)',
        badge: 'APAAR_TEAM'
      });
      logAudit({
        actor: 'APAAR Team (ADM-01)',
        portal: 'APAAR Team Portal',
        action: 'PORTAL_SWITCH',
        details: 'Navigated to APAAR Team Central Portal.',
        severity: 'INFO'
      });
    }
  };

  const handleLogout = () => {
    logAudit({
      actor: currentUser?.name || 'Officer',
      portal: currentUser?.role === 'ADMIN' ? 'APAAR Team Portal' : 'Institution Portal',
      action: 'USER_LOGOUT',
      details: `User signed out from ${currentUser?.role} portal session.`,
      severity: 'INFO'
    });
    setCurrentUser(null);
    setCurrentView('MAIN');
  };

  // 1. Student / Public Verification View
  if (currentView === 'CITIZEN') {
    return (
      <CitizenRequestPortal
        onBackToLogin={() => setCurrentView('MAIN')}
        onSwitchToAdmin={() => {
          setCurrentUser({
            role: 'ADMIN',
            username: 'apaar.admin@aicte.gov.in',
            name: 'Dr. R. Mehta (APAAR Team Lead)',
            badge: 'APAAR_TEAM'
          });
          setCurrentView('MAIN');
        }}
      />
    );
  }

  // 2. Login Portal (if not logged in)
  if (!currentUser) {
    return (
      <LoginPortal
        activeBgTheme={activeBgTheme}
        onToggleTheme={() => setActiveBgTheme(prev => prev === 'INDIA' ? 'AICTE' : 'INDIA')}
        onOpenCitizenRequest={() => setCurrentView('CITIZEN')}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          logAudit({
            actor: user.name,
            portal: user.role === 'ADMIN' ? 'APAAR Team Portal' : `Institution Portal (${user.ministryCode})`,
            action: 'USER_AUTHENTICATED',
            details: `Successful authenticated login as ${user.badge} via APAAR access gateway.`,
            severity: 'SUCCESS'
          });
        }}
      />
    );
  }

  return (
    <div className={activeBgTheme === 'AICTE' ? 'ministry-theme-bg' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* 1. National Tricolor Strip */}
      <div className="gov-tricolor-strip"></div>

      {/* 2. Official Top Government Bar */}
      <div className="gov-official-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>भारत सरकार</strong> | Government of India</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span><strong>अखिल भारतीय तकनीकी शिक्षा परिषद</strong> | AICTE</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ color: 'var(--gov-amber)' }}>APAAR Student Data Management Platform</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* MERN Stack Live Sync Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: isSocketConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${isSocketConnected ? '#10b981' : '#ef4444'}`,
            color: isSocketConnected ? '#34d399' : '#f87171',
            borderRadius: '20px',
            padding: '0.15rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isSocketConnected ? '#10b981' : '#ef4444',
              display: 'inline-block',
              boxShadow: isSocketConnected ? '0 0 8px #10b981' : 'none'
            }}></span>
            {isSocketConnected ? 'APAAR Live Sync: Active' : 'Offline / Reconnecting'}
          </div>

          {/* Student Verification Portal Trigger */}
          <button
            onClick={() => setCurrentView('CITIZEN')}
            style={{
              background: 'linear-gradient(135deg, #FF9933, #e67e22)',
              border: 'none',
              color: '#000',
              padding: '0.2rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(255,153,51,0.3)'
            }}
            title="Open Student APAAR Verification Portal"
          >
            <GraduationCap size={12} />
            Verify Student
          </button>

          <button
            onClick={() => setActiveBgTheme(prev => prev === 'INDIA' ? 'AICTE' : 'INDIA')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'var(--gov-white)',
              padding: '0.15rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Toggle between AICTE and Government of India Official Backdrops"
          >
            🏛️ Theme: <strong>{activeBgTheme === 'INDIA' ? 'Gov of India' : 'AICTE'}</strong>
          </button>

          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontSize: '0.72rem' }}>Session: <span style={{ color: '#5eead4', fontWeight: 600 }}>SECURE 256-BIT</span></span>
        </div>
      </div>

      {/* 3. Universal Gov Navigation Bar */}
      <header className="gov-navbar">
        <div className="brand-section">
          <div className="gov-emblem-badge">
            <GraduationCap size={28} />
          </div>
          <div className="brand-text">
            <h1>
              APAAR <span style={{ color: 'var(--gov-teal)' }}>Student Verify</span>
              <span className="brand-tag">SIH26261</span>
            </h1>
            <div className="brand-sub">
              APAAR-Based Student Data Management & Verification Platform for AICTE Institutions (MERN Stack)
            </div>
          </div>
        </div>

        <div className="nav-controls">
          {/* Active Portal Badge */}
          <div className="portal-indicator">
            {currentUser.role === 'ADMIN' ? (
              <>
                <ShieldCheck size={16} color="var(--gov-navy)" />
                <span>APAAR Team Portal</span>
              </>
            ) : (
              <>
                <GraduationCap size={16} color="var(--gov-teal)" />
                <span>Institution: <strong>{currentUser.ministryCode}</strong></span>
              </>
            )}
          </div>

          {/* Quick Portal Switcher button */}
          <button
            className="btn-secondary btn-sm"
            onClick={handleSwitchPortal}
            title="Switch between APAAR Team Portal and Institution Portal directly"
          >
            <ArrowRightLeft size={14} />
            Switch to {currentUser.role === 'ADMIN' ? 'Institution Portal' : 'APAAR Team Portal'}
          </button>

          {/* User Profile Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentUser.badge}</div>
            </div>

            <button
              className="btn-danger btn-sm"
              onClick={handleLogout}
              title="End Secure APAAR Session"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* 4. Real-Time Floating Live Alert Toast (When a student record arrives) */}
      {liveNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0B2545, #134074)',
          border: '2px solid #10b981',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
          color: '#fff',
          maxWidth: '380px',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{
              background: '#10b981',
              borderRadius: '50%',
              padding: '0.4rem',
              display: 'flex',
              color: '#fff'
            }}>
              <Bell size={20} className="pulse-indicator" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Live Student Record Stream
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
                  {liveNotification.timestamp}
                </span>
              </div>

              <strong style={{ fontSize: '0.9rem', display: 'block', color: '#fff' }}>
                {liveNotification.applicant}
              </strong>
              
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem' }}>
                Student Record <code style={{ color: '#5eead4', fontWeight: 700 }}>#{liveNotification.id}</code> ingested live.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                <span className="live-badge" style={{ background: 'rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.68rem' }}>
                  Status: {liveNotification.status}
                </span>
                <button
                  onClick={() => setLiveNotification(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Portal Content Router */}
      <main className="app-container" style={{ flex: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {currentUser.role === 'ADMIN' ? (
          <AdminPortal
            applications={applications}
            ministries={ministries}
            databases={databases}
            datasetRegistry={datasetRegistry}
            complianceRules={complianceRules}
            auditLogs={auditLogs}
            isSocketConnected={isSocketConnected}
            onOpenCitizenRequest={() => setCurrentView('CITIZEN')}
            onApplicationsUpdate={setApplications}
            onMinistriesUpdate={setMinistries}
            onDatasetRegistryUpdate={setDatasetRegistry}
            onRulesUpdate={setComplianceRules}
            onDecisionSubmit={handleDecisionSubmit}
            onLogAudit={logAudit}
          />
        ) : (
          <MinistryPortal
            currentMinistryCode={currentUser.ministryCode || 'IITD'}
            currentUser={currentUser}
            ministries={ministries}
            databases={databases}
            namedDatasets={namedDatasets}
            applications={applications}
            onApplicationsUpdate={setApplications}
            onDatabaseUpdate={handleDatabaseUpdate}
            onNamedDatasetUpdate={handleNamedDatasetUpdate}
            onApplicationUpload={handleApplicationUpload}
            onLogAudit={logAudit}
          />
        )}
      </main>

      {/* Global Status Footer */}
      <footer style={{
        padding: '1rem 2rem',
        borderTop: '2px solid var(--gov-navy)',
        background: 'var(--gov-navy)',
        color: 'var(--gov-white)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#5eead4', fontWeight: 600 }}>
            <span className="pulse-indicator"></span>
            APAAR Student Verify Engine: Online & Sovereign (Port 5000)
          </span>
          <span>•</span>
          <span>Active Institutions: <strong>{ministries.length}</strong></span>
          <span>•</span>
          <span>Student Records: <strong>{applications.length}</strong></span>
          <span>•</span>
          <span>Live WebSocket: <strong style={{ color: isSocketConnected ? '#34d399' : '#f87171' }}>{isSocketConnected ? 'CONNECTED' : 'STANDBY'}</strong></span>
        </div>

        <div style={{ opacity: 0.9 }}>
          Smart India Hackathon 2026 (SIH26261) • AICTE / APAAR Compliant (NIC / MeitY)
        </div>
      </footer>
    </div>
  );
}
