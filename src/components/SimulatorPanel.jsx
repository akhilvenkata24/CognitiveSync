import React from 'react';
import { Sliders, ToggleLeft, ToggleRight, Radio, Compass, UserCheck } from 'lucide-react';

export default function SimulatorPanel({ 
  isSimulating, 
  onToggleSimulating, 
  simState, 
  onSimStateChange, 
  onTriggerMockAlert,
  industry 
}) {
  
  // Custom mock alerts based on selected industry
  const mockAlertPresets = {
    aerospace: [
      { id: 'pres_a1', message: "TERRAIN PROXIMITY", description: "GPWS radar indicates low ground clearance.", priority: "critical", action: "PULL UP & HOLD" },
      { id: 'pres_a2', message: "AUTOPILOT DISCONNECT", description: "Autopilot disengaged. Restoring manual stick feedback.", priority: "high", action: "TAKE MANUAL CONTROL" },
      { id: 'pres_a3', message: "FUEL TEMP LOW", description: "Wing tank temperature near freezing threshold.", priority: "low", action: "MONITOR DE-ICER" }
    ],
    railways: [
      { id: 'pres_r1', message: "RED SIGNAL OVERRUN", description: "Signal 42B shows absolute stop. Speed exceeds threshold.", priority: "critical", action: "APPLY EMERGENCY BRAKE" },
      { id: 'pres_r2', message: "TRACK FAULT DETECTED", description: "Active telemetry indicates slight switch alignment error.", priority: "high", action: "REDUCE SPEED TO 30KM/H" },
      { id: 'pres_r3', message: "COMMUNICATION LOST", description: "Secondary link to dispatch offline. Failover active.", priority: "low", action: "RESET CAB RADIO" }
    ],
    mining: [
      { id: 'pres_m1', message: "COLLISION PEDESTRIAN", description: "Ground safety radar shows worker in blindspot.", priority: "critical", action: "HALT VEHICLE NOW" },
      { id: 'pres_m2', message: "HAZARD HIGH SLOPE", description: "Lateral tilt exceeds 12-degree grade hazard safety line.", priority: "high", action: "STEER AWAY FROM SLOPE" },
      { id: 'pres_m3', message: "PERFORMANCE WARNING", description: "Engine fuel injector pressure variance outside standard bounds.", priority: "low", action: "SCHEDULE MAINTENANCE" }
    ],
    machinery: [
      { id: 'pres_h1', message: "STEAM CORE OVERPRESSURE", description: "Reactor valve pressure at 94% threshold.", priority: "critical", action: "MANUAL RELEASE VENT" },
      { id: 'pres_h2', message: "HYDRAULIC PUMP LEAK", description: "Main crane cylinder line pressure dropping.", priority: "high", action: "LOCK HYDRAULIC VALVE" },
      { id: 'pres_h3', message: "OIL FILTER clogged", description: "Differential indicator suggests filter replacement due.", priority: "low", action: "MONITOR FLUID TEMP" }
    ]
  };

  const currentPresets = mockAlertPresets[industry] || mockAlertPresets.aerospace;

  return (
    <div className="panel-card" style={{ flex: '1 1 300px' }}>
      <div className="panel-title">
        <Sliders size={16} /> Industry Scenario Simulator
      </div>

      {/* 1. Override Toggle */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={16} style={{ color: 'var(--hud-accent)' }} />
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block' }}>Simulation Mode Override</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Bypasses webcam tracking with mock coordinates</span>
          </div>
        </div>
        <button 
          onClick={onToggleSimulating}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSimulating ? 'var(--hud-accent)' : 'var(--text-muted)' }}
        >
          {isSimulating ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
        </button>
      </div>

      {/* 2. Simulator State Inputs (Enabled only when override active) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', opacity: isSimulating ? 1 : 0.25, pointerEvents: isSimulating ? 'all' : 'none', transition: 'opacity 0.2s' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
            Forced State Selection:
          </span>
          <div className="sim-controls-grid">
            <button 
              className={`sim-button ${simState.state === 'focused' ? 'active' : ''}`}
              onClick={() => onSimStateChange({ ...simState, state: 'focused', attentionScore: 95, yaw: 2, pitch: 1, ear: 0.28, isBlinking: false })}
            >
              <UserCheck size={14} /> Focused
            </button>
            <button 
              className={`sim-button ${simState.state === 'normal' ? 'active' : ''}`}
              onClick={() => onSimStateChange({ ...simState, state: 'normal', attentionScore: 65, yaw: -8, pitch: 4, ear: 0.22, isBlinking: false })}
            >
              <Radio size={14} /> Normal
            </button>
            <button 
              className={`sim-button ${simState.state === 'distracted' ? 'active' : ''}`}
              style={simState.state === 'distracted' ? { background: 'var(--color-distracted)', color: '#fff', borderColor: 'var(--color-distracted)', boxShadow: '0 0 10px rgba(255,23,68,0.3)' } : {}}
              onClick={() => onSimStateChange({ ...simState, state: 'distracted', attentionScore: 28, yaw: 22, pitch: -8, ear: 0.25, isBlinking: false })}
            >
              Distracted
            </button>
            <button 
              className={`sim-button ${simState.state === 'fatigued' ? 'active' : ''}`}
              style={simState.state === 'fatigued' ? { background: 'var(--color-fatigued)', color: '#fff', borderColor: 'var(--color-fatigued)', boxShadow: '0 0 10px rgba(213,0,249,0.3)' } : {}}
              onClick={() => onSimStateChange({ ...simState, state: 'fatigued', attentionScore: 12, yaw: 4, pitch: -15, ear: 0.04, isBlinking: true })}
            >
              Fatigued
            </button>
          </div>
        </div>

        {/* Sliders for fine-tuning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span>Attention Score</span>
              <span>{simState.attentionScore}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={simState.attentionScore}
              onChange={(e) => {
                const score = parseInt(e.target.value);
                let state = 'focused';
                if (score < 42) state = 'distracted';
                else if (score < 72) state = 'normal';
                onSimStateChange({ ...simState, attentionScore: score, state });
              }}
              style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Head Yaw</span>
                <span>{simState.yaw}°</span>
              </div>
              <input 
                type="range" min="-45" max="45" value={simState.yaw}
                onChange={(e) => onSimStateChange({ ...simState, yaw: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Head Pitch</span>
                <span>{simState.pitch}°</span>
              </div>
              <input 
                type="range" min="-30" max="30" value={simState.pitch}
                onChange={(e) => onSimStateChange({ ...simState, pitch: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Preset Alert Injectors */}
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          Inject Industry Fault Warnings:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {currentPresets.map((preset, index) => (
            <button
              key={preset.id}
              onClick={() => onTriggerMockAlert(preset)}
              style={{
                display: 'flex', justifyItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <span>{preset.message}</span>
              <span style={{
                fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                background: preset.priority === 'critical' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(255, 145, 0, 0.15)',
                color: preset.priority === 'critical' ? 'var(--color-distracted)' : 'var(--color-normal)'
              }}>
                {preset.priority.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
