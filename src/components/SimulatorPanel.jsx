import React, { useRef, useEffect } from 'react';
import { Sliders, ToggleLeft, ToggleRight, Radio, Compass, UserCheck } from 'lucide-react';

export default function SimulatorPanel({ 
  isSimulating, 
  onToggleSimulating, 
  simState, 
  onSimStateChange, 
  onTriggerMockAlert,
  industry 
}) {
  const scenarioIntervalRef = useRef(null);

  // Clear running scenario interval on unmount
  useEffect(() => {
    return () => {
      if (scenarioIntervalRef.current) {
        clearInterval(scenarioIntervalRef.current);
      }
    };
  }, []);

  // Clear running scenario interval if simulation is toggled off
  useEffect(() => {
    if (!isSimulating && scenarioIntervalRef.current) {
      clearInterval(scenarioIntervalRef.current);
      scenarioIntervalRef.current = null;
    }
  }, [isSimulating]);

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

  // SCENARIO 1: Wind Shear
  const triggerWindShear = () => {
    if (scenarioIntervalRef.current) clearInterval(scenarioIntervalRef.current);
    
    onTriggerMockAlert({
      id: `pres_windshear_${Date.now()}`,
      message: "WIND SHEAR AHEAD",
      description: "Severe wind shear detected by predictive radar. Escape flight path active.",
      priority: "critical",
      action: "MAX THROTTLE / TOGA DETENT"
    });

    let count = 0;
    const interval = setInterval(() => {
      count++;
      // Oscillating turbulence
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

      if (count >= 15) { // Run for 7.5 seconds
        clearInterval(interval);
        updateSimValues({ scenario: 'nominal', gForce: 1.0 });
      }
    }, 500);
    scenarioIntervalRef.current = interval;
  };

  // SCENARIO 2: Hypoxia (forces attention score drop to Level 4 over time)
  const triggerHypoxia = () => {
    if (scenarioIntervalRef.current) clearInterval(scenarioIntervalRef.current);

    onTriggerMockAlert({
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
        pitch: Math.max(-25, Math.round(simState.pitch - 1)) // Head drooping forward
      });

      if (currentScore <= 28 && !criticalAlertTriggered) {
        criticalAlertTriggered = true;
        onTriggerMockAlert({
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

  // SCENARIO 3: Engine Flameout (triggers critical alert queue)
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

    // Cascade of alerts
    onTriggerMockAlert({
      id: `pres_flameout_${Date.now()}_1`,
      message: "ENG 1 FLAMEOUT",
      description: "Engine 1 combustion lost. Core RPM (N2) falling below idle.",
      priority: "critical",
      action: "SHUTDOWN ENG 1 / START APU"
    });

    setTimeout(() => {
      onTriggerMockAlert({
        id: `pres_flameout_${Date.now()}_2`,
        message: "HYD Y SYST FAULT",
        description: "Yellow Hydraulic System pressure low. Engine 1 pump loss.",
        priority: "high",
        action: "ENGAGE ELEC POWER PACK"
      });
    }, 400);

    setTimeout(() => {
      onTriggerMockAlert({
        id: `pres_flameout_${Date.now()}_3`,
        message: "GEN 1 OFF LINE",
        description: "Generator 1 disconnected. Main AC Bus tie closed automatically.",
        priority: "low",
        action: "MONITOR GALLEY SHEDDING"
      });
    }, 800);
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
    <div className="panel-card" style={{ flex: '1 1 300px' }}>
      <div className="panel-title">
        <Sliders size={16} /> Industry Scenario Simulator
      </div>

      {/* 1. Override Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
              onClick={() => updateSimValues({ state: 'focused', attentionScore: 95, yaw: 2, pitch: 1, ear: 0.28, isBlinking: false, gForce: 1.0, pupilDilation: 3.2, cognitiveSaturation: 12.0 })}
            >
              <UserCheck size={14} /> Focused
            </button>
            <button 
              className={`sim-button ${simState.state === 'normal' ? 'active' : ''}`}
              onClick={() => updateSimValues({ state: 'normal', attentionScore: 65, yaw: -8, pitch: 4, ear: 0.22, isBlinking: false, gForce: 1.2, pupilDilation: 3.8, cognitiveSaturation: 35.0 })}
            >
              <Radio size={14} /> Normal
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Head Yaw</span>
                <span>{simState.yaw}°</span>
              </div>
              <input 
                type="range" min="-45" max="45" value={simState.yaw}
                onChange={(e) => updateSimValues({ yaw: parseInt(e.target.value) })}
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
                onChange={(e) => updateSimValues({ pitch: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
          </div>

          {/* New Sliders: G-Force Load, Pupil Dilation, Cognitive Saturation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>G-Force Load</span>
                <span>{simState.gForce ? simState.gForce.toFixed(1) : '1.0'}G</span>
              </div>
              <input 
                type="range" min="0.0" max="9.0" step="0.1" value={simState.gForce ?? 1.0}
                onChange={(e) => updateSimValues({ gForce: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Pupil Dilation</span>
                <span>{simState.pupilDilation ? simState.pupilDilation.toFixed(1) : '3.2'}mm</span>
              </div>
              <input 
                type="range" min="2.0" max="8.0" step="0.1" value={simState.pupilDilation ?? 3.2}
                onChange={(e) => updateSimValues({ pupilDilation: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              <span>Cognitive Saturation</span>
              <span>{simState.cognitiveSaturation ? simState.cognitiveSaturation.toFixed(1) : '12.0'}%</span>
            </div>
            <input 
              type="range" min="0" max="100" step="1" value={simState.cognitiveSaturation ?? 12.0}
              onChange={(e) => updateSimValues({ cognitiveSaturation: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--hud-accent)' }}
            />
          </div>
        </div>
      </div>

      {/* 2.5. Mission Scenario Controls */}
      <div style={{ opacity: isSimulating ? 1 : 0.25, pointerEvents: isSimulating ? 'all' : 'none', transition: 'opacity 0.2s', marginTop: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          Trigger Tactical Cockpit Scenarios:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.8rem' }}>
          <button
            onClick={triggerWindShear}
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
            onClick={triggerHypoxia}
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
            onClick={triggerEngineFlameout}
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
