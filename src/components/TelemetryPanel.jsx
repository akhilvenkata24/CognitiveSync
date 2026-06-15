import React from 'react';
import { Shield, Brain, Activity, Compass, Cpu } from 'lucide-react';

import AerospaceCockpit from './industry/AerospaceCockpit';

export default function TelemetryPanel({ telemetry, industry, attentionLevel = 0 }) {
  const {
    attentionScore = 100,
    state = 'focused',
    yaw = 0,
    pitch = 0,
    roll = 0,
    ear = 0.25,
    gazeX = 0,
    gazeY = 0,
    detected = false,
    gForce = 1.0,
    pupilDilation = 3.2,
    cognitiveSaturation = 12.0,
    endsleyL1 = 98,
    endsleyL2 = 95,
    endsleyL3 = 96
  } = telemetry;

  // Calculate Dashoffset for SVG Gauge (Circumference of r=62 is ~389.5)
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attentionScore / 100) * circumference;

  // Status mapping
  const getScoreColor = () => {
    if (state === 'fatigued') return 'var(--color-fatigued)';
    if (state === 'distracted') return 'var(--color-distracted)';
    if (state === 'normal') return 'var(--color-normal)';
    return 'var(--color-focused)';
  };

  const getScoreGlow = () => {
    if (state === 'fatigued') return 'var(--glow-fatigued)';
    if (state === 'distracted') return 'var(--glow-distracted)';
    if (state === 'normal') return 'var(--glow-normal)';
    return 'var(--glow-focused)';
  };

  // Check out of bounds
  const getAngleStyle = (val, max) => {
    return Math.abs(val) > max ? { color: 'var(--color-distracted)' } : { color: 'var(--hud-accent)' };
  };

  const getEarStyle = (val) => {
    return val < 0.18 ? { color: 'var(--color-fatigued)' } : { color: 'var(--hud-accent)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 350px' }}>
      
      {/* 1. Attention Analysis Gauge */}
      <div className="panel-card">
        <div className="panel-title">
          <Brain size={14} /> Cognitive Bandwidth Monitor
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', padding: '0.2rem 0' }}>
          
          <div className="gauge-container">
            <svg className="gauge-svg">
              <defs>
                <filter id="gauge-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle className="gauge-bg" cx="77" cy="77" r={radius} />
              <circle 
                className="gauge-value-path" 
                cx="77" 
                cy="77" 
                r={radius} 
                stroke={getScoreColor()}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter="url(#gauge-glow)"
              />
            </svg>
            <div className="gauge-text">
              <span className="gauge-number" style={{ color: getScoreColor() }}>
                {detected ? attentionScore : '--'}
              </span>
              <span className="gauge-label" style={{ fontSize: '0.55rem' }}>CAPACITY</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', marginBottom: '0.2rem' }}>PILOT COGNITIVE STATE</span>
              <span className={`status-pill ${state}`} style={{ boxShadow: getScoreGlow() }}>
                {detected ? state : 'ACQUIRING SIGNAL'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', marginBottom: '0.2rem' }}>BIOMETRIC SENSOR STREAM</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)', color: detected ? 'var(--color-focused)' : 'var(--color-distracted)' }}>
                {detected ? 'FEED LOCK // 30 FPS' : 'SIGNAL LOSS DETECTED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Biometric Telemetry */}
      <div className={`panel-card ${!detected ? 'suppressed' : ''} ${attentionLevel >= 2 ? 'level2-dimmed' : ''}`}>
        <div className="panel-title">
          <Cpu size={14} /> Eye & Gaze Biometrics
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div className="telemetry-row">
              <span className="telemetry-label">Pitch Yaw Angle</span>
              <span className="telemetry-val" style={getAngleStyle(yaw, 15)}>{yaw}° / {pitch}°</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Roll Rotation</span>
              <span className="telemetry-val" style={getAngleStyle(roll, 15)}>{roll}°</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Eye Blink Index (EAR)</span>
              <span className="telemetry-val" style={getEarStyle(ear)}>{ear.toFixed(3)}</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">G-Force Load</span>
              <span className="telemetry-val" style={{ color: gForce > 4.0 ? 'var(--color-distracted)' : 'var(--hud-accent)' }}>
                {detected ? `${gForce.toFixed(1)}G` : '--'}
              </span>
            </div>
          </div>
          <div>
            <div className="telemetry-row">
              <span className="telemetry-label">Visual Gaze Offset</span>
              <span className="telemetry-val" style={getAngleStyle(gazeX, 12)}>{gazeX}x / {gazeY}y</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Pupil Dilation</span>
              <span className="telemetry-val" style={{ color: pupilDilation > 5.5 ? 'var(--color-fatigued)' : 'var(--hud-accent)' }}>
                {detected ? `${pupilDilation.toFixed(1)}mm` : '--'}
              </span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Cognitive Saturation</span>
              <span className="telemetry-val" style={{ color: cognitiveSaturation > 70 ? 'var(--color-distracted)' : 'var(--hud-accent)' }}>
                {detected ? `${cognitiveSaturation.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Operator Tracker ID</span>
              <span className="telemetry-val">OP-CLIPPER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endsley Situational Awareness Matrix */}
      <div className={`panel-card ${!detected ? 'suppressed' : ''} ${attentionLevel >= 2 ? 'level2-dimmed' : ''}`}>
        <div className="panel-title">
          <Shield size={14} /> Endsley Situational Awareness Matrix
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          
          {/* Level 1: Perception */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>L1: PERCEPTION (SYSTEM SCAN)</span>
              <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--hud-accent)' }}>{detected ? `${endsleyL1}%` : '--'}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: detected ? `${endsleyL1}%` : '0%', 
                height: '100%', 
                background: 'var(--hud-accent)', 
                boxShadow: '0 0 8px var(--hud-accent)',
                transition: 'width 0.4s ease-out' 
              }} />
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Sensor cross-check & gaze coverage lock
            </div>
          </div>

          {/* Level 2: Comprehension */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>L2: COMPREHENSION (STATE CORRELATION)</span>
              <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--color-focused)' }}>{detected ? `${endsleyL2}%` : '--'}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: detected ? `${endsleyL2}%` : '0%', 
                height: '100%', 
                background: 'var(--color-focused)', 
                boxShadow: '0 0 8px var(--color-focused)',
                transition: 'width 0.4s ease-out' 
              }} />
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Mental model matching & telemetry synthesis
            </div>
          </div>

          {/* Level 3: Projection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>L3: PROJECTION (TRAJECTORY FORECAST)</span>
              <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--color-normal)' }}>{detected ? `${endsleyL3}%` : '--'}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: detected ? `${endsleyL3}%` : '0%', 
                height: '100%', 
                background: 'var(--color-normal)', 
                boxShadow: '0 0 8px var(--color-normal)',
                transition: 'width 0.4s ease-out' 
              }} />
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Predictive conflict resolution & future state projection
            </div>
          </div>

        </div>
      </div>

      {/* 3. Industry Console Wrapper */}
      <AerospaceCockpit attentionLevel={attentionLevel} telemetry={telemetry} />

    </div>
  );
}
