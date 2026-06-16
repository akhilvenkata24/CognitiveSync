import React from 'react';
import { Sliders, ToggleLeft, ToggleRight, Radio, Compass, UserCheck } from 'lucide-react';

export default function SimulatorPanel({ 
  isSimulating, 
  onToggleSimulating, 
  simState, 
  onSimStateChange, 
  onTriggerMockAlert,
  onTriggerWindShear,
  onTriggerHypoxia,
  onTriggerEngineFlameout,
  industry 
}) {

  // Unified state updates + dynamic Endsley situational awareness calculations
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
  };

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
    <div className="panel-card" style={{ flex: '0 0 auto' }}>
      <div className="panel-title">
        <Sliders size={16} /> Industry Scenario Simulator
      </div>

      {/* 2. Simulator State Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {/* Sliders for fine-tuning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span>Attention Score</span>
              <span>{simState.attentionScore}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={simState.attentionScore}
              onChange={(e) => updateSimValues({ attentionScore: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
            />
          </div>

          {/* Gaze Simulation Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Eye Gaze X</span>
                <span>{simState.gazeX}°</span>
              </div>
              <input 
                type="range" min="-30" max="30" step="0.5" value={simState.gazeX}
                onChange={(e) => updateSimValues({ gazeX: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Eye Gaze Y</span>
                <span>{simState.gazeY}°</span>
              </div>
              <input 
                type="range" min="-20" max="20" step="0.5" value={simState.gazeY}
                onChange={(e) => updateSimValues({ gazeY: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. Mission Scenario Controls */}
      <div style={{ marginTop: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          Trigger Tactical Cockpit Scenarios:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.8rem' }}>
          <button
            onClick={onTriggerWindShear}
            style={{
              background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.15)',
              color: 'var(--hud-accent)', padding: '0.5rem 0.4rem', borderRadius: '6px', fontSize: '0.7rem',
              cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', transition: 'all 0.2s',
              boxShadow: simState.scenario === 'wind_shear' ? '0 0 10px rgba(0,240,255,0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = simState.scenario === 'wind_shear' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 240, 255, 0.05)';
            }}
          >
            Wind Shear
          </button>
          <button
            onClick={onTriggerHypoxia}
            style={{
              background: 'rgba(213, 0, 249, 0.05)', border: '1px solid rgba(213, 0, 249, 0.15)',
              color: 'var(--color-fatigued)', padding: '0.5rem 0.4rem', borderRadius: '6px', fontSize: '0.7rem',
              cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', transition: 'all 0.2s',
              boxShadow: simState.scenario === 'hypoxia' ? '0 0 10px rgba(213,0,249,0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(213, 0, 249, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = simState.scenario === 'hypoxia' ? 'rgba(213, 0, 249, 0.12)' : 'rgba(213, 0, 249, 0.05)';
            }}
          >
            Hypoxia
          </button>
          <button
            onClick={onTriggerEngineFlameout}
            style={{
              background: 'rgba(255, 23, 68, 0.05)', border: '1px solid rgba(255, 23, 68, 0.15)',
              color: 'var(--color-distracted)', padding: '0.5rem 0.4rem', borderRadius: '6px', fontSize: '0.7rem',
              cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', transition: 'all 0.2s',
              boxShadow: simState.scenario === 'flameout' ? '0 0 10px rgba(255,23,68,0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 23, 68, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = simState.scenario === 'flameout' ? 'rgba(255, 23, 68, 0.12)' : 'rgba(255, 23, 68, 0.05)';
            }}
          >
            Flameout
          </button>
        </div>
      </div>

      {/* 3. Preset Fault Warnings */}
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
