import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Server, Zap, CheckCircle2, AlertTriangle, 
  RefreshCw, Play, Pause, Database, ShieldCheck, ArrowRight,
  Clock, HardDrive, Wifi, Radio
} from 'lucide-react';

export function TelemetryView({ applications = [], ministries = [] }) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [throughput, setThroughput] = useState(142);
  const [avgLatency, setAvgLatency] = useState(38);
  const [cacheHitRate, setCacheHitRate] = useState(96.4);
  const [activeQueueCount, setActiveQueueCount] = useState(applications.filter(a => a.status === 'PENDING_AI_CHECK').length);

  // Live streaming pipeline events
  const [streamEvents, setStreamEvents] = useState([
    { id: 1, time: '14:38:12.450', service: 'APAAR-IDENTITY-CORE', event: '12-digit academic identity token resolved with NAD', latency: '24ms', status: 'SUCCESS' },
    { id: 2, time: '14:38:12.482', service: 'LEVENSHTEIN-CORE', event: 'Phonetic match index 99.2% calculated for Student Name', latency: '5ms', status: 'SUCCESS' },
    { id: 3, time: '14:38:12.510', service: 'AICTE-INTAKE-ENGINE', event: 'Approved intake capacity verified [118/120 Enrolled]', latency: '32ms', status: 'SUCCESS' },
    { id: 4, time: '14:38:12.560', service: 'DUPLICATE-ENROLMENT-DETECTOR', event: 'Cross-institution hash audit passed [Single Institutional Lock]', latency: '18ms', status: 'SUCCESS' },
    { id: 5, time: '14:38:12.610', service: 'SUPERNUMERARY-CHECK', event: 'NRI / OCI / FN quota verified within 15% statutory ceiling', latency: '14ms', status: 'SUCCESS' },
    { id: 6, time: '14:38:12.650', service: 'RULE-EVALUATOR', event: 'AICTE Approval Process Handbook Clause 3.4 satisfied', latency: '8ms', status: 'SUCCESS' }
  ]);

  // Simulate real-time telemetry updates
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setThroughput(prev => Math.floor(135 + Math.random() * 25));
      setAvgLatency(prev => Math.floor(32 + Math.random() * 12));
      
      const services = ['APAAR-IDENTITY-CORE', 'AICTE-INTAKE-ENGINE', 'DUPLICATE-DETECTOR', 'IITD-NODE', 'BITS-NODE', 'VIT-NODE', 'NITT-NODE'];
      const actions = [
        'Cached academic identity hit (L1 In-Memory)',
        'Cross-institution federated record authenticated',
        'Cryptographic hash match confirmed against APAAR registry',
        'Sanctioned intake capacity ceiling verified',
        'Multi-college duplicate audit passed successfully'
      ];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      setStreamEvents(prev => [
        {
          id: Date.now(),
          time: timeStr,
          service: randomService,
          event: randomAction,
          latency: `${Math.floor(12 + Math.random() * 45)}ms`,
          status: 'SUCCESS'
        },
        ...prev.slice(0, 19)
      ]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const adapters = [
    { code: 'IITD', name: 'IIT Delhi Institutional Enrolment Node', latency: '24ms', uptime: '99.98%', status: 'HEALTHY', tps: '1,240 req/s', protocol: 'mTLS v1.3' },
    { code: 'BITS', name: 'BITS Pilani Academic Depository Adapter', latency: '42ms', uptime: '99.95%', status: 'HEALTHY', tps: '890 req/s', protocol: 'HTTPS / REST' },
    { code: 'VIT', name: 'VIT Vellore Student Registry Core API', latency: '31ms', uptime: '99.99%', status: 'HEALTHY', tps: '640 req/s', protocol: 'OAuth 2.0 / JWT' },
    { code: 'NITT', name: 'NIT Trichy Enrolment Gateway', latency: '38ms', uptime: '99.94%', status: 'HEALTHY', tps: '520 req/s', protocol: 'mTLS v1.3' }
  ];

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
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.75rem',
            color: 'var(--accent)',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            <Activity size={14} />
            Page 3 • Real-Time Engine Operations & Telemetry
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>AI Verification Pipeline Operations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Live query throughput, microsecond latency metrics, federated adapter telemetry, and continuous streaming logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className={`btn-${isStreaming ? 'secondary' : 'primary'} btn-sm`}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? (
              <>
                <Pause size={14} />
                Pause Stream
              </>
            ) : (
              <>
                <Play size={14} />
                Resume Stream
              </>
            )}
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--success-border)',
            fontSize: '0.82rem',
            color: '#34d399',
            fontWeight: 600
          }}>
            <Radio size={14} className="pulse-indicator" />
            Telemetry Stream Active
          </div>
        </div>
      </div>

      {/* Real-time KPI Stats */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Query Throughput</h3>
            <div className="value" style={{ color: 'var(--accent)' }}>{throughput} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>req/s</span></div>
            <span className="badge badge-neutral" style={{ marginTop: '0.5rem' }}>Auto-Scaling Node Cluster</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
            <Zap size={24} color="var(--accent)" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>P99 Engine Latency</h3>
            <div className="value" style={{ color: '#34d399' }}>{avgLatency} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ms</span></div>
            <span className="badge badge-pass" style={{ marginTop: '0.5rem' }}>Sub-50ms SLA Met</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
            <Clock size={24} color="#34d399" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Cache Hit Ratio</h3>
            <div className="value" style={{ color: '#818cf8' }}>{cacheHitRate}%</div>
            <span className="badge badge-neutral" style={{ marginTop: '0.5rem' }}>Redis L1/L2 Partition</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--border-glow)', background: 'rgba(99, 102, 241, 0.1)' }}>
            <HardDrive size={24} color="#818cf8" />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>System Fault Tolerance</h3>
            <div className="value" style={{ color: '#f59e0b' }}>99.99%</div>
            <span className="badge badge-review" style={{ marginTop: '0.5rem' }}>Zero Data Leaks</span>
          </div>
          <div className="metric-icon-box" style={{ borderColor: 'var(--warning-border)', background: 'var(--warning-bg)' }}>
            <ShieldCheck size={24} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Architecture Pipeline Flow Diagram */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>End-to-End Pipeline Execution Topology</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Deterministic, non-hallucinatory evaluation flow from raw submitted application to multi-ministry consensus.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {[
            { step: '01', title: 'Ingestion & Schema Check', sub: 'Format & Column Validation', status: 'ACTIVE', time: '< 2ms' },
            { step: '02', title: 'Dynamic Registry Discovery', sub: 'Non-hardcoded dataset resolution', status: 'ACTIVE', time: '< 5ms' },
            { step: '03', title: 'Dynamic Verification Plan', sub: 'Rules & access permissions plan', status: 'ACTIVE', time: '< 8ms' },
            { step: '04', title: 'Federated Query Execution', sub: 'UIDAI, CBDT, MoE, MCA Adapters', status: 'ACTIVE', time: '< 25ms' },
            { step: '05', title: 'Phonetic & Expansion Checks', sub: 'Levenshtein >= 80% & High-income scan', status: 'ACTIVE', time: '< 10ms' },
            { step: '06', title: 'Consolidated Page 16 Report', sub: 'Evidence trails & Reviewer sign-off', status: 'READY', time: '< 4ms' }
          ].map((node, i) => (
            <div key={i} style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                  STAGE {node.step}
                </span>
                <span className="badge badge-pass" style={{ fontSize: '0.65rem' }}>{node.time}</span>
              </div>
              <h4 style={{ fontSize: '0.92rem', marginBottom: '0.25rem' }}>{node.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{node.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Ministry Adapters & Live Stream Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
        {/* Ministry Adapters */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Federated Ministry API Adapters</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Live health status of integrated ministry endpoints</p>
            </div>
            <Server size={18} color="var(--primary-light)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {adapters.map((ad, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#fff' }}>[{ad.code}]</span>
                    <strong style={{ fontSize: '0.9rem' }}>{ad.name}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Protocol: <strong style={{ color: 'var(--text-secondary)' }}>{ad.protocol}</strong></span>
                    <span>Load: <strong style={{ color: 'var(--accent)' }}>{ad.tps}</strong></span>
                    <span>Uptime: <strong style={{ color: '#34d399' }}>{ad.uptime}</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-pass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} />
                    {ad.latency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Streaming Log */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Live Query Streaming Bus</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Microsecond event trace from distributed node engines</p>
            </div>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Auto-Scroll: ON
            </span>
          </div>

          <div style={{
            background: 'rgba(5, 7, 12, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            maxHeight: '340px',
            overflowY: 'auto'
          }}>
            {streamEvents.map(evt => (
              <div key={evt.id} style={{
                padding: '0.35rem 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-muted)', minWidth: '85px' }}>{evt.time}</span>
                <span style={{ color: 'var(--accent)', minWidth: '125px', fontWeight: 600 }}>[{evt.service}]</span>
                <span style={{ color: '#e2e8f0', flex: 1 }}>{evt.event}</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{evt.latency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
