import React, { useState } from 'react';
import { Sliders, Activity, ShieldAlert, Zap, PlusCircle, Trash2, UserCheck, Compass } from 'lucide-react';

export default function InstructorControl({
  simState,
  onSimStateChange,
  onTriggerMockAlert,
  onTriggerWindShear,
  onTriggerHypoxia,
  onTriggerEngineFlameout,
  alerts,
  setAlerts,
  isSimulating,
  setIsSimulating
}) {
  const [customMsg, setCustomMsg] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPriority, setCustomPriority] = useState('high');
  const [customAction, setCustomAction] = useState('');

  // Sync state changes back to pilot tab via localStorage
  const broadcastTelemetry = (updatedState) => {
    localStorage.setItem('cogsync_control_sync', JSON.stringify({
      type: 'telemetry',
      value: updatedState,
      timestamp: Date.now()
    }));
  };

  const broadcastScenario = (scenarioName) => {
    localStorage.setItem('cogsync_control_sync', JSON.stringify({
      type: 'scenario',
      value: scenarioName,
      timestamp: Date.now()
    }));
  };

  const broadcastAlert = (alertData) => {
    localStorage.setItem('cogsync_control_sync', JSON.stringify({
      type: 'inject_alert',
      value: alertData,
      timestamp: Date.now()
    }));
  };

  const broadcastClear = () => {
    localStorage.setItem('cogsync_control_sync', JSON.stringify({
      type: 'clear_alerts',
      timestamp: Date.now()
    }));
  };

  const updateSimValues = (updates) => {
    const nextState = { ...simState, ...updates };
    
    // Automatically determine state if attentionScore was changed
    if (updates.attentionScore !== undefined) {
      const score = updates.attentionScore;
      if (score < 30) nextState.state = 'fatigued';
      else if (score < 55) nextState.state = 'distracted';
      else if (score < 75) nextState.state = 'normal';
      else nextState.state = 'focused';
    }

    // Recalculate Endsley levels based on attention score, cognitive saturation, head positions, and G-force load
    const baseScore = nextState.attentionScore ?? 100;
    const sat = nextState.cognitiveSaturation ?? 12;
    const satFactor = (100 - sat) / 100; // 0 to 1
    
    const l1 = Math.round(Math.max(0, baseScore * (0.3 + 0.7 * satFactor)));
    const l2 = Math.round(Math.max(0, l1 * 0.95 - Math.abs(nextState.yaw ?? 0) * 0.5));
    const l3 = Math.round(Math.max(0, l2 * 0.90 - Math.abs(nextState.pitch ?? 0) * 0.5 - ((nextState.gForce ?? 1.0) - 1.0) * 8));

    nextState.endsleyL1 = l1;
    nextState.endsleyL2 = l2;
    nextState.endsleyL3 = l3;

    onSimStateChange(nextState);
    broadcastTelemetry(nextState);
  };

  // Preset Alert list for fast injection
  const presets = [
    { message: "ENG 2 FIRE", description: "Turbine tailpipe temp exceeds EGT safety limit.", priority: "critical", action: "DISCHARGE ENG 2 FIRE BOT" },
    { message: "PITOT ICING DETECT", description: "Primary airspeed sensors reporting signal discrepancy.", priority: "high", action: "ENGAGE STBY PROBE HEAT" },
    { message: "FUEL LEAK WING", description: "Fuel flow asymmetry detected in right tank valves.", priority: "high", action: "OPEN CROSSFEED VALVE" },
    { message: "AUTO PILOT FAILURE", description: "Pitch servo discrepancy detected. Disengaging systems.", priority: "high", action: "FLY Stick manually" },
    { message: "HYD OIL DISCREPANCY", description: "Hydraulic blue system fluid quantity low.", priority: "low", action: "MONITOR FLUIDS TANK" }
  ];

  const handleInjectCustomAlert = (e) => {
    e.preventDefault();
    if (!customMsg) return;

    const newAlert = {
      message: customMsg.toUpperCase(),
      description: customDesc || "Manual custom alert injected by instructor console.",
      priority: customPriority,
      action: customAction.toUpperCase() || "MONITOR HUD READOUT"
    };

    onTriggerMockAlert(newAlert);
    broadcastAlert(newAlert);

    // Reset fields
    setCustomMsg('');
    setCustomDesc('');
    setCustomAction('');
  };

  const handleInjectPreset = (preset) => {
    onTriggerMockAlert(preset);
    broadcastAlert(preset);
  };

  const triggerScenarioLocal = (name, triggerFn) => {
    setIsSimulating(true);
    triggerFn();
    broadcastScenario(name);
  };

  const handleClearAlertsLocal = () => {
    setAlerts([]);
    broadcastClear();
  };

  return (
    <div style={{ padding: '1.5rem', background: '#020308', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-ui)', color: '#fff' }}>
      
      {/* 1. Header */}
      <header className="panel-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.5rem', clipPath: 'none', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', background: 'rgba(5, 8, 20, 0.95)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-hud)', fontSize: '1.4rem', letterSpacing: '0.08em', color: '#ff9100', margin: 0, textShadow: '0 0 10px rgba(255,145,0,0.3)' }}>
            COGNITIVESYNC // INSTRUCTOR CONSOLE
          </h1>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginTop: '1px' }}>
            Mission Control Center & Tactical Scenario Injector
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <Activity size={12} style={{ color: '#ff9100' }} />
            <span>CROSS-TAB IPC STREAM: <strong style={{ color: '#00e676' }}>ACTIVE</strong></span>
          </div>
          <button
            onClick={() => {
              const nextSim = !isSimulating;
              setIsSimulating(nextSim);
              broadcastTelemetry({ isSimulating: nextSim });
            }}
            className={`industry-tab ${isSimulating ? 'active' : ''}`}
            style={{ fontSize: '0.65rem', padding: '0.3rem 0.8rem', background: isSimulating ? '#ff9100' : 'rgba(0,0,0,0.3)', color: isSimulating ? '#000' : '#fff', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {isSimulating ? 'OVERRIDE ON' : 'ACTIVATE OVERRIDE'}
          </button>
        </div>
      </header>

      {/* 2. Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', flex: 1 }}>
        
        {/* Column 1: Pilot Biometrics & State Overrides */}
        <div className="panel-card" style={{ gap: '0.8rem' }}>
          <div className="panel-title" style={{ color: '#ff9100', borderBottomColor: 'rgba(255, 145, 0, 0.15)', textShadow: '0 0 8px rgba(255, 145, 0, 0.4)' }}>
            <Sliders size={14} /> Biometric & State Overrides
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Forced Cognitive State:
            </span>
            <div className="sim-controls-grid">
              <button 
                className={`sim-button ${simState.state === 'focused' ? 'active' : ''}`}
                onClick={() => updateSimValues({ state: 'focused', attentionScore: 95, yaw: 2, pitch: 1, ear: 0.28, isBlinking: false, gForce: 1.0, pupilDilation: 3.2, cognitiveSaturation: 12.0 })}
              >
                Focused
              </button>
              <button 
                className={`sim-button ${simState.state === 'normal' ? 'active' : ''}`}
                onClick={() => updateSimValues({ state: 'normal', attentionScore: 65, yaw: -8, pitch: 4, ear: 0.22, isBlinking: false, gForce: 1.2, pupilDilation: 3.8, cognitiveSaturation: 35.0 })}
              >
                Normal
              </button>
              <button 
                className={`sim-button ${simState.state === 'distracted' ? 'active' : ''}`}
                style={simState.state === 'distracted' ? { background: 'var(--color-distracted)', color: '#fff', borderColor: 'var(--color-distracted)', boxShadow: '0 0 10px rgba(255,23,68,0.3)' } : {}}
                onClick={() => updateSimValues({ state: 'distracted', attentionScore: 28, yaw: 22, pitch: -8, ear: 0.25, isBlinking: false, gForce: 1.0, pupilDilation: 4.8, cognitiveSaturation: 60.0 })}
              >
                Distracted
              </button>
              <button 
                className={`sim-button ${simState.state === 'fatigued' ? 'active' : ''}`}
                style={simState.state === 'fatigued' ? { background: 'var(--color-fatigued)', color: '#fff', borderColor: 'var(--color-fatigued)', boxShadow: '0 0 10px rgba(213,0,249,0.3)' } : {}}
                onClick={() => updateSimValues({ state: 'fatigued', attentionScore: 12, yaw: 4, pitch: -15, ear: 0.04, isBlinking: true, gForce: 1.0, pupilDilation: 5.8, cognitiveSaturation: 85.0 })}
              >
                Fatigued
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.4rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Attention Score</span>
                <span style={{ color: '#fff' }}>{simState.attentionScore}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={simState.attentionScore}
                onChange={(e) => updateSimValues({ attentionScore: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#ff9100' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>Head Yaw</span>
                  <span style={{ color: '#fff' }}>{simState.yaw}°</span>
                </div>
                <input 
                  type="range" min="-45" max="45" value={simState.yaw}
                  onChange={(e) => updateSimValues({ yaw: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ff9100' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>Head Pitch</span>
                  <span style={{ color: '#fff' }}>{simState.pitch}°</span>
                </div>
                <input 
                  type="range" min="-30" max="30" value={simState.pitch}
                  onChange={(e) => updateSimValues({ pitch: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ff9100' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>G-Force Load</span>
                  <span style={{ color: '#fff' }}>{simState.gForce ? simState.gForce.toFixed(1) : '1.0'}G</span>
                </div>
                <input 
                  type="range" min="0.0" max="9.0" step="0.1" value={simState.gForce ?? 1.0}
                  onChange={(e) => updateSimValues({ gForce: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ff9100' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span>Pupil Size</span>
                  <span style={{ color: '#fff' }}>{simState.pupilDilation ? simState.pupilDilation.toFixed(1) : '3.2'}mm</span>
                </div>
                <input 
                  type="range" min="2.0" max="8.0" step="0.1" value={simState.pupilDilation ?? 3.2}
                  onChange={(e) => updateSimValues({ pupilDilation: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ff9100' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Cognitive Saturation</span>
                <span style={{ color: '#fff' }}>{simState.cognitiveSaturation ? simState.cognitiveSaturation.toFixed(1) : '12.0'}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="1" value={simState.cognitiveSaturation ?? 12.0}
                onChange={(e) => updateSimValues({ cognitiveSaturation: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#ff9100' }}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Cockpit Scenario Injections */}
        <div className="panel-card" style={{ gap: '0.8rem' }}>
          <div className="panel-title" style={{ color: '#ff9100', borderBottomColor: 'rgba(255, 145, 0, 0.15)', textShadow: '0 0 8px rgba(255, 145, 0, 0.4)' }}>
            <Zap size={14} /> Mission Scenario Injections
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            Activate crisis sequences on the cockpit console in real-time:
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              onClick={() => triggerScenarioLocal('wind_shear', onTriggerWindShear)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: simState.scenario === 'wind_shear' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                color: 'var(--hud-accent)', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.8rem',
                cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s',
                boxShadow: simState.scenario === 'wind_shear' ? '0 0 15px rgba(0,240,255,0.2)' : 'none'
              }}
            >
              <div>
                <span style={{ display: 'block' }}>WIND SHEAR TURBULENCE</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Oscillates aircraft telemetry & flight compass</span>
              </div>
              <Compass size={18} />
            </button>

            <button
              onClick={() => triggerScenarioLocal('hypoxia', onTriggerHypoxia)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: simState.scenario === 'hypoxia' ? 'rgba(213, 0, 249, 0.12)' : 'rgba(213, 0, 249, 0.05)',
                border: '1px solid rgba(213, 0, 249, 0.25)',
                color: 'var(--color-fatigued)', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.8rem',
                cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s',
                boxShadow: simState.scenario === 'hypoxia' ? '0 0 15px rgba(213,0,249,0.2)' : 'none'
              }}
            >
              <div>
                <span style={{ display: 'block' }}>PILOT HYPOXIA</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Decays attention level over time down to Level 4</span>
              </div>
              <Activity size={18} />
            </button>

            <button
              onClick={() => triggerScenarioLocal('flameout', onTriggerEngineFlameout)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: simState.scenario === 'flameout' ? 'rgba(255, 23, 68, 0.12)' : 'rgba(255, 23, 68, 0.05)',
                border: '1px solid rgba(255, 23, 68, 0.25)',
                color: 'var(--color-distracted)', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.8rem',
                cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s',
                boxShadow: simState.scenario === 'flameout' ? '0 0 15px rgba(255,23,68,0.2)' : 'none'
              }}
            >
              <div>
                <span style={{ display: 'block' }}>ENGINE 1 FLAMEOUT</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Triggers cascading engine / hydraulic warning lines</span>
              </div>
              <ShieldAlert size={18} />
            </button>
          </div>
        </div>

        {/* Column 3: Threat & Alert Controller */}
        <div className="panel-card" style={{ gap: '0.8rem' }}>
          <div className="panel-title" style={{ color: '#ff9100', borderBottomColor: 'rgba(255, 145, 0, 0.15)', textShadow: '0 0 8px rgba(255, 145, 0, 0.4)' }}>
            <ShieldAlert size={14} /> Alert & Fault Injector
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Inject Quick Faults:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInjectPreset(preset)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: preset.priority === 'critical' ? 'var(--color-distracted)' : '#fff',
                    padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  +{preset.message}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleInjectCustomAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
              Create Custom Warning:
            </span>

            <input 
              type="text" placeholder="ALERT CODE (e.g. GEARBOX OIL TEMP)" value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)} required
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.4rem', fontSize: '0.7rem', color: '#fff', fontFamily: 'var(--font-hud)' }}
            />

            <input 
              type="text" placeholder="Description (e.g. Main reduction gear temp critical.)" value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.4rem', fontSize: '0.7rem', color: '#fff' }}
            />

            <input 
              type="text" placeholder="Action instruction (e.g. REDUCE ENG 2 OVERBOOST)" value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.4rem', fontSize: '0.7rem', color: '#fff', fontFamily: 'var(--font-hud)' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Priority:</span>
              <select 
                value={customPriority} onChange={(e) => setCustomPriority(e.target.value)}
                style={{ background: '#020308', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.2rem', fontSize: '0.65rem', color: '#fff' }}
              >
                <option value="critical">Critical (Red)</option>
                <option value="high">High (Orange)</option>
                <option value="low">Low (Cyan)</option>
              </select>
              
              <button 
                type="submit"
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: '#ff9100', color: '#000', border: 'none', borderRadius: '4px',
                  padding: '0.3rem 0.8rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Inject Fault
              </button>
            </div>
          </form>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Active Pilot Threats ({alerts.length}):
              </span>
              <button 
                onClick={handleClearAlertsLocal}
                style={{ background: 'none', border: 'none', color: '#ff1744', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontFamily: 'var(--font-hud)' }}
              >
                <Trash2 size={12} /> Clear Alerts
              </button>
            </div>
            
            <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {alerts.length === 0 ? (
                <span style={{ fontSize: '0.65rem', color: '#00e676', textAlign: 'center', display: 'block', padding: '0.5rem' }}>
                  ✓ Pilot console has zero active alerts
                </span>
              ) : (
                alerts.map((al, idx) => (
                  <div key={al.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.5rem', borderRadius: '4px', borderLeft: `3px solid ${al.priority === 'critical' ? 'var(--color-distracted)' : (al.priority === 'high' ? 'var(--color-normal)' : 'var(--hud-accent)')}` }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', color: '#fff' }}>{al.message}</span>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>{al.description}</span>
                    </div>
                    <span style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                      {al.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Footer warning info */}
      <footer style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.8rem' }}>
        COGNITIVESYNC HACKATHON COMPANION // OPEN THIS LINK IN A SEPARATE BROWSER TAB OR ON ANOTHER DEVICE AND TRIGGER ALERTS SIDE-BY-SIDE.
      </footer>
    </div>
  );
}
