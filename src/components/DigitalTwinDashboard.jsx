import React, { useEffect, useState } from 'react';
import { 
  Activity, AlertTriangle, Clock, RefreshCw, Shield, 
  TrendingUp, User, Award, Eye, Flame, ShieldCheck, HelpCircle,
  Brain, BarChart3, Radio
} from 'lucide-react';

export default function DigitalTwinDashboard({ activeSessionId, isBackendConnected }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(activeSessionId || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

  // Fallback Mock Data Generator (for Offline/Frontend-only mode)
  const generateMockReport = (sessId) => {
    const mockId = sessId || 'mock_session_1';
    
    // Create 80-point attention and understanding timeline
    const timeline = [];
    const uTimeline = [];
    const baseTime = Date.now() - 3600000; // 1 hr ago
    let score = 95;
    let riskEma = 5;
    
    let sa = 98.0;
    let cogLoad = 25.0;
    let gap = 2.0;
    let riskEsc = 5.0;

    for (let i = 0; i < 80; i++) {
      const timeStr = new Date(baseTime + i * 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Simulate distraction dips
      if (i >= 20 && i <= 28) { // first distraction (mild)
        score = Math.max(35, score - 6 - Math.random() * 4);
        sa = Math.max(60.0, sa - 4.5);
        cogLoad = Math.min(65.0, cogLoad + 4.0);
        gap = Math.min(40.0, gap + 3.5);
        riskEsc = Math.min(50.0, riskEsc + 5.0);
      } else if (i >= 50 && i <= 60) { // fatigue dip (critical)
        score = Math.max(10, score - 8 - Math.random() * 6);
        sa = Math.max(15.0, sa - 8.0);
        cogLoad = Math.min(95.0, cogLoad + 7.0);
        gap = Math.min(85.0, gap + 7.5);
        riskEsc = Math.min(95.0, riskEsc + 9.0);
      } else {
        score = Math.min(98, score + 4 + Math.random() * 3);
        sa = Math.min(99.0, sa + 5.5);
        cogLoad = Math.max(22.0, cogLoad - 4.5);
        gap = Math.max(1.0, gap - 5.0);
        riskEsc = Math.max(4.0, riskEsc - 6.0);
      }

      riskEma = 0.08 * (100 - score) + 0.92 * riskEma;

      let state = 'focused';
      if (score < 30) state = 'fatigued';
      else if (score < 42) state = 'distracted';
      else if (score < 72) state = 'normal';

      timeline.push({
        timestamp: timeStr,
        score: parseFloat(score.toFixed(1)),
        state,
        risk_ema: parseFloat(riskEma.toFixed(1))
      });

      // Attention distribution values
      let pfd = 65.0;
      let tcas = 15.0;
      let eicas = 10.0;
      let alerts = 5.0;
      let secondary = 5.0;

      if (state === 'distracted') {
        pfd = 10.0;
        secondary = 70.0;
      } else if (state === 'fatigued') {
        pfd = 0.0;
        tcas = 0.0;
        secondary = 90.0;
      }

      uTimeline.push({
        id: i,
        session_id: mockId,
        timestamp: new Date(baseTime + i * 45000).toISOString(),
        situational_awareness: parseFloat(sa.toFixed(1)),
        cognitive_load: parseFloat(cogLoad.toFixed(1)),
        understanding_gap: parseFloat(gap.toFixed(1)),
        risk_escalation: parseFloat(riskEsc.toFixed(1)),
        attention_pfd: pfd,
        attention_tcas: tcas,
        attention_eicas: eicas,
        attention_alerts: alerts,
        attention_secondary: secondary
      });
    }

    return {
      session_id: mockId,
      operator_name: "Clipper 204 (Simulated)",
      industry: "aerospace",
      start_time: new Date(baseTime).toISOString(),
      end_time: new Date().toISOString(),
      duration_sec: 3600,
      metrics: {
        id: "mock_metric",
        session_id: mockId,
        calculated_at: new Date().toISOString(),
        total_duration_sec: 3600,
        avg_attention_score: 74.5,
        focus_ratio: 0.812,
        avg_alert_response_time: 1.84,
        overall_risk_level: "moderate"
      },
      overload_events: [
        {
          id: "mock_overload_1",
          session_id: mockId,
          start_time: new Date(baseTime + 20 * 45000).toISOString(),
          end_time: new Date(baseTime + 28 * 45000).toISOString(),
          duration_sec: 360,
          max_overload_level: 3,
          average_attention_score: 41.2
        },
        {
          id: "mock_overload_2",
          session_id: mockId,
          start_time: new Date(baseTime + 50 * 45000).toISOString(),
          end_time: new Date(baseTime + 60 * 45000).toISOString(),
          duration_sec: 450,
          max_overload_level: 4,
          average_attention_score: 22.8
        }
      ],
      alert_timeline: [
        {
          id: "mock_alert_1",
          session_id: mockId,
          timestamp: new Date(baseTime + 10 * 45000).toISOString(),
          alert_id: "al_a1",
          code: "FUEL_FILTER_CLOG",
          message: "FUEL FILTER DETECTED CLOG",
          original_priority: "low",
          final_urgency: 20.0,
          status: "acknowledged",
          acknowledged_at: new Date(baseTime + 10 * 45000 + 3400).toISOString(),
          response_time_sec: 3.4
        },
        {
          id: "mock_alert_2",
          session_id: mockId,
          timestamp: new Date(baseTime + 23 * 45000).toISOString(),
          alert_id: "al_a2",
          code: "AUTOPILOT_DISCONNECT",
          message: "AUTOPILOT DISCONNECT Stick Alert",
          original_priority: "high",
          final_urgency: 64.5,
          status: "acknowledged",
          acknowledged_at: new Date(baseTime + 23 * 45000 + 1200).toISOString(),
          response_time_sec: 1.2
        },
        {
          id: "mock_alert_3",
          session_id: mockId,
          timestamp: new Date(baseTime + 52 * 45000).toISOString(),
          alert_id: "al_a3",
          code: "TCAS_COLLISION",
          message: "TCAS ENCOUNTER: TRAFFIC INTERCEPT WARNING",
          original_priority: "critical",
          final_urgency: 92.4,
          status: "acknowledged",
          acknowledged_at: new Date(baseTime + 52 * 45000 + 920).toISOString(),
          response_time_sec: 0.92
        }
      ],
      attention_timeline: timeline,
      understanding_timeline: uTimeline
    };
  };

  const generateMockGlobalStats = () => {
    return {
      total_operators: 1,
      total_sessions: 5,
      total_hours_logged: 8.45,
      average_attention_score: 78.2,
      average_focus_ratio: 0.845,
      average_response_time_sec: 1.62,
      overload_events_count: {
        total: 12,
        critical_level_4: 4,
        moderate_level_3: 8
      },
      operator_risk_distribution: {
        low: 3,
        moderate: 1,
        high: 1,
        critical: 0
      }
    };
  };

  // Fetch sessions
  const fetchSessions = async () => {
    if (!isBackendConnected) {
      setSessions([
        { id: 'mock_session_1', operator_id: 'operator_01', start_time: new Date(Date.now() - 3600000).toISOString(), initial_industry: 'aerospace' },
        { id: 'mock_session_2', operator_id: 'operator_01', start_time: new Date(Date.now() - 7200000).toISOString(), initial_industry: 'railways' },
        { id: 'mock_session_3', operator_id: 'operator_01', start_time: new Date(Date.now() - 14400000).toISOString(), initial_industry: 'mining' }
      ]);
      setGlobalStats(generateMockGlobalStats());
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/digital-twin/sessions');
      if (!res.ok) throw new Error("Failed to load sessions list");
      const data = await res.json();
      setSessions(data);

      const statsRes = await fetch('http://localhost:8000/api/digital-twin/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setGlobalStats(statsData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sync backend session list.");
    }
  };

  // Fetch Specific session
  const fetchReport = async (sessId) => {
    if (!sessId) return;
    setLoading(true);
    setError(null);

    if (!isBackendConnected || sessId.startsWith('mock_')) {
      setTimeout(() => {
        setReport(generateMockReport(sessId));
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/digital-twin/sessions/${sessId}/report`);
      if (!res.ok) throw new Error("Failed to compile digital twin report");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
      setError("Error loading report from FastAPI backend. Falling back to offline simulator.");
      setReport(generateMockReport(sessId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isBackendConnected]);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedSessionId(activeSessionId);
    } else if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchReport(selectedSessionId);
    }
  }, [selectedSessionId]);

  const handleRefresh = () => {
    fetchSessions();
    if (selectedSessionId) {
      fetchReport(selectedSessionId);
    }
  };

  // SVG Chart Dimensions
  const chartW = 750;
  const chartH = 210;
  const padX = 40;
  const padY = 25;

  const renderSVGChart = (timeline) => {
    if (!timeline || timeline.length < 2) {
      return (
        <div className="empty-panel-msg">Insufficient flight telemetry logged for this session yet.</div>
      );
    }

    const maxIdx = timeline.length - 1;
    const getCoords = (key) => {
      return timeline.map((pt, idx) => {
        const x = padX + (idx / maxIdx) * (chartW - 2 * padX);
        const y = chartH - padY - (pt[key] / 100) * (chartH - 2 * padY);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const attentionPoints = getCoords('score');
    const riskPoints = getCoords('risk_ema');

    const gridY = [25, 50, 75, 100];
    const gridLines = gridY.map(val => {
      const y = chartH - padY - (val / 100) * (chartH - 2 * padY);
      return (
        <g key={`grid-${val}`}>
          <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <text x={padX - 8} y={y + 3} fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-hud)" textAnchor="end">{val}%</text>
        </g>
      );
    });

    const labelStep = Math.max(1, Math.ceil(timeline.length / 5));
    const xLabels = [];
    for (let i = 0; i < timeline.length; i += labelStep) {
      const x = padX + (i / maxIdx) * (chartW - 2 * padX);
      xLabels.push(
        <text key={`label-x-${i}`} x={x} y={chartH - 5} fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-hud)" textAnchor="middle">
          {timeline[i].timestamp}
        </text>
      );
    }

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="attn-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00e676" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="risk-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d500f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff1744" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {gridLines}
        {xLabels}
        <polyline fill="none" stroke="url(#attn-line-grad)" strokeWidth="2.5" points={attentionPoints} />
        <polyline fill="none" stroke="url(#risk-line-grad)" strokeWidth="1.8" strokeDasharray="3 2" points={riskPoints} />
      </svg>
    );
  };

  // Render Understanding curves (Situational Awareness, Cognitive Load, Risk Escalation)
  const renderSVGUnderstandingChart = (timeline) => {
    if (!timeline || timeline.length < 2) {
      return (
        <div className="empty-panel-msg">Sensor locks processing... Gaze telemetry required.</div>
      );
    }

    const maxIdx = timeline.length - 1;
    const getCoords = (key) => {
      return timeline.map((pt, idx) => {
        const x = padX + (idx / maxIdx) * (chartW - 2 * padX);
        const y = chartH - padY - (pt[key] / 100) * (chartH - 2 * padY);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    const saPoints = getCoords('situational_awareness');
    const loadPoints = getCoords('cognitive_load');
    const riskPoints = getCoords('risk_escalation');

    const gridY = [20, 40, 60, 80, 100];
    const gridLines = gridY.map(val => {
      const y = chartH - padY - (val / 100) * (chartH - 2 * padY);
      return (
        <g key={`u-grid-${val}`}>
          <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <text x={padX - 8} y={y + 3} fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-hud)" textAnchor="end">{val}</text>
        </g>
      );
    });

    const labelStep = Math.max(1, Math.ceil(timeline.length / 5));
    const xLabels = [];
    for (let i = 0; i < timeline.length; i += labelStep) {
      const x = padX + (i / maxIdx) * (chartW - 2 * padX);
      const timeStr = timeline[i].timestamp ? (
        timeline[i].timestamp.includes('T')
          ? new Date(timeline[i].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : timeline[i].timestamp
      ) : '';
      xLabels.push(
        <text key={`u-label-x-${i}`} x={x} y={chartH - 5} fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-hud)" textAnchor="middle">
          {timeStr}
        </text>
      );
    }

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
        {gridLines}
        {xLabels}
        {/* SA: Glowing Green/Cyan */}
        <polyline fill="none" stroke="#00e676" strokeWidth="2.5" points={saPoints} />
        {/* Cognitive Load: Amber */}
        <polyline fill="none" stroke="#ff9100" strokeWidth="2.0" strokeDasharray="5 3" points={loadPoints} />
        {/* Risk Escalation: Crimson */}
        <polyline fill="none" stroke="#ff1744" strokeWidth="2.0" strokeDasharray="2 2" points={riskPoints} />
      </svg>
    );
  };

  // Get attention zone averages
  const calculateAttentionZoneAverages = (timeline) => {
    if (!timeline || timeline.length === 0) return { pfd: 0, tcas: 0, eicas: 0, alerts: 0, secondary: 0 };
    let p = 0, t = 0, e = 0, a = 0, s = 0;
    timeline.forEach(pt => {
      p += pt.attention_pfd || 0;
      t += pt.attention_tcas || 0;
      e += pt.attention_eicas || 0;
      a += pt.attention_alerts || 0;
      s += pt.attention_secondary || 0;
    });
    const len = timeline.length;
    return {
      pfd: Math.round(p / len),
      tcas: Math.round(t / len),
      eicas: Math.round(e / len),
      alerts: Math.round(a / len),
      secondary: Math.round(s / len)
    };
  };

  const zoneAverages = report ? calculateAttentionZoneAverages(report.understanding_timeline) : null;

  const getRiskClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'twin-risk-critical';
      case 'high': return 'twin-risk-high';
      case 'moderate': return 'twin-risk-moderate';
      default: return 'twin-risk-low';
    }
  };

  return (
    <div className="twin-container">
      {/* 1. Header Control Bar */}
      <div className="twin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Brain size={18} className="glow-icon" style={{ color: 'var(--hud-accent)' }} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.05rem', margin: 0, letterSpacing: '0.05em' }}>COGNITIVE DIGITAL TWIN ARCHIVE</h2>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>
              Mission Control Telemetry Database & Mental State Assimilation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className={`connection-badge ${isBackendConnected ? 'online' : 'offline'}`}>
            <div className="status-dot" />
            <span>{isBackendConnected ? "FASTAPI DIRECT SYNC" : "OFFLINE TELEMETRY LOCAL FALLBACK"}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)' }}>SELECT SESSION:</span>
            <select 
              className="session-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={loading}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.start_time).toLocaleTimeString()} ({s.initial_industry.toUpperCase()})
                </option>
              ))}
              {sessions.length === 0 && <option value="">No sessions loaded</option>}
            </select>
          </div>

          <button className="twin-refresh-btn" onClick={handleRefresh} title="Sync latest data">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="twin-error-banner">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="twin-loading-screen">
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--hud-accent)' }} />
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', color: 'var(--hud-accent)', letterSpacing: '0.05em' }}>
            SYNCHRONIZING TELEMETRY FROM DIGITAL TWIN ARCHIVE...
          </span>
        </div>
      ) : report ? (
        <div className="twin-dashboard-grid">
          
          {/* ==========================================
              COL 1: GAUGES & PERFORMANCE
             ========================================== */}
          <div className="twin-card summary-wrapper">
            <div className="twin-card-title"><User size={13} /> Operator Profile Matrix</div>
            
            <div className="meta-profile-details" style={{ fontFamily: 'var(--font-hud)' }}>
              <div className="profile-row">
                <span className="profile-label">Operator:</span>
                <span className="profile-val">{report.operator_name}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Environment:</span>
                <span className="profile-val" style={{ textTransform: 'uppercase' }}>{report.industry}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Session ID:</span>
                <span className="profile-val text-truncated" title={report.session_id}>{report.session_id.substring(0, 14)}...</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Duration:</span>
                <span className="profile-val">{(report.duration_sec / 60).toFixed(1)} mins</span>
              </div>
            </div>

            <hr className="hud-divider" />

            <div className="twin-card-title"><Award size={13} /> Cognitive Aggregates</div>
            
            <div className="performance-stats-grid">
              
              <div className="stat-gauge-box">
                <div className="gauge-label">Avg Gaze Focus</div>
                <div className="gauge-val text-cyan">{report.metrics?.avg_attention_score ?? 'N/A'}%</div>
                <div className="gauge-bar-track">
                  <div className="gauge-bar-fill bg-cyan" style={{ width: `${report.metrics?.avg_attention_score ?? 0}%` }} />
                </div>
              </div>

              <div className="stat-gauge-box">
                <div className="gauge-label">Focus Assimilation</div>
                <div className="gauge-val text-green">
                  {report.metrics?.focus_ratio ? `${Math.round(report.metrics.focus_ratio * 100)}%` : 'N/A'}
                </div>
                <div className="gauge-bar-track">
                  <div className="gauge-bar-fill bg-green" style={{ width: `${(report.metrics?.focus_ratio ?? 0) * 100}%` }} />
                </div>
              </div>

              <div className="stat-gauge-box">
                <div className="gauge-label">Avg Alert Latency</div>
                <div className="gauge-val text-orange">
                  {report.metrics?.avg_alert_response_time ? `${report.metrics.avg_alert_response_time}s` : 'N/A'}
                </div>
                <div className="gauge-bar-track">
                  <div 
                    className="gauge-bar-fill bg-orange" 
                    style={{ width: `${Math.min(100, ((5 - (report.metrics?.avg_alert_response_time ?? 5)) / 5) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="stat-gauge-box">
                <div className="gauge-label">Composite Risk Rating</div>
                <div className={`gauge-risk-badge ${getRiskClass(report.metrics?.overall_risk_level)}`}>
                  {report.metrics?.overall_risk_level?.toUpperCase() ?? 'LOW'}
                </div>
              </div>

            </div>
          </div>

          {/* ==========================================
              COL 2: TIME SERIES UNDERSTANDING CHART
             ========================================== */}
          <div className="twin-card chart-wrapper">
            <div className="twin-card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><Brain size={13} style={{ color: 'var(--color-focused)' }} /> Understanding Gap Engine Analytics</span>
              <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.6rem', fontFamily: 'var(--font-hud)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span className="legend-dot" style={{ background: '#00e676' }} /> Situational Awareness (SA)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span className="legend-dot" style={{ background: '#ff9100' }} /> Cognitive Load (CL)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span className="legend-dot text-red" style={{ background: '#ff1744' }} /> Risk Escalation
                </span>
              </div>
            </div>
            
            <div className="twin-chart-container">
              {renderSVGUnderstandingChart(report.understanding_timeline)}
            </div>
          </div>

          {/* ==========================================
              COL 3: COGNITIVE ATTENTION ALLOCATION PIE-GRID
             ========================================== */}
          <div className="twin-card overload-wrapper">
            <div className="twin-card-title"><BarChart3 size={13} /> Gaze Attention Allocation Breakdown</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, justifyContent: 'center' }}>
              {zoneAverages && (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-hud)', marginBottom: '0.1rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Primary Flight Display (PFD)</span>
                      <span>{zoneAverages.pfd}%</span>
                    </div>
                    <div className="gauge-bar-track"><div className="gauge-bar-fill bg-cyan" style={{ width: `${zoneAverages.pfd}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-hud)', marginBottom: '0.1rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>TCAS Collision Radar</span>
                      <span>{zoneAverages.tcas}%</span>
                    </div>
                    <div className="gauge-bar-track"><div className="gauge-bar-fill bg-green" style={{ width: `${zoneAverages.tcas}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-hud)', marginBottom: '0.1rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>EICAS Engine Panels</span>
                      <span>{zoneAverages.eicas}%</span>
                    </div>
                    <div className="gauge-bar-track"><div className="gauge-bar-fill bg-orange" style={{ width: `${zoneAverages.eicas}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-hud)', marginBottom: '0.1rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Active Warnings List</span>
                      <span>{zoneAverages.alerts}%</span>
                    </div>
                    <div className="gauge-bar-track"><div className="gauge-bar-fill bg-magenta" style={{ width: `${zoneAverages.alerts}%` }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-hud)', marginBottom: '0.1rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Peripheral / Secondary</span>
                      <span>{zoneAverages.secondary}%</span>
                    </div>
                    <div className="gauge-bar-track"><div className="gauge-bar-fill" style={{ width: `${zoneAverages.secondary}%`, background: '#64748b' }} /></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ==========================================
              COL 4: THREAT LATENCY DECK
             ========================================== */}
          <div className="twin-card alerts-wrapper">
            <div className="twin-card-title"><Radio size={13} /> threat reaction logs</div>
            
            <div className="twin-table-container">
              <table className="twin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Code</th>
                    <th>Priority</th>
                    <th>Reaction</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.alert_timeline.map((alert, idx) => (
                    <tr key={alert.id || idx}>
                      <td>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td>
                        <span className="alert-code-cell" title={alert.message}>{alert.code}</span>
                      </td>
                      <td>
                        <span className={`priority-text-badge ${alert.original_priority}`}>
                          {alert.original_priority}
                        </span>
                      </td>
                      <td className="latency-cell">
                        {alert.response_time_sec !== null ? (
                          <span className={alert.response_time_sec < 1.5 ? 'text-green' : (alert.response_time_sec < 3.0 ? 'text-yellow' : 'text-red')}>
                            {alert.response_time_sec.toFixed(2)}s
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`status-badge-cell ${alert.status}`}>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {report.alert_timeline.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-table-msg">No threats encountered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==========================================
              COL 5: TWIN GLOBAL AGGREGATE SUMMARY
             ========================================== */}
          {globalStats && (
            <div className="twin-card global-stats-wrapper">
              <div className="twin-card-title"><Activity size={13} /> Fleet Cognitive Database Summary (Aggregated)</div>
              
              <div className="global-stats-content">
                <div className="global-metric-card">
                  <span className="g-m-lbl">Logged Sessions</span>
                  <span className="g-m-val">{globalStats.total_sessions}</span>
                </div>
                <div className="global-metric-card">
                  <span className="g-m-lbl">Total Time Logged</span>
                  <span className="g-m-val text-cyan">{globalStats.total_hours_logged} hrs</span>
                </div>
                <div className="global-metric-card">
                  <span className="g-m-lbl">Average Focus Ratio</span>
                  <span className="g-m-val text-green">{Math.round(globalStats.average_focus_ratio * 100)}%</span>
                </div>
                <div className="global-metric-card">
                  <span className="g-m-lbl">Risk Profile Summary</span>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <span className="risk-mini-badge critical">{globalStats.operator_risk_distribution.critical}C</span>
                    <span className="risk-mini-badge high">{globalStats.operator_risk_distribution.high}H</span>
                    <span className="risk-mini-badge moderate">{globalStats.operator_risk_distribution.moderate}M</span>
                    <span className="risk-mini-badge low">{globalStats.operator_risk_distribution.low}L</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
          <HelpCircle size={40} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select a session from the dropdown to load the Digital Twin report.</span>
        </div>
      )}
    </div>
  );
}
