import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Compass, Users, Clock, AlertTriangle, Database, Eye } from 'lucide-react';
import WebcamTracker from './components/WebcamTracker';
import TelemetryPanel from './components/TelemetryPanel';
import AlertPanel from './components/AlertPanel';
import DigitalTwinDashboard from './components/DigitalTwinDashboard';
import InstructorControl from './components/InstructorControl';
import AerospaceCockpit from './components/industry/AerospaceCockpit';
import { startAlarm, stopAlarm, playBeep } from './audio';

// Default presets for alerts on load to showcase adaptive overlay
const initialAlertPresets = {
  aerospace: [
    { id: 'al_a1', message: "TCAS COLLISION AVOIDANCE", description: "TRAFFIC ALERT: -1225FT | RANGE: 2.4 NM | CLOSURE: 382 kts", priority: "critical", action: "CMD: CLIMB RATE > 1500 FT/MIN", status: "active" },
    { id: 'al_a2', message: "AUTOPILOT DISCONNECT", description: "Autopilot disengaged. Restoring manual stick feedback.", priority: "high", action: "TAKE MANUAL CONTROL", status: "active" }
  ],
  railways: [
    { id: 'al_r1', message: "TRACK FAULT DETECTED", description: "Active telemetry indicates switch alignment deviation.", priority: "high", action: "REDUCE SPEED TO 30KM/H", status: "active" },
    { id: 'al_r2', message: "COMMUNICATION LOST", description: "Secondary link to dispatch offline. Failover active.", priority: "low", action: "RESET CAB RADIO", status: "active" }
  ],
  mining: [
    { id: 'al_m1', message: "HAZARD HIGH SLOPE", description: "Lateral tilt exceeds 12-degree grade hazard safety line.", priority: "high", action: "STEER AWAY FROM SLOPE", status: "active" },
    { id: 'al_m2', message: "PERFORMANCE WARNING", description: "Engine fuel injector pressure variance outside bounds.", priority: "low", action: "SCHEDULE MAINTENANCE", status: "active" }
  ],
  machinery: [
    { id: 'al_h1', message: "HYDRAULIC PUMP LEAK", description: "Main crane cylinder line pressure dropping.", priority: "high", action: "LOCK HYDRAULIC VALVE", status: "active" },
    { id: 'al_h2', message: "OIL FILTER CLOGGED", description: "Differential indicator suggests filter replacement due.", priority: "low", action: "MONITOR FLUID TEMP", status: "active" }
  ]
};

