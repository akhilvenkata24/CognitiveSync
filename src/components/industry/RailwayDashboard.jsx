import React from 'react';
import { Eye, Shield, HelpCircle, TrafficCone, Compass, AlertTriangle, Radio, CloudRain } from 'lucide-react';

export default function RailwayDashboard({ attentionLevel, telemetry }) {
  const { state = 'focused' } = telemetry;

  // Widget Priorities:
  // Low: Communication Messages (Dimmed at lvl 2, hidden at lvl 3)
  // Medium: Weather Alerts (Dimmed at lvl 2, blurred/faded at lvl 3)
  // High: Speed Restrictions, Track Condition Alerts (Glows at lvl 1, bright at lvl 2, blurred at lvl 3)
  // Critical: Signal Status (Glows at lvl 1, remains clear at lvl 2, expands at lvl 3)

  const getWidgetClass = (priority) => {
    if (attentionLevel >= 2 && priority === 'low') return 'level2-dimmed';
    if (attentionLevel >= 2 && priority === 'medium') return 'level2-dimmed';
    if (attentionLevel === 3 && priority !== 'critical') return 'level3-bg-blur';
    return '';
  };

  const getWidgetStyle = (priority) => {
    if (attentionLevel >= 3 && priority === 'low') return { display: 'none' };
    return {};
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: '1' }}>
      
      {/* 1. Signal Status (CRITICAL PRIORITY) */}
      <div 
        className={`panel-card ${getWidgetClass('critical')} ${attentionLevel >= 1 ? 'level1-highlight-alert' : ''}`}
        style={{ gridColumn: attentionLevel === 3 ? '1 / span 2' : 'auto', transition: 'all 0.5s' }}
      >
        <div className="panel-title">
          <TrafficCone size={16} /> Track Signal Aspect Status
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', height: '100px' }}>
          {/* Signal Aspect Light Display */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.3rem',
            background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: attentionLevel === 3 ? '#ff1744' : '#00e676',
              boxShadow: attentionLevel === 3 ? '0 0 12px #ff1744' : '0 0 10px #00e676'
            }} />
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: attentionLevel === 1 ? 'var(--color-normal)' : 'rgba(0,0,0,0.2)',
              boxShadow: attentionLevel === 1 ? '0 0 8px var(--color-normal)' : 'none'
            }} />
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: attentionLevel === 0 || attentionLevel === 2 ? '#00e676' : 'rgba(0,0,0,0.2)',
              boxShadow: attentionLevel === 0 || attentionLevel === 2 ? '0 0 8px #00e676' : 'none'
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>UPCOMING ASPECT</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', color: attentionLevel === 3 ? '#ff1744' : '#00e676', display: 'block', fontWeight: 'bold' }}>
              {attentionLevel === 3 ? 'STOP ASPECT AHEAD (42B)' : 'CLEAR PROCEED'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Distance to signal: 840 meters | Speed: 118 km/h
            </span>
          </div>
        </div>
        {attentionLevel === 3 && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--color-distracted)',
            padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontFamily: 'var(--font-hud)',
            color: 'var(--color-distracted)', fontSize: '0.8rem', fontWeight: 'bold', animation: 'blink 1.2s infinite'
          }}>
            WARNING: TRAIN VELOCITY EXCEEDS BRAKING CURVE // APPLY BRAKES
          </div>
        )}
      </div>

      {/* 2. Speed Restrictions (HIGH PRIORITY) */}
      <div 
        className={`panel-card ${getWidgetClass('high')} ${attentionLevel === 1 ? 'level1-highlight-alert' : ''}`}
        style={getWidgetStyle('high')}
      >
        <div className="panel-title">
          <Compass size={16} /> Velocity Speed Limits
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Speed</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 'bold', color: 'var(--hud-accent)' }}>
              118 km/h
            </span>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Active Speed Limit</span>
            <span className="telemetry-val" style={{ color: 'var(--color-normal)' }}>120 km/h</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '98%', background: 'var(--color-normal)' }} />
          </div>
        </div>
      </div>

      {/* 3. Track Condition Alerts (HIGH PRIORITY) */}
      <div 
        className={`panel-card ${getWidgetClass('high')} ${attentionLevel === 1 ? 'level1-highlight-alert' : ''}`}
        style={getWidgetStyle('high')}
      >
        <div className="panel-title">
          <AlertTriangle size={16} /> Switch Switch Alignments
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className="telemetry-row">
            <span className="telemetry-label">Main Switch 04</span>
            <span className="telemetry-val" style={{ color: 'var(--color-focused)' }}>ALIGNED (NORMAL)</span>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Curve Radius Ahead</span>
            <span className="telemetry-val">R=800m (Grade 0%)</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Forward obstacle clearance scanner: CLEAR (1.2 km)
          </div>
        </div>
      </div>

      {/* 4. Weather Alerts (MEDIUM PRIORITY) */}
      <div className={`panel-card ${getWidgetClass('medium')}`} style={getWidgetStyle('medium')}>
        <div className="panel-title">
          <CloudRain size={16} /> Weather & Line Visibility
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="telemetry-row">
              <span className="telemetry-label">Track Visibility</span>
              <span className="telemetry-val">Excellent (98%)</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Wind Speed</span>
              <span className="telemetry-val">12 kts (Crosswind)</span>
            </div>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)',
            padding: '0.4rem', borderRadius: '4px', textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>RAINFALL</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: 'var(--hud-accent)', fontWeight: 'bold' }}>
              0.0 mm/h
            </span>
          </div>
        </div>
      </div>

      {/* 5. Communication Messages (LOW PRIORITY) */}
      <div className={`panel-card ${getWidgetClass('low')}`} style={getWidgetStyle('low')}>
        <div className="panel-title">
          <Radio size={16} /> Dispatcher Cab Radio Logs
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>
          <div style={{ color: 'var(--hud-accent)', fontSize: '0.6rem', fontWeight: 'bold' }}>TRAIN CONTROL CENTER // 14:42:01</div>
          <div style={{ color: '#fff', fontStyle: 'italic', lineHeight: '1.3' }}>
            "Express 402, proceed on track 2. Switch 04 switch confirmed green, hold speed limit at speed curve limit."
          </div>
        </div>
      </div>

    </div>
  );
}
