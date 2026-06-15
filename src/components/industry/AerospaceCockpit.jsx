import React, { useEffect, useRef, useState } from 'react';
import { Plane, ShieldAlert, CloudRain, Activity, Radio, AlertTriangle, Compass } from 'lucide-react';

export default function AerospaceCockpit({ attentionLevel, telemetry }) {
  const { yaw = 0, pitch = 0, roll = 0, attentionScore = 100, state = 'focused' } = telemetry;
  const canvasRef = useRef(null);
  
  // Simulated flight instrument states that auto-drift
  const [airspeed, setAirspeed] = useState(250);
  const [altitude, setAltitude] = useState(33000);
  const [throttle, setThrottle] = useState(84.5);
  const [fuelFlow, setFuelFlow] = useState(2840);
  const [vibration, setVibration] = useState(1.1);
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);

  // Generate stable intruder TCAS traffic locations
  const [tcasTargets] = useState([
    { id: 1, relX: 18, relY: -22, altDiff: '+700', label: 'TGT-048' },
    { id: 2, relX: -35, relY: 40, altDiff: '-1200', label: 'TGT-192' }
  ]);

  // Keep a reference to latest telemetry to avoid recreate canvas loop listeners
  const telemetryRef = useRef({ yaw, pitch, roll, attentionScore });
  useEffect(() => {
    telemetryRef.current = { yaw, pitch, roll, attentionScore };
  }, [yaw, pitch, roll, attentionScore]);

  // Auto-update flight telemetry numbers to make it feel alive
  useEffect(() => {
    const timer = setInterval(() => {
      setAirspeed(prev => {
        const drift = (Math.random() - 0.5) * 0.4;
        return parseFloat((prev + drift).toFixed(1));
      });
      setAltitude(prev => {
        const drift = (Math.random() - 0.5) * 4;
        return Math.round(prev + drift);
      });
      setThrottle(prev => {
        const drift = (Math.random() - 0.5) * 0.1;
        return parseFloat(Math.min(100, Math.max(0, prev + drift)).toFixed(1));
      });
      setFuelFlow(prev => {
        const drift = (Math.random() - 0.5) * 5;
        return Math.round(prev + drift);
      });
      setVibration(prev => {
        const drift = (Math.random() - 0.5) * 0.02;
        return parseFloat(Math.min(3.0, Math.max(0.1, prev + drift)).toFixed(2));
      });
      // Sweeping radar angle increment
      setRadarSweepAngle(prev => (prev + 2) % 360);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // HTML5 Canvas 60fps Render Loop: 3D Flight Tunnel & PFD Horizon HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    // 3D waypoint tunnel rings definition
    const tunnelRings = [];
    for (let i = 0; i < 8; i++) {
      tunnelRings.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 20,
        z: i * 40 + 20
      });
    }

    const render = () => {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear with dark space backdrop
      ctx.fillStyle = '#02040c';
      ctx.fillRect(0, 0, w, h);

      // Extract current head telemetry state
      const currentYaw = telemetryRef.current.yaw;
      const currentPitch = telemetryRef.current.pitch;
      const currentRoll = telemetryRef.current.roll;
      const currentAttn = telemetryRef.current.attentionScore;

      const centerX = w / 2;
      const centerY = h / 2;

      // Draw cyber background grids (cyber tech layout)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw 3D Waypoint Flight Path Tunnel in the Sky
      ctx.lineWidth = 1.5;
      for (let i = tunnelRings.length - 1; i >= 0; i--) {
        const ring = tunnelRings[i];
        
        // Move ring closer along Z axis
        ring.z -= 0.8;
        if (ring.z <= 1) {
          ring.z = 320; // reset to far distance
          ring.x = (Math.random() - 0.5) * 30;
          ring.y = (Math.random() - 0.5) * 20;
        }

        // Perspective Projection equations
        const scale = 220 / ring.z;
        // Adjust center based on pilot yaw and pitch offsets to simulate 3D gaze parallax
        const rx = centerX + (ring.x - currentYaw * 0.8) * scale;
        const ry = centerY + (ring.y + currentPitch * 0.8) * scale;
        const ringSize = 25 * scale;

        if (ring.z > 5 && rx > 0 && rx < w && ry > 0 && ry < h) {
          // Color fades based on depth (z index)
          const opacity = Math.min(1.0, (320 - ring.z) / 200) * 0.8;
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          
          // Draw wireframe hexagon for the 3D tunnel flight ring
          ctx.beginPath();
          for (let side = 0; side < 6; side++) {
            const angle = (side * Math.PI) / 3;
            const px = rx + Math.cos(angle) * ringSize;
            const py = ry + Math.sin(angle) * ringSize;
            if (side === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          // Connect waypoints to show flight trajectory lines
          if (i > 0) {
            const nextRing = tunnelRings[i - 1];
            const nextScale = 220 / nextRing.z;
            const nrx = centerX + (nextRing.x - currentYaw * 0.8) * nextScale;
            const nry = centerY + (nextRing.y + currentPitch * 0.8) * nextScale;
            
            ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 0.25})`;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(nrx, nry);
            ctx.stroke();
          }
        }
      }

      // ==============================================================
      // DRAW ARTIFICIAL HORIZON (Rotated scale based on head roll)
      // ==============================================================
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Apply pilot's roll rotation
      const radRoll = (currentRoll * Math.PI) / 180;
      ctx.rotate(-radRoll);

      // Apply pilot's pitch offset translation
      const pitchOffset = currentPitch * 1.8;
      ctx.translate(0, pitchOffset);

      // Sky gradient (Top half)
      const skyGrad = ctx.createLinearGradient(0, -h, 0, 0);
      skyGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      skyGrad.addColorStop(1, 'rgba(0, 240, 255, 0.01)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-w, -h * 2, w * 2, h * 2);

      // Ground gradient (Bottom half)
      const groundGrad = ctx.createLinearGradient(0, 0, 0, h);
      groundGrad.addColorStop(0, 'rgba(255, 145, 0, 0.01)');
      groundGrad.addColorStop(1, 'rgba(255, 145, 0, 0.1)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-w, 0, w * 2, h * 2);

      // Ground horizon separation line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();

      // Pitch Ladder Marks (+20, +10, -10, -20)
      ctx.lineWidth = 1;
      const drawPitchLine = (yVal, textVal, isPositive) => {
        const color = isPositive ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 145, 0, 0.5)';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.font = '8px Share Tech Mono';

        // Left mark
        ctx.beginPath();
        ctx.moveTo(-50, yVal);
        ctx.lineTo(-20, yVal);
        ctx.lineTo(-20, yVal + (isPositive ? 4 : -4));
        ctx.stroke();
        ctx.fillText(textVal, -65, yVal + 3);

        // Right mark
        ctx.beginPath();
        ctx.moveTo(50, yVal);
        ctx.lineTo(20, yVal);
        ctx.lineTo(20, yVal + (isPositive ? 4 : -4));
        ctx.stroke();
        ctx.fillText(textVal, 55, yVal + 3);
      };

      drawPitchLine(-45, '+10°', true);
      drawPitchLine(-90, '+20°', true);
      drawPitchLine(45, '-10°', false);
      drawPitchLine(90, '-20°', false);

      ctx.restore();

      // ==============================================================
      // STATIC HUD RETICLE FOREGROUND
      // ==============================================================
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--hud-accent)';
      
      // Central aircraft reference symbol
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY);
      ctx.lineTo(centerX - 15, centerY);
      ctx.lineTo(centerX - 10, centerY + 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 35, centerY);
      ctx.lineTo(centerX + 15, centerY);
      ctx.lineTo(centerX + 10, centerY + 8);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = 'var(--hud-accent)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2.5, 0, 2 * Math.PI);
      ctx.fill();

      // Compass Heading Scale (Top of PFD)
      ctx.fillStyle = '#010309';
      ctx.fillRect(0, 0, w, 22);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(w, 22);
      ctx.stroke();

      // Draw sliding heading scale marks
      const baseHdg = (270 + currentYaw) % 360;
      ctx.font = '8px Share Tech Mono';
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.textAlign = 'center';
      
      for (let offset = -180; offset <= 180; offset += 10) {
        const angleVal = Math.round((baseHdg + offset + 360) % 360);
        const xPos = centerX + offset * 1.5;
        if (xPos >= 0 && xPos <= w) {
          ctx.beginPath();
          ctx.moveTo(xPos, 22);
          ctx.lineTo(xPos, angleVal % 30 === 0 ? 12 : 17);
          ctx.stroke();
          
          if (angleVal % 30 === 0) {
            let label = angleVal;
            if (angleVal === 0) label = 'N';
            else if (angleVal === 90) label = 'E';
            else if (angleVal === 180) label = 'S';
            else if (angleVal === 270) label = 'W';
            ctx.fillText(label.toString(), xPos, 10);
          }
        }
      }

      // Compass center pointer arrow
      ctx.fillStyle = 'var(--hud-accent)';
      ctx.beginPath();
      ctx.moveTo(centerX, 22);
      ctx.lineTo(centerX - 4, 28);
      ctx.lineTo(centerX + 4, 28);
      ctx.closePath();
      ctx.fill();

      // PFD Mode overlay tag
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.strokeStyle = 'var(--hud-accent)';
      ctx.lineWidth = 1;
      ctx.fillRect(10, 28, 70, 14);
      ctx.strokeRect(10, 28, 70, 14);
      
      ctx.font = '7px Share Tech Mono';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText('COGNITIVE LOCK', 15, 38);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Class definitions for widgets depending on attention levels
  const getAdaptiveClass = (priority) => {
    if (attentionLevel === 3) {
      return priority === 'critical' ? 'cockpit-adaptive-maximize' : 'cockpit-adaptive-fade';
    }
    if (attentionLevel === 2) {
      return priority === 'critical' ? '' : 'cockpit-adaptive-slate';
    }
    return '';
  };

  // SVG circular dial calculator
  const getSVGDialOffset = (val, max) => {
    const r = 24;
    const c = 2 * Math.PI * r;
    return c - (val / max) * c;
  };

  return (
    <div className="glass-cockpit-container">
      
      {/* ==========================================
          1. FLIGHT MODE ANNUNCIATOR (FMA) SYSTEM
         ========================================== */}
      <div className="glass-cockpit-fma">
        <div className="fma-section">
          <span className={`fma-mode active-green ${attentionLevel >= 2 ? 'cockpit-adaptive-slate' : ''}`}>THR LVR</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span className={`fma-mode active-cyan ${attentionLevel >= 2 ? 'cockpit-adaptive-slate' : ''}`}>HDG SEL</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span className={`fma-mode active-green ${attentionLevel >= 2 ? 'cockpit-adaptive-slate' : ''}`}>VNAV LOCK</span>
        </div>
        <div className="fma-section" style={{ fontFamily: 'var(--font-ui)', fontWeight: 'bold' }}>
          <span style={{ color: attentionLevel >= 3 ? '#ff1744' : 'var(--text-secondary)' }}>AP1 ENGAGED</span>
        </div>
        <div className="fma-section">
          {attentionLevel >= 3 ? (
            <span className="fma-mode active-amber" style={{ color: '#ff1744', borderColor: '#ff1744' }}>
              COGNITIVE DRIFT // MASTER CAUTION
            </span>
          ) : (
            <span className="fma-mode active-cyan">COGNITIVE SYNC LOCK</span>
          )}
        </div>
      </div>

      <div className="glass-cockpit-grid">
        
        {/* ==========================================
            2. PRIMARY FLIGHT DISPLAY (PFD) HUD WIDGET
           ========================================== */}
        <div 
          className={`glass-cockpit-card ${getAdaptiveClass('critical')}`}
          style={{ gridColumn: '1 / span 2', height: '240px' }}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {attentionLevel >= 3 && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Compass size={13} className="glow-icon" style={{ color: 'var(--hud-accent)' }} /> 
              PRIMARY HUD // 3D VECTOR FLIGHT PATH
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>UTC FEED LOCK</span>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
            {/* 60fps HTML5 Canvas display */}
            <canvas 
              ref={canvasRef} 
              width={650} 
              height={200} 
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Left Airspeed scroll tape */}
            <div style={{
              position: 'absolute', left: '8px', top: '30px', bottom: '15px', width: '38px',
              borderRight: '1px solid rgba(0,240,255,0.2)', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--hud-accent)', zIndex: 10,
              background: 'rgba(2,4,10,0.5)', paddingRight: '2px'
            }}>
              <span>{Math.round(airspeed + 20)}</span>
              <span style={{ background: 'rgba(0, 240, 255, 0.2)', borderLeft: '2px solid #fff', paddingLeft: '2px', fontWeight: 'bold' }}>
                {Math.round(airspeed)}
              </span>
              <span>{Math.round(airspeed - 20)}</span>
            </div>

            {/* Right Altitude scroll tape */}
            <div style={{
              position: 'absolute', right: '8px', top: '30px', bottom: '15px', width: '45px',
              borderLeft: '1px solid rgba(0,240,255,0.2)', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--hud-accent)', zIndex: 10,
              background: 'rgba(2,4,10,0.5)', paddingLeft: '2px', textAlign: 'right'
            }}>
              <span>{altitude + 100}</span>
              <span style={{ background: 'rgba(0, 240, 255, 0.2)', borderRight: '2px solid #fff', paddingRight: '2px', fontWeight: 'bold' }}>
                {altitude}
              </span>
              <span>{altitude - 100}</span>
            </div>

            {/* Foveated center warning prompt when pilot attention is fatigued/distracted */}
            {attentionLevel >= 3 && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(2,0,5,0.95)', border: '2px solid #ff1744', boxShadow: '0 0 20px #ff1744',
                color: '#ff1744', padding: '0.6rem 1.5rem', fontFamily: 'var(--font-hud)', fontSize: '0.85rem',
                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 20,
                borderRadius: '4px', letterSpacing: '0.08em', animation: 'blink 0.8s infinite'
              }}>
                <AlertTriangle size={14} />
                <span>PILOT ATTENTION DROP // FOCUS HUD CONSOLE</span>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            3. TCAS TRAFFIC PROXIMITY SYSTEM (CRITICAL)
           ========================================== */}
        <div 
          className={`glass-cockpit-card ${getAdaptiveClass('critical')} ${attentionLevel >= 1 ? 'level1-highlight-alert' : ''}`}
          style={{ transition: 'all 0.5s' }}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {attentionLevel >= 3 && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldAlert size={13} style={{ color: '#ff1744' }} /> 
              TCAS COLLISION AVOIDANCE
            </span>
            <span style={{ color: '#ff1744', fontSize: '0.6rem', animation: 'blink 1s infinite' }}>WARN INTRUDER</span>
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', height: '95px', marginTop: '0.2rem' }}>
            {/* Tactical Radar Display */}
            <div style={{
              position: 'relative', width: '85px', height: '85px', borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <div style={{ width: '55px', height: '55px', border: '1px dashed rgba(0,240,255,0.1)', borderRadius: '50%', position: 'absolute' }} />
              <div style={{ width: '25px', height: '25px', border: '1px solid rgba(0,240,255,0.08)', borderRadius: '50%', position: 'absolute' }} />
              <Plane size={14} style={{ color: 'var(--hud-accent)', transform: 'rotate(-45deg)' }} />

              {/* Sweeping Radar Line */}
              <div 
                className="radar-sweep" 
                style={{ 
                  transform: `rotate(${radarSweepAngle}deg)`, 
                  transformOrigin: '50% 50%',
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(0,240,255,0.2) 0deg, transparent 80deg)',
                  width: '100%', height: '100%', position: 'absolute', borderRadius: '50%', border: 'none'
                }} 
              />

              {/* Intruder targets blips */}
              {tcasTargets.map(tgt => (
                <div 
                  key={tgt.id}
                  style={{
                    width: '6px', height: '6px', background: '#ff1744', borderRadius: '50%',
                    position: 'absolute', top: `calc(50% + ${tgt.relY}px)`, left: `calc(50% + ${tgt.relX}px)`,
                    boxShadow: '0 0 10px #ff1744', animation: 'blink 0.8s infinite'
                  }}
                  title={`${tgt.label} alt: ${tgt.altDiff}`}
                />
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>Proximity Alert Matrix</span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', color: '#ff1744', display: 'block', fontWeight: 'bold' }}>
                TRAFFIC DETECTED: +700FT
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block', marginTop: '1px' }}>
                RANGE: 1.8 NM | CLOSURE: 410 kts
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block' }}>
                CMD: CLIMB RATE &gt; 1500 FT/MIN
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            4. NAVIGATION COMPASS & WEATHER RADAR
           ========================================== */}
        <div className={`glass-cockpit-card ${getAdaptiveClass('high')}`}>
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CloudRain size={13} style={{ color: 'var(--hud-accent)' }} /> 
              NAVIGATION / WEATHER SYSTEM
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>MODE: WX+T</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '95px', marginTop: '0.2rem' }}>
            {/* Weather Radar display */}
            <div style={{
              position: 'relative', width: '85px', height: '85px', borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden', flexShrink: 0
            }}>
              {/* Compass ticks */}
              <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', width: '70px', height: '70px', borderRadius: '50%', position: 'absolute', top: '7px', left: '7px' }} />
              <div style={{ border: '1px dashed rgba(0, 240, 255, 0.1)', width: '40px', height: '40px', borderRadius: '50%', position: 'absolute', top: '22px', left: '22px' }} />
              
              {/* Simulated Storm cell circles */}
              <div style={{
                position: 'absolute', top: '15px', left: '42px', width: '22px', height: '22px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,23,68,0.3) 0%, rgba(255,145,0,0.15) 60%, transparent 100%)'
              }} />
              <div style={{
                position: 'absolute', top: '38px', left: '15px', width: '28px', height: '18px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.2) 0%, rgba(0,230,118,0.05) 75%, transparent 100%)'
              }} />

              {/* Sweeping scanline */}
              <div 
                className="radar-sweep" 
                style={{ 
                  transform: `rotate(${radarSweepAngle}deg)`, 
                  transformOrigin: '50% 50%',
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(255,145,0,0.1) 0deg, transparent 90deg)',
                  width: '100%', height: '100%', position: 'absolute', borderRadius: '50%', border: 'none'
                }} 
              />
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>Storm Tracking Mode</span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--hud-accent)', display: 'block', fontWeight: 'bold' }}>
                HEAVY RADAR ECHO AHEAD
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block', marginTop: '1px' }}>
                CELL CELL-A9: 14 NM | HEADING: 095°
              </span>
              <span style={{ fontSize: '0.62rem', color: '#ff9100', fontFamily: 'var(--font-hud)', display: 'block' }}>
                WARN: TURBULENCE INDEX MODERATE
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            5. ENGINE MONITORING DECK (EICAS)
           ========================================== */}
        <div className={`glass-cockpit-card ${getAdaptiveClass('medium')}`}>
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={13} style={{ color: 'var(--hud-accent)' }} /> 
              EICAS TURBINE TELEMETRY
            </span>
          </div>

          <div className="eicas-ring-container">
            {/* ENG 1 dial */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <svg className="dial-circle-svg">
                <circle className="dial-track" cx="30" cy="30" r="24" />
                <circle 
                  className="dial-fill" 
                  cx="30" 
                  cy="30" 
                  r="24" 
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={getSVGDialOffset(throttle, 100)}
                />
              </svg>
              <div style={{ position: 'absolute', top: '15px', textAlign: 'center', width: '100%' }}>
                <span className="dial-value-text">{Math.round(throttle)}%</span>
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontFamily: 'var(--font-hud)' }}>N1 ENG 1</span>
            </div>

            {/* ENG 2 dial */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <svg className="dial-circle-svg">
                <circle className="dial-track" cx="30" cy="30" r="24" />
                <circle 
                  className="dial-fill" 
                  cx="30" 
                  cy="30" 
                  r="24" 
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={getSVGDialOffset(throttle - 0.2, 100)}
                />
              </svg>
              <div style={{ position: 'absolute', top: '15px', textAlign: 'center', width: '100%' }}>
                <span className="dial-value-text">{Math.round(throttle - 0.2)}%</span>
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontFamily: 'var(--font-hud)' }}>N1 ENG 2</span>
            </div>

            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>ITT TEMP:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>682°C</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>VIB LEVEL:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{vibration} IPS</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>FUEL TEMP:</span> <span style={{ color: '#00e676', fontWeight: 'bold' }}>+14°C</span></div>
            </div>
          </div>
        </div>

        {/* ==========================================
            6. FUEL & PROPULSION MANAGEMENT
           ========================================== */}
        <div className={`glass-cockpit-card ${getAdaptiveClass('medium')}`}>
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Plane size={13} style={{ color: 'var(--hud-accent)' }} /> 
              FUEL SYSTEMS DECK
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', height: '62px', marginTop: '0.3rem' }}>
            <div style={{ flex: 1 }}>
              <div className="telemetry-row" style={{ padding: '0.2rem 0' }}>
                <span className="telemetry-label">Left Outer Tank</span>
                <span className="telemetry-val">4,280 lbs</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.2rem 0' }}>
                <span className="telemetry-label">Right Outer Tank</span>
                <span className="telemetry-val">4,290 lbs</span>
              </div>
            </div>
            <div style={{
              background: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.12)',
              padding: '0.4rem', borderRadius: '4px', textAlign: 'center', minWidth: '85px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>FUEL FLOW RATE</span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--hud-accent)', fontWeight: 'bold' }}>
                {fuelFlow} lb/h
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            7. ATC RADIO & VOICE COMMS LINK
           ========================================== */}
        <div className={`glass-cockpit-card ${getAdaptiveClass('low')}`}>
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Radio size={13} style={{ color: 'var(--hud-accent)' }} /> 
              ATC COMMUNICATION LINK
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '0.45rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}>
            <div style={{ color: 'var(--hud-accent)', fontSize: '0.58rem', fontWeight: 'bold', fontFamily: 'var(--font-hud)' }}>KJFK DEP LINK // PRIMARY</div>
            <div style={{ color: '#fff', fontStyle: 'italic', lineHeight: '1.3', fontFamily: 'var(--font-ui)' }}>
              "Clipper 204, climb and maintain flight level three three zero, contact departure on one two six point eight."
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