export default function App() {
  const [industry, setIndustry] = useState('aerospace');
  const [visorGazeLock, setVisorGazeLock] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/twin') return 'twin';
    if (path === '/control') return 'control';
    return 'cockpit';
  });

  const navigateToView = (view) => {
    setCurrentView(view);
    if (view === 'twin') {
      window.history.pushState({}, '', '/twin');
    } else if (view === 'control') {
      window.history.pushState({}, '', '/control');
    } else {
      window.history.pushState({}, '', '/');
    }
  };
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [systemTime, setSystemTime] = useState('');
  const lastPostTimeRef = useRef(0);

  // Real-time telemetry (merged from Camera or Simulator)
  const [telemetry, setTelemetry] = useState({
    detected: true,
    attentionScore: 100,
    state: 'focused',
    yaw: 0,
    pitch: 0,
    roll: 0,
    ear: 0.25,
    gazeX: 0,
    gazeY: 0,
    isBlinking: false,
    gForce: 1.0,
    pupilDilation: 3.2,
    cognitiveSaturation: 12.0,
    endsleyL1: 98,
    endsleyL2: 95,
    endsleyL3: 96,
    scenario: 'nominal'
  });

  // Simulator values state
  const [simState, setSimState] = useState({
    attentionScore: 95,
    state: 'focused',
    yaw: 2,
    pitch: 1,
    roll: 0,
    ear: 0.28,
    gazeX: 2.5,
    gazeY: -1.2,
    isBlinking: false,
    gForce: 1.0,
    pupilDilation: 3.2,
    cognitiveSaturation: 12.0,
    endsleyL1: 98,
    endsleyL2: 95,
    endsleyL3: 96,
    scenario: 'nominal'
  });

  const [alerts, setAlerts] = useState(initialAlertPresets.aerospace);
  const scenarioIntervalRef = useRef(null);

  // Sync clock time
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setSystemTime(d.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/twin') setCurrentView('twin');
      else if (path === '/control') setCurrentView('control');
      else setCurrentView('cockpit');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync alerts when industry changes
  useEffect(() => {
    setAlerts(initialAlertPresets[industry] || []);
  }, [industry]);

  // Connect to backend & manage session lifecycle
  useEffect(() => {
    let activeSess = null;
    const checkConnectionAndStartSession = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/operators');
        if (res.ok) {
          setIsBackendConnected(true);
          const sessionRes = await fetch('http://localhost:8000/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operator_id: 'operator_01',
              initial_industry: industry
            })
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setActiveSessionId(sessionData.id);
            activeSess = sessionData.id;
            console.log("CognitiveSync Twin session initialized:", sessionData.id);

            // Log preset alerts into session database
            const presets = initialAlertPresets[industry] || [];
            for (const item of presets) {
              await fetch(`http://localhost:8000/api/sessions/${sessionData.id}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  alert_id: item.id,
                  code: item.message.replace(/\s+/g, '_'),
                  message: item.description || item.message,
                  original_priority: item.priority,
                  final_urgency: item.priority === 'critical' ? 90.0 : (item.priority === 'high' ? 60.0 : 20.0)
                })
              }).catch(err => console.error(err));
            }
          }
        }
      } catch (err) {
        console.log("FastAPI backend not running. Operating in browser local mock mode.");
        setIsBackendConnected(false);
        setActiveSessionId(null);
      }
    };

    checkConnectionAndStartSession();

    // Cleanup: end session on unmount or industry change
    return () => {
      if (activeSess) {
        fetch(`http://localhost:8000/api/sessions/${activeSess}/end`, { method: 'POST' })
          .catch(err => console.error("Session end error:", err));
      }
    };
  }, [industry]);

  // Log telemetry to backend (Throttled at 1 second intervals)
  useEffect(() => {
    if (!isBackendConnected || !activeSessionId) return;
    const now = Date.now();
    if (now - lastPostTimeRef.current < 1000) return;
    lastPostTimeRef.current = now;

    fetch(`http://localhost:8000/api/sessions/${activeSessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: telemetry.attentionScore,
        state: telemetry.state,
        yaw: telemetry.yaw,
        pitch: telemetry.pitch,
        roll: telemetry.roll,
        ear: telemetry.ear,
        gaze_x: telemetry.gazeX,
        gaze_y: telemetry.gazeY,
        is_blinking: telemetry.isBlinking
      })
    }).catch(err => console.warn("Failed to stream telemetry:", err));
  }, [telemetry, isBackendConnected, activeSessionId]);

  // Handle telemetry update from the camera
  const handleCameraTelemetry = (newTelemetry) => {
    if (!isSimulating) {
      // Calculate dynamic cognitive stats on the fly from camera variables
      const CS = Math.min(100, Math.max(0, 100 - newTelemetry.attentionScore + (newTelemetry.isBlinking ? 20 : 0)));
      const PD = 3.0 + (CS / 100) * 4.0; // Dilate pupil as cognitive load grows

      // Endsley Levels computation
      const l1 = Math.round(newTelemetry.attentionScore); // Perception correlates to raw attention
      const l2 = Math.round(newTelemetry.detected ? Math.max(0, newTelemetry.attentionScore * 0.95 - Math.abs(newTelemetry.yaw) * 0.5) : 0); // Comprehension drops if head yaw is high
      const l3 = Math.round(newTelemetry.detected ? Math.max(0, l2 * 0.98 - Math.abs(newTelemetry.pitch) * 0.5) : 0); // Projection drops if head pitch is high

      setTelemetry({
        ...newTelemetry,
        gForce: 1.0, // Camera operates under 1G standard
        pupilDilation: parseFloat(PD.toFixed(2)),
        cognitiveSaturation: parseFloat(CS.toFixed(1)),
        endsleyL1: l1,
        endsleyL2: l2,
        endsleyL3: l3,
        scenario: 'nominal'
      });
    }
  };

  // Sync telemetry with simulator when simulation override is on
  useEffect(() => {
    if (isSimulating) {
      setTelemetry({
        detected: true,
        attentionScore: simState.attentionScore,
        state: simState.state,
        yaw: simState.yaw,
        pitch: simState.pitch,
        roll: simState.roll,
        ear: simState.ear,
        gazeX: simState.gazeX,
        gazeY: simState.gazeY,
        isBlinking: simState.isBlinking,
        gForce: simState.gForce,
        pupilDilation: simState.pupilDilation,
        cognitiveSaturation: simState.cognitiveSaturation,
        endsleyL1: simState.endsleyL1,
        endsleyL2: simState.endsleyL2,
        endsleyL3: simState.endsleyL3,
        scenario: simState.scenario
      });
    }
  }, [isSimulating, simState]);

  // Translate numerical attention score into 5 distinct granular levels (0 to 4)
  const getAttentionLevel = (score, detected) => {
    if (!detected) return 4; // Absence of operator is critical Level 4
    if (score >= 75) return 0;
    if (score >= 60) return 1;
    if (score >= 45) return 2;
    if (score >= 30) return 3;
    return 4; // Score < 30 is Level 4
  };

  const attentionLevel = getAttentionLevel(telemetry.attentionScore, telemetry.detected);

  // Watch attentionLevel changes to trigger/stop auditory alarms
  useEffect(() => {
    if (attentionLevel === 3) {
      startAlarm('distracted'); // Level 3: standard repeating beep
    } else if (attentionLevel === 4) {
      startAlarm('fatigued'); // Level 4: rapid double beep (emergency)
    } else {
      stopAlarm(); // Level 0, 1, 2: mute alarms
    }
    return () => stopAlarm();
  }, [attentionLevel]);

  // Handle alert acknowledgement
  const handleAcknowledgeAlert = (alertId) => {
    playBeep(600, 0.1, 'sine', 0.15); // Confirmation sound

    if (alertId === null) {
      // Manual reset of generic distraction overlay
      if (isSimulating) {
        setSimState(prev => ({
          ...prev,
          state: 'focused',
          attentionScore: 95,
          yaw: 0,
          pitch: 0,
          ear: 0.26
        }));
      } else {
        // If real camera, stopping alarm temporarily, but operator must look back to fully clear
        stopAlarm();
        setTelemetry(prev => ({
          ...prev,
          detected: true,
          attentionScore: 100,
          state: 'focused',
          yaw: 0,
          pitch: 0,
          ear: 0.25,
          isBlinking: false
        }));
      }
      return;
    }

    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a));

    if (isBackendConnected && activeSessionId) {
      fetch(`http://localhost:8000/api/sessions/${activeSessionId}/alerts/${alertId}/acknowledge`, {
        method: 'PUT'
      }).catch(err => console.error(err));
    }
  };

  // Inject a mock alert into the stream
  const handleTriggerMockAlert = (presetAlert) => {
    playBeep(440, 0.08, 'square', 0.1); // Warning sound
    const newAlert = {
      ...presetAlert,
      id: `mock_${Date.now()}`,
      status: 'active',
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev]);

    if (isBackendConnected && activeSessionId) {
      fetch(`http://localhost:8000/api/sessions/${activeSessionId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: newAlert.id,
          code: newAlert.message.replace(/\s+/g, '_'),
          message: newAlert.description || newAlert.message,
          original_priority: newAlert.priority,
          final_urgency: newAlert.priority === 'critical' ? 90.0 : (newAlert.priority === 'high' ? 60.0 : 20.0)
        })
      }).catch(err => console.error(err));
    }
  };

  // Clear running scenario intervals on toggle
  useEffect(() => {
    if (!isSimulating && scenarioIntervalRef.current) {
      clearInterval(scenarioIntervalRef.current);
      scenarioIntervalRef.current = null;
    }
  }, [isSimulating]);

  // Unified updater for simulator state
  const updateSimValues = (updates) => {
    setSimState(prev => {
      const nextState = { ...prev, ...updates };

      if (updates.attentionScore !== undefined) {
        const score = updates.attentionScore;
        if (score < 30) nextState.state = 'fatigued';
        else if (score < 55) nextState.state = 'distracted';
        else if (score < 75) nextState.state = 'normal';
        else nextState.state = 'focused';
      }

      // Re-evaluate Endsley SA
      const baseScore = nextState.attentionScore ?? 100;
      const sat = nextState.cognitiveSaturation ?? 12;
      const satFactor = (100 - sat) / 100;

      nextState.endsleyL1 = Math.round(Math.max(0, baseScore * (0.3 + 0.7 * satFactor)));
      nextState.endsleyL2 = Math.round(Math.max(0, nextState.endsleyL1 * 0.95 - Math.abs(nextState.yaw ?? 0) * 0.5));
      nextState.endsleyL3 = Math.round(Math.max(0, nextState.endsleyL2 * 0.90 - Math.abs(nextState.pitch ?? 0) * 0.5 - ((nextState.gForce ?? 1.0) - 1.0) * 8));

      return nextState;
    });
  };

  // Scenario 1: Wind Shear
  const triggerWindShear = () => {
    if (scenarioIntervalRef.current) clearInterval(scenarioIntervalRef.current);

    handleTriggerMockAlert({
      id: `pres_windshear_${Date.now()}`,
      message: "WIND SHEAR AHEAD",
      description: "Severe wind shear detected by predictive radar. Escape flight path active.",
      priority: "critical",
      action: "MAX THROTTLE / TOGA DETENT"
    });

    let count = 0;
    const interval = setInterval(() => {
      count++;
      const cycle = count % 4;
      let pitchVal = 12;
      let rollVal = -15;
      let yawVal = 8;

      if (cycle === 1) {
        pitchVal = 16;
        rollVal = 20;
        yawVal = -10;
      } else if (cycle === 2) {
        pitchVal = 8;
        rollVal = -25;
        yawVal = 5;
      } else if (cycle === 3) {
        pitchVal = 14;
        rollVal = 12;
        yawVal = -4;
      }

      updateSimValues({
        scenario: 'wind_shear',
        pitch: pitchVal,
        roll: rollVal,
        yaw: yawVal,
        gForce: parseFloat((2.0 + Math.random() * 1.5).toFixed(1)),
        attentionScore: 85,
        cognitiveSaturation: 75,
        pupilDilation: 4.5
      });

      if (count >= 15) {
        clearInterval(interval);
        updateSimValues({ scenario: 'nominal', gForce: 1.0 });
      }
    }, 500);
    scenarioIntervalRef.current = interval;
  };

  // Scenario 2: Hypoxia
  const triggerHypoxia = () => {
    if (scenarioIntervalRef.current) clearInterval(scenarioIntervalRef.current);

    handleTriggerMockAlert({
      id: `pres_hypoxia_warn_${Date.now()}`,
      message: "CABIN PRESSURE WARNING",
      description: "Cabin altitude exceeds 14,000 FT. Potential slow decompression detected.",
      priority: "high",
      action: "DON OXYGEN MASK"
    });

    let currentScore = simState.attentionScore;
    let currentPupil = simState.pupilDilation;
    let currentSaturation = simState.cognitiveSaturation;
    let currentEar = simState.ear;
    let criticalAlertTriggered = false;

    const interval = setInterval(() => {
      currentScore = Math.max(8, currentScore - 6);
      currentPupil = Math.min(8.0, currentPupil + 0.35);
      currentSaturation = Math.min(100, currentSaturation + 6);
      currentEar = Math.max(0.03, currentEar - 0.02);

      updateSimValues({
        scenario: 'hypoxia',
        attentionScore: currentScore,
        pupilDilation: parseFloat(currentPupil.toFixed(2)),
        cognitiveSaturation: parseFloat(currentSaturation.toFixed(1)),
        ear: parseFloat(currentEar.toFixed(3)),
        isBlinking: currentScore < 50 ? (Math.random() > 0.3) : false,
        yaw: Math.round(simState.yaw + (Math.random() - 0.5) * 4),
        pitch: Math.max(-25, Math.round(simState.pitch - 1))
      });

      if (currentScore <= 28 && !criticalAlertTriggered) {
        criticalAlertTriggered = true;
        handleTriggerMockAlert({
          id: `pres_hypoxia_crit_${Date.now()}`,
          message: "PILOT HYPOXIA HAZARD",
          description: "Operator responsiveness critical. Initiating cockpit interface simplification.",
          priority: "critical",
          action: "ESTABLISH PILOT INTERACTION OR CO-PILOT HANDOFF"
        });
      }

      if (currentScore <= 8) {
        clearInterval(interval);
      }
    }, 800);
    scenarioIntervalRef.current = interval;
  };

  // Scenario 3: Engine Flameout
  const triggerEngineFlameout = () => {
    if (scenarioIntervalRef.current) clearInterval(scenarioIntervalRef.current);

    updateSimValues({
      scenario: 'flameout',
      attentionScore: 92,
      cognitiveSaturation: 82,
      pupilDilation: 5.5,
      yaw: 0,
      pitch: -2,
      gForce: 1.0
    });

    handleTriggerMockAlert({
      id: `pres_flameout_${Date.now()}_1`,
      message: "ENG 1 FLAMEOUT",
      description: "Engine 1 combustion lost. Core RPM (N2) falling below idle.",
      priority: "critical",
      action: "SHUTDOWN ENG 1 / START APU"
    });

    setTimeout(() => {
      handleTriggerMockAlert({
        id: `pres_flameout_${Date.now()}_2`,
        message: "HYD Y SYST FAULT",
        description: "Yellow Hydraulic System pressure low. Engine 1 pump loss.",
        priority: "high",
        action: "ENGAGE ELEC POWER PACK"
      });
    }, 400);

    setTimeout(() => {
      handleTriggerMockAlert({
        id: `pres_flameout_${Date.now()}_3`,
        message: "GEN 1 OFF LINE",
        description: "Generator 1 disconnected. Main AC Bus tie closed automatically.",
        priority: "low",
        action: "MONITOR GALLEY SHEDDING"
      });
    }, 800);
  };

  // Instructor Remote Sync Listener
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === 'cogsync_control_sync') {
        try {
          const syncData = JSON.parse(e.newValue);
          if (!syncData) return;

          if (syncData.type === 'telemetry') {
            setIsSimulating(true);
            if (syncData.value.isSimulating !== undefined) {
              setIsSimulating(syncData.value.isSimulating);
            }
            updateSimValues(syncData.value);
          } else if (syncData.type === 'inject_alert') {
            setIsSimulating(true);
            handleTriggerMockAlert(syncData.value);
          } else if (syncData.type === 'scenario') {
            setIsSimulating(true);
            if (syncData.value === 'wind_shear') {
              triggerWindShear();
            } else if (syncData.value === 'hypoxia') {
              triggerHypoxia();
            } else if (syncData.value === 'flameout') {
              triggerEngineFlameout();
            }
          } else if (syncData.type === 'clear_alerts') {
            setAlerts([]);
          }
        } catch (err) {
          console.error("Failed to parse instructor sync data:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Cleanup scenario intervals on unmount
  useEffect(() => {
    return () => {
      if (scenarioIntervalRef.current) {
        clearInterval(scenarioIntervalRef.current);
      }
    };
  }, []);

  const activeStateClass = telemetry.detected ? `state-${telemetry.state}` : '';

  // Render Instructor Dashboard directly if requested
  if (currentView === 'control') {
    return (
      <InstructorControl
        simState={simState}
        onSimStateChange={setSimState}
        onTriggerMockAlert={handleTriggerMockAlert}
        onTriggerWindShear={triggerWindShear}
        onTriggerHypoxia={triggerHypoxia}
        onTriggerEngineFlameout={triggerEngineFlameout}
        alerts={alerts}
        setAlerts={setAlerts}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />
    );
  }

  return (
    <div className={`app-container theme-${industry} ${activeStateClass} lvl-${attentionLevel}`}>
      {/* Visual edge alert overlays */}
      <div className="attention-pulse-overlay" />

      {/* 1. Header Navigation HUD */}
      <header className="panel-card" style={{
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.7rem 1.5rem', clipPath: 'none', borderBottom: '1px solid var(--border-card)',
        background: 'rgba(5, 8, 20, 0.85)', gap: '1rem', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <ShieldAlert size={28} style={{ color: 'var(--hud-accent)', filter: 'drop-shadow(var(--hud-accent-glow))' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.25rem', letterSpacing: '0.08em', color: '#fff', margin: 0 }}>
              COGNITIVE<span style={{ color: 'var(--hud-accent)' }}>SYNC</span>
            </h1>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginTop: '1px' }}>
              Adaptive Cockpit Intelligence System // TATA INNOVENT
            </span>
          </div>
        </div>

        {/* Console View Mode Switcher */}
        <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
          <button
            className={`industry-tab ${currentView === 'cockpit' ? 'active' : ''}`}
            onClick={() => navigateToView('cockpit')}
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.8rem' }}
          >
            Tactical HUD
          </button>
          <button
            className={`industry-tab ${currentView === 'twin' ? 'active' : ''}`}
            onClick={() => navigateToView('twin')}
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Database size={11} />
            Digital Twin
          </button>
        </div>

        {/* Visor Gaze Lock Switcher */}
        {currentView === 'cockpit' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-hud)', color: visorGazeLock ? 'var(--hud-accent)' : 'var(--text-secondary)', textShadow: visorGazeLock ? 'var(--hud-accent-glow)' : 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Visor Gaze Lock: {visorGazeLock ? 'ENGAGED' : 'DISENGAGED'}
            </span>
            <button
              onClick={() => {
                playBeep(800, 0.08, 'sine', 0.1);
                setVisorGazeLock(!visorGazeLock);
              }}
              className={`industry-tab ${visorGazeLock ? 'active' : ''}`}
              style={{
                fontSize: '0.65rem',
                padding: '0.25rem 0.6rem',
                borderColor: visorGazeLock ? 'var(--hud-accent)' : 'rgba(255,255,255,0.08)',
                background: visorGazeLock ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                color: visorGazeLock ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.3s ease'
              }}
            >
              <Eye size={12} style={{ color: visorGazeLock ? 'var(--hud-accent)' : 'var(--text-secondary)' }} />
              {visorGazeLock ? 'DEACTIVATE' : 'ACTIVATE'}
            </button>
          </div>
        )}

        {/* Info badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }} className={attentionLevel >= 2 ? 'level2-dimmed' : ''}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)' }}>
            <Users size={12} style={{ color: 'var(--hud-accent)' }} />
            <span>CALLSIGN: CLIPPER-204</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)' }}>
            <Clock size={12} style={{ color: 'var(--hud-accent)' }} />
            <span>UTC {systemTime}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      {currentView === 'twin' ? (
        <DigitalTwinDashboard
          activeSessionId={activeSessionId}
          isBackendConnected={isBackendConnected}
          onClose={() => navigateToView('cockpit')}
        />
      ) : (
        <main style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '1rem',
          alignItems: 'stretch',
          overflow: 'hidden'
        }}>
          {/* Left Hand Column (CV Video Tracker + Controls + Visor Indicator) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
            <WebcamTracker 
              onTelemetryUpdate={handleCameraTelemetry} 
              isSimulating={isSimulating}
              activeState={telemetry.state}
              onTrackingStateChange={(isActive) => setIsSimulating(!isActive)}
            />
            <AlertPanel 
              alerts={alerts}
              operatorState={telemetry.state}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              industry={industry}
              attentionLevel={attentionLevel}
              gazeX={telemetry.gazeX}
              gazeY={telemetry.gazeY}
              visorGazeLock={visorGazeLock}
              setVisorGazeLock={setVisorGazeLock}
            />
          </div>

          {/* Right Hand Column (4 Cockpit Screens in a 2x2 grid) */}
          <div 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}
            className={attentionLevel === 3 ? 'level3-bg-blur' : ''}
          >
            <AerospaceCockpit 
              telemetry={telemetry}
              attentionLevel={attentionLevel}
              alerts={alerts}
            />
          </div>
        </main>
      )}

      {/* Edge Warning Banner when Distracted (Level 3) */}
      {telemetry.detected && attentionLevel === 3 && currentView === 'cockpit' && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-distracted)',
          color: '#000', padding: '0.6rem 2rem', fontSize: '0.75rem',
          fontFamily: 'var(--font-hud)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.6rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: '9999', pointerEvents: 'none', letterSpacing: '0.05em',
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          border: '1px solid #fff'
        }}>
          <AlertTriangle size={14} className="animate-bounce" />
          <span>COGNITIVE OVERLOAD INJECTED // FOVEATED PERIPHERAL FOCUS MODULATION</span>
        </div>
      )}
    </div>
  );
}
