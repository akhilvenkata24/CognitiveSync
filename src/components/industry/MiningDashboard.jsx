import React from 'react';
import { Eye, Shield, Users, Fuel, Compass, AlertTriangle, Truck } from 'lucide-react';

export default function MiningDashboard({ attentionLevel, telemetry }) {
  const { gazeX = 0, gazeY = 0, detected = false } = telemetry;

  // Widget Priorities:
  // Low: Equipment Load Status (Dimmed at lvl 2, hidden at lvl 3)
  // Medium: Fuel Monitoring, Vehicle Health (Dimmed at lvl 2, blurred/faded at lvl 3)
  // High: Terrain Hazard Alerts (Glows at lvl 1, bright at lvl 2, blurred at lvl 3)
  // Critical: Worker Proximity Alerts (Glows at lvl 1, remains clear at lvl 2, expands at lvl 3)

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
      
      {/* 1. Worker Proximity Alerts (CRITICAL PRIORITY) */}
      <div 
        className={`panel-card ${getWidgetClass('critical')} ${attentionLevel >= 1 ? 'level1-highlight-alert' : ''}`}
        style={{ gridColumn: attentionLevel === 3 ? '1 / span 2' : 'auto', transition: 'all 0.5s' }}
      >
        <div className="panel-title">
          <Users size={16} /> Pedestrian Worker Proximity Radar
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '100px' }}>
          <div className="radar-wrapper" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
            <div className="radar-sweep" />
            <div className="radar-circle radar-c1" />
            <div className="radar-circle radar-c2" />
            {/* Flashing worker blip */}
            <div style={{
              width: '8px', height: '8px', background: '#ff1744', borderRadius: '50%',
              position: 'absolute', top: '25%', left: '30%', boxShadow: '0 0 10px #ff1744',
              animation: 'blink 0.8s infinite'
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>PEDESTRIAN IN BLINDSPOT</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', color: '#ff1744', display: 'block', fontWeight: 'bold' }}>
              WORKER DETECTED (ZONE B)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Distance: 3.2m | Velocity: 1.2 m/s
            </span>
          </div>
        </div>
        {attentionLevel === 3 && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--color-distracted)',
            padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontFamily: 'var(--font-hud)',
            color: 'var(--color-distracted)', fontSize: '0.8rem', fontWeight: 'bold', animation: 'blink 1.2s infinite'
          }}>
            WARNING: PEDESTRIAN DETECTED IN BLINDSPOT // STOP VEHICLE IMMEDIATELY
          </div>
        )}
      </div>

      {/* 2. Terrain Hazard Alerts - Slope (HIGH PRIORITY) */}
      <div 
        className={`panel-card ${getWidgetClass('high')} ${attentionLevel === 1 ? 'level1-highlight-alert' : ''}`}
        style={getWidgetStyle('high')}
      >
        <div className="panel-title">
          <Compass size={16} /> Inclinometer Slope Hazard
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Lateral Tilt Grade</span>
            <span style={{ color: 'var(--color-normal)', fontFamily: 'var(--font-hud)', fontWeight: 'bold' }}>
              14.2° (LIMIT: 15°)
            </span>
          </div>
          <div style={{
            width: '100%', height: '50px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: '80%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
              {/* Dynamic tilt indicator bar */}
              <div style={{
                position: 'absolute', left: '70%', top: '-8px', width: '2px', height: '20px',
                background: 'var(--color-normal)', boxShadow: '0 0 8px var(--color-normal)'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-normal)', textAlign: 'center', display: 'block' }}>
            APPROACHING LATERAL GRADE SAFETY LIMIT
          </span>
        </div>
      </div>

      {/* 3. Vehicle Health (MEDIUM PRIORITY) */}
      <div className={`panel-card ${getWidgetClass('medium')}`} style={getWidgetStyle('medium')}>
        <div className="panel-title">
          <Shield size={16} /> Hydraulic Brake Pressure
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Front Cylinder Press.</span>
              <span className="telemetry-val">162 Bar</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '75%', background: 'var(--hud-accent)' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rear Cylinder Press.</span>
              <span className="telemetry-val">158 Bar</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '72%', background: 'var(--hud-accent)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>Oil Temp: 82°C</span>
            <span>Brake Wear: 42% Remaining</span>
          </div>
        </div>
      </div>

      {/* 4. Fuel Monitoring (MEDIUM PRIORITY) */}
      <div className={`panel-card ${getWidgetClass('medium')}`} style={getWidgetStyle('medium')}>
        <div className="panel-title">
          <Fuel size={16} /> Diesel Fuel Monitor
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="telemetry-row">
              <span className="telemetry-label">Tank Level</span>
              <span className="telemetry-val">420 Liters</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-label">Capacity</span>
              <span className="telemetry-val">65% Fuel remaining</span>
            </div>
          </div>
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)',
            padding: '0.4rem', borderRadius: '4px', textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', display: 'block' }}>FLOW RATE</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: 'var(--hud-accent)', fontWeight: 'bold' }}>
              32 L/h
            </span>
          </div>
        </div>
      </div>

      {/* 5. Equipment Load Status (LOW PRIORITY) */}
      <div className={`panel-card ${getWidgetClass('low')}`} style={getWidgetStyle('low')}>
        <div className="panel-title">
          <Truck size={16} /> CAT 797 Dump Payload
        </div>
        <div style={{ fontSize: '0.75rem' }}>
          <div className="telemetry-row">
            <span className="telemetry-label">Cargo Weight</span>
            <span className="telemetry-val">238 Tons</span>
          </div>
          <div className="telemetry-row">
            <span className="telemetry-label">Max Capacity</span>
            <span style={{ color: 'var(--hud-accent)' }}>250 Tons (95% Loaded)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>Material: Copper Ore</span>
            <span>Scale Status: Calibrated</span>
          </div>
        </div>
      </div>

    </div>
  );
}
