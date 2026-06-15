import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Compass, Users, Clock, AlertTriangle, Database } from 'lucide-react';
import WebcamTracker from './components/WebcamTracker';
import TelemetryPanel from './components/TelemetryPanel';
import AlertPanel from './components/AlertPanel';
import SimulatorPanel from './components/SimulatorPanel';
import DigitalTwinDashboard from './components/DigitalTwinDashboard';
import { startAlarm, stopAlarm, playBeep } from './audio';

// Default presets for alerts on load to showcase adaptive overlay
const initialAlertPresets = {
  aerospace: [
    { id: 'al_a1', message: "AUTOPILOT DISCONNECT", description: "Autopilot disengaged. Restoring manual stick feedback.", priority: "high", action: "TAKE MANUAL CONTROL", status: "active" },
    { id: 'al_a2', message: "FUEL TEMP LOW", description: "Wing tank temperature near freezing threshold.", priority: "low", action: "MONITOR DE-ICER", status: "active" }
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname === '/twin' ? 'twin' : 'cockpit';
  });

  const navigateToView = (view) => {
    setCurrentView(view);
    if (view === 'twin') {
      window.history.pushState({}, '', '/twin');
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
      setCurrentView(window.location.pathname === '/twin' ? 'twin' : 'cockpit');
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

  const activeStateClass = telemetry.detected ? `state-${telemetry.state}` : '';

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
        <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
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
        />
      ) : (
        <main style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'stretch',
          overflow: 'hidden'
        }}>
          {/* Left Hand Column (CV Video Tracker + Controls) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
            <WebcamTracker 
              onTelemetryUpdate={handleCameraTelemetry} 
              isSimulating={isSimulating}
              activeState={telemetry.state}
            />
            <SimulatorPanel 
              isSimulating={isSimulating}
              onToggleSimulating={() => setIsSimulating(!isSimulating)}
              simState={simState}
              onSimStateChange={setSimState}
              onTriggerMockAlert={handleTriggerMockAlert}
              industry={industry}
            />
          </div>

          {/* Right Hand Column (Telemetry gauges + Active alerts list) */}
          <div 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}
            className={attentionLevel === 3 ? 'level3-bg-blur' : ''}
          >
            <TelemetryPanel 
              telemetry={telemetry}
              industry={industry}
              attentionLevel={attentionLevel}
            />
            <AlertPanel 
              alerts={alerts}
              operatorState={telemetry.state}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              industry={industry}
              attentionLevel={attentionLevel}
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
