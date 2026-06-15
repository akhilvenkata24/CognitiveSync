import React, { useEffect, useRef, useState } from 'react';
import { Plane, ShieldAlert, CloudRain, Activity, Radio, AlertTriangle, Compass, Eye } from 'lucide-react';

export default function AerospaceCockpit({ attentionLevel, telemetry }) {
  const { 
    yaw = 0, 
    pitch = 0, 
    roll = 0, 
    attentionScore = 100, 
    state = 'focused',
    gForce = 1.0,
    pupilDilation = 3.2,
    cognitiveSaturation = 12.0,
    endsleyL1 = 98,
    endsleyL2 = 95,
    endsleyL3 = 96,
    gazeX = 0,
    gazeY = 0
  } = telemetry;

  const canvasRef = useRef(null);
  const gazeHistoryRef = useRef([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Simulated flight values
  const [airspeed, setAirspeed] = useState(250);
  const [altitude, setAltitude] = useState(33000);
  const [throttle, setThrottle] = useState(84.5);
  const [fuelFlow, setFuelFlow] = useState(2840);
  const [vibration, setVibration] = useState(1.1);
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);

  // Dynamic state variables to remove static cockpit details
  const [leftFuel, setLeftFuel] = useState(4280.0);
  const [rightFuel, setRightFuel] = useState(4290.0);
  const [ittTemp, setIttTemp] = useState(682);
  const [fuelTemp, setFuelTemp] = useState(14);
  const [weatherDistance, setWeatherDistance] = useState(14.2);
  const [weatherHeading, setWeatherHeading] = useState(95);
  const [stormWarning, setStormWarning] = useState("WARN: TURBULENCE INDEX MODERATE");

  // Dynamic TCAS Targets
  const [tcasTargets, setTcasTargets] = useState([
    { id: 1, relX: 18, relY: -22, altDiff: 700, label: 'TGT-048', range: 1.8, closure: 410 },
    { id: 2, relX: -35, relY: 40, altDiff: -1200, label: 'TGT-192', range: 4.2, closure: 380 }
  ]);

  // ARINC 429 Data stream state
  const [arincFeed, setArincFeed] = useState([
    "310 LAT ENCODE: 40°44.22'N  [HEX: 310A74FB]",
    "311 LON ENCODE: 073°59.10'W [HEX: 31102A8C]",
    "150 BARO ALT: 33,004 FT     [HEX: 1500F8BC]",
    "270 MASTER CAUTION: NOMINAL [HEX: 270000FF]"
  ]);

  // Keep a reference to latest telemetry to avoid recreates
  const telemetryRef = useRef({ yaw, pitch, roll, attentionScore, gazeX, gazeY });
  useEffect(() => {
    telemetryRef.current = { yaw, pitch, roll, attentionScore, gazeX, gazeY };
    
    // Maintain gaze history trail (last 15 frames)
    const history = gazeHistoryRef.current;
    history.push({ x: gazeX, y: gazeY, time: Date.now() });
    if (history.length > 15) {
      history.shift();
    }
  }, [yaw, pitch, roll, attentionScore, gazeX, gazeY]);

  // Ref to track dynamic parameters to avoid interval stale closures
  const statsRef = useRef({ throttle, fuelFlow, altitude });
  useEffect(() => {
    statsRef.current = { throttle, fuelFlow, altitude };
  }, [throttle, fuelFlow, altitude]);

  // Simulate active variables & ARINC 429 streams
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
      setRadarSweepAngle(prev => (prev + 2.5) % 360);

      // Fluctuate turbine ITT temperature based on current throttle
      setIttTemp(prev => {
        const baseItt = 520 + statsRef.current.throttle * 2.1;
        const drift = (Math.random() - 0.5) * 3;
        return Math.round(baseItt + drift);
      });

      // Decrease fuel based on fuel flow rate (tick is 120ms, which is 0.12s)
      setLeftFuel(prev => {
        const burn = (statsRef.current.fuelFlow / 3600) * 0.12;
        return parseFloat(Math.max(0, prev - burn / 2).toFixed(1));
      });
      setRightFuel(prev => {
        const burn = (statsRef.current.fuelFlow / 3600) * 0.12;
        return parseFloat(Math.max(0, prev - burn / 2).toFixed(1));
      });

      // Fluctuate fuel temp slightly based on altitude
      setFuelTemp(prev => {
        const targetTemp = Math.round(15 - (statsRef.current.altitude / 8000));
        const drift = (Math.random() - 0.5) * 0.5;
        return Math.round(targetTemp + drift);
      });

      // Fluctuate weather storm values
      setWeatherDistance(prev => {
        const drift = (Math.random() - 0.5) * 0.08;
        return parseFloat(Math.max(2.0, prev + drift).toFixed(1));
      });
      setWeatherHeading(prev => {
        const drift = (Math.random() - 0.5) * 0.15;
        return Math.round(Math.max(0, Math.min(360, prev + drift)));
      });
      setStormWarning(prev => {
        if (Math.random() < 0.05) {
          const warnings = [
            "WARN: TURBULENCE INDEX MODERATE",
            "WARN: CONVECTIVE STORM CELL DETECTED",
            "NOTICE: RADAR REFLECTIVITY ELEVATED",
            "INFO: PRECIP LEVEL NOMINAL FL330"
          ];
          return warnings[Math.floor(Math.random() * warnings.length)];
        }
        return prev;
      });

      // Drift TCAS Targets dynamically
      setTcasTargets(prev => prev.map(tgt => {
        let dx = (Math.random() - 0.5) * 0.3;
        let dy = (Math.random() - 0.5) * 0.3;
        
        // Target 1 slowly drifts toward center (intruder!)
        if (tgt.id === 1) {
          dx = -0.15;
          dy = 0.15;
        } else {
          dx = 0.08;
          dy = -0.08;
        }

        let newX = tgt.relX + dx;
        let newY = tgt.relY + dy;

        // Reset if they touch center or leave bounds
        if (Math.abs(newX) < 4 && Math.abs(newY) < 4) {
          newX = (Math.random() > 0.5 ? 35 : -35);
          newY = (Math.random() > 0.5 ? 35 : -35);
        } else if (Math.abs(newX) > 42 || Math.abs(newY) > 42) {
          newX = (Math.random() > 0.5 ? 20 : -20);
          newY = (Math.random() > 0.5 ? 20 : -20);
        }

        const calculatedRange = parseFloat((Math.sqrt(newX*newX + newY*newY) / 15).toFixed(1));
        const calculatedClosure = Math.round(390 + (Math.random() - 0.5) * 30);

        return {
          ...tgt,
          relX: parseFloat(newX.toFixed(1)),
          relY: parseFloat(newY.toFixed(1)),
          range: calculatedRange,
          closure: calculatedClosure,
          altDiff: tgt.altDiff + Math.round((Math.random() - 0.5) * 6)
        };
      }));

      // Periodically update ARINC 429 lines
      setArincFeed(prev => {
        const newFeed = [...prev];
        newFeed.shift();
        
        // Randomize which label updates
        const rand = Math.random();
        let newLine = "";
        if (rand < 0.25) {
          const hexVal = (Math.floor(Math.random() * 65535)).toString(16).toUpperCase().padStart(4, '0');
          newLine = `310 LAT ENCODE: 40°44.${Math.floor(Math.random()*99)}'N  [HEX: 310A${hexVal}]`;
        } else if (rand < 0.50) {
          const hexVal = (Math.floor(Math.random() * 65535)).toString(16).toUpperCase().padStart(4, '0');
          newLine = `311 LON ENCODE: 073°59.${Math.floor(Math.random()*99)}'W [HEX: 3110${hexVal}]`;
        } else if (rand < 0.75) {
          const hexVal = Math.round(33000 + (Math.random() - 0.5) * 200).toString(16).toUpperCase().padStart(4, '0');
          newLine = `150 BARO ALT: ${33000 + Math.round((Math.random()-0.5)*200)} FT     [HEX: 1500${hexVal}]`;
        } else {
          const hexVal = attentionLevel >= 3 ? "FF005500" : "000000FF";
          const status = attentionLevel >= 3 ? "COGNITIVE DISRUPT" : "NOMINAL";
          newLine = `270 WARNING BUS: ${status} [HEX: 270${hexVal}]`;
        }
        
        newFeed.push(newLine);
        return newFeed;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [attentionLevel]);

  // HTML5 Canvas Render Loop: 3D Perspective Terrain & Horizon HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Perspective wireframe grid parameters
    const gridRows = 9;
    const gridCols = 10;
    let terrainScroll = 0;

    const render = () => {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      // Clear Canvas
      ctx.fillStyle = '#02040c';
      ctx.fillRect(0, 0, w, h);

      // Extract telemetry values
      const currentYaw = telemetryRef.current.yaw;
      const currentPitch = telemetryRef.current.pitch;
      const currentRoll = telemetryRef.current.roll;
      const currentGazeX = telemetryRef.current.gazeX;
      const currentGazeY = telemetryRef.current.gazeY;

      // Draw background tactical grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 25;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // ==============================================================
      // DRAW 3D PERSPECTIVE WIREFRAME TERRAIN & PFD HORIZON
      // ==============================================================
      ctx.save();
      ctx.translate(centerX, centerY);

      // Roll Rotation
      const radRoll = (currentRoll * Math.PI) / 180;
      ctx.rotate(-radRoll);

      // Pitch Offset Translation
      const pitchOffset = currentPitch * 2.0;
      ctx.translate(0, pitchOffset);

      // Draw sky color fill
      const skyGrad = ctx.createLinearGradient(0, -h, 0, 0);
      skyGrad.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
      skyGrad.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-w, -h * 2, w * 2, h * 2);

      // Draw 3D wireframe grid ground below the horizon (y > 0)
      ctx.lineWidth = 1;
      terrainScroll = (terrainScroll + 0.6) % 35; // scroll speed
      
      const spacingY = 24;

      // Draw perspective columns
      for (let col = -gridCols; col <= gridCols; col++) {
        const xHorizon = col * 8 - currentYaw * 0.8;
        const xScreenBase = col * 90 - currentYaw * 2.5;

        ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0.01, 1 - Math.abs(col) / gridCols) * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(xHorizon, 0);
        ctx.lineTo(xScreenBase, h);
        ctx.stroke();
      }

      // Draw perspective rows
      for (let row = 0; row < gridRows; row++) {
        const relativeY = row * spacingY + terrainScroll;
        const scale = relativeY / h;
        const py = relativeY * scale;
        
        if (py > 0 && py < h) {
          const opacity = Math.max(0.01, (1.0 - py / h)) * 0.35;
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;

          ctx.beginPath();
          ctx.moveTo(-w, py);
          ctx.lineTo(w, py);
          ctx.stroke();
        }
      }

      // Horizon separator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-160, 0);
      ctx.lineTo(160, 0);
      ctx.stroke();

      // Pitch scale marks
      const drawPitchLadderLine = (yVal, labelText, isPositive) => {
        const color = isPositive ? 'rgba(0, 240, 255, 0.55)' : 'rgba(255, 145, 0, 0.55)';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.font = '8px Share Tech Mono';

        // Left mark
        ctx.beginPath();
        ctx.moveTo(-50, yVal);
        ctx.lineTo(-20, yVal);
        ctx.lineTo(-20, yVal + (isPositive ? 4 : -4));
        ctx.stroke();
        ctx.fillText(labelText, -65, yVal + 3);

        // Right mark
        ctx.beginPath();
        ctx.moveTo(50, yVal);
        ctx.lineTo(20, yVal);
        ctx.lineTo(20, yVal + (isPositive ? 4 : -4));
        ctx.stroke();
        ctx.fillText(labelText, 55, yVal + 3);
      };

      drawPitchLadderLine(-40, '+10°', true);
      drawPitchLadderLine(-80, '+20°', true);
      drawPitchLadderLine(40, '-10°', false);
      drawPitchLadderLine(80, '-20°', false);

      ctx.restore();

      // ==============================================================
      // STATIC HUD RETICLE FOREGROUND
      // ==============================================================
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--hud-accent)';
      
      // Central aircraft reference mark
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

      // Compass Heading scale
      ctx.fillStyle = '#010309';
      ctx.fillRect(0, 0, w, 22);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(w, 22);
      ctx.stroke();

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

      // Compass arrow pointer
      ctx.fillStyle = 'var(--hud-accent)';
      ctx.beginPath();
      ctx.moveTo(centerX, 22);
      ctx.lineTo(centerX - 4, 28);
      ctx.lineTo(centerX + 4, 28);
      ctx.closePath();
      ctx.fill();

      // ==============================================================
      // EYE ATTENTION HEATMAP OVERLAY
      // ==============================================================
      if (showHeatmap) {
        const history = gazeHistoryRef.current;
        if (history.length > 1) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(213, 0, 249, 0.25)'; // Magenta trail
          ctx.beginPath();
          history.forEach((pt, idx) => {
            const cx = centerX + (pt.x * (centerX / 15));
            const cy = centerY - (pt.y * (centerY / 15));
            if (idx === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
          });
          ctx.stroke();

          history.forEach((pt, idx) => {
            const cx = centerX + (pt.x * (centerX / 15));
            const cy = centerY - (pt.y * (centerY / 15));
            
            const op = (idx / history.length) * 0.4;
            const r = 15 + (idx / history.length) * 20;

            const radialGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
            radialGrad.addColorStop(0, `rgba(255, 23, 68, ${op})`);
            radialGrad.addColorStop(0.5, `rgba(255, 145, 0, ${op * 0.5})`);
            radialGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
            
            ctx.fillStyle = radialGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showHeatmap]);

  const getAdaptiveClass = (priority) => {
    if (attentionLevel === 3) {
      return priority === 'critical' ? 'cockpit-adaptive-maximize' : 'cockpit-adaptive-fade';
    }
    if (attentionLevel === 2) {
      return priority === 'critical' ? '' : 'cockpit-adaptive-slate';
    }
    return '';
  };

  const getSVGDialOffset = (val, max) => {
    const r = 24;
    const c = 2 * Math.PI * r;
    return c - (val / max) * c;
  };

  // Compile working memory buffer slot statuses
  const getWorkingMemoryBuffer = () => {
    if (attentionLevel === 0) {
      return [
        { label: 'HUD', status: 'OK', color: 'text-green' },
        { label: 'TCAS', status: 'SCAN', color: 'text-cyan' },
        { label: 'EICAS', status: 'OK', color: 'text-green' },
        { label: 'COMM', status: 'LINK', color: 'text-cyan' }
      ];
    }
    if (attentionLevel === 1) {
      return [
        { label: 'HUD', status: 'OK', color: 'text-green' },
        { label: 'TCAS', status: 'WARN', color: 'text-orange' },
        { label: 'EICAS', status: 'OK', color: 'text-green' },
        { label: 'COMM', status: 'LINK', color: 'text-cyan' }
      ];
    }
    if (attentionLevel === 2) {
      return [
        { label: 'HUD', status: 'LOCK', color: 'text-green' },
        { label: 'TCAS', status: 'ALERT', color: 'text-orange' },
        { label: 'EICAS', status: 'SATURATE', color: 'text-orange' },
        { label: 'COMM', status: 'MUTED', color: 'text-muted' }
      ];
    }
    // Level 3/4 Cognitive Overload Overflow
    return [
      { label: 'HUD', status: 'LOCK', color: 'text-green' },
      { label: 'TCAS', status: 'OVERFLOW', color: 'text-red animate-pulse' },
      { label: 'EICAS', status: 'OVERFLOW', color: 'text-red animate-pulse' },
      { label: 'COMM', status: 'MUTED', color: 'text-muted' }
    ];
  };

  const memoryBuffer = getWorkingMemoryBuffer();

  // Determine closest TCAS target threat
  const closestTarget = tcasTargets.reduce((prev, curr) => (curr.range < prev.range ? curr : prev), tcasTargets[0]);
  const isTrafficThreat = closestTarget && closestTarget.range < 2.5;

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
        
        {/* Working Memory Slots Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.08)', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginRight: '0.2rem' }}>WORKING MEMORY BUFFER:</span>
          {memoryBuffer.map((slot, idx) => (
            <span key={idx} className={slot.color} style={{ fontSize: '0.55rem', fontFamily: 'var(--font-hud)', fontWeight: 'bold' }}>
              [{slot.label}: {slot.status}]
            </span>
          ))}
        </div>

        <div className="fma-section">
          {attentionLevel >= 3 ? (
            <span className="fma-mode active-amber" style={{ color: '#ff1744', borderColor: '#ff1744', background: 'rgba(255,23,68,0.1)' }}>
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
          style={{ gridColumn: '1 / span 2', height: '245px' }}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {attentionLevel >= 3 && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Compass size={13} className="glow-icon" style={{ color: 'var(--hud-accent)' }} /> 
              PRIMARY HUD // 3D WIREFRAME FLIGHT PATH
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`industry-tab ${showHeatmap ? 'active' : ''}`}
                style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: showHeatmap ? 'var(--hud-accent)' : 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: showHeatmap ? '#000' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Eye size={10} />
                <span>{showHeatmap ? 'EYE HEATMAP ON' : 'EYE HEATMAP OFF'}</span>
              </button>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>COGNITIVE INTERCEPT FEED</span>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
            {/* Canvas PFD Grid */}
            <canvas 
              ref={canvasRef} 
              width={650} 
              height={205} 
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Left Airspeed scroll tape */}
            <div style={{
              position: 'absolute', left: '8px', top: '30px', bottom: '15px', width: '38px',
              borderRight: '1px solid rgba(0,240,255,0.2)', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--hud-accent)', zIndex: 10,
              background: 'rgba(2,4,10,0.6)', paddingRight: '2px'
            }}>
              <span>{Math.round(airspeed + 20)}</span>
              <span style={{ background: 'rgba(0, 240, 255, 0.25)', borderLeft: '2px solid #fff', paddingLeft: '2px', fontWeight: 'bold' }}>
                {Math.round(airspeed)}
              </span>
              <span>{Math.round(airspeed - 20)}</span>
            </div>

            {/* Right Altitude scroll tape */}
            <div style={{
              position: 'absolute', right: '8px', top: '30px', bottom: '15px', width: '45px',
              borderLeft: '1px solid rgba(0,240,255,0.2)', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--hud-accent)', zIndex: 10,
              background: 'rgba(2,4,10,0.6)', paddingLeft: '2px', textAlign: 'right'
            }}>
              <span>{altitude + 100}</span>
              <span style={{ background: 'rgba(0, 240, 255, 0.25)', borderRight: '2px solid #fff', paddingRight: '2px', fontWeight: 'bold' }}>
                {altitude}
              </span>
              <span>{altitude - 100}</span>
            </div>

            {/* Cognitive Warning center HUD indicator */}
            {attentionLevel >= 3 && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(2,0,5,0.95)', border: '2px solid #ff1744', boxShadow: '0 0 20px #ff1744',
                color: '#ff1744', padding: '0.6rem 1.5rem', fontFamily: 'var(--font-hud)', fontSize: '0.85rem',
                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 20,
                borderRadius: '4px', letterSpacing: '0.08em', animation: 'blink 0.8s infinite'
              }}>
                <AlertTriangle size={14} />
                <span>PILOT ATTENTION DROP // COGNITIVE SHIELD ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            3. TCAS TRAFFIC PROXIMITY SYSTEM (DYNAMIC)
           ========================================== */}
        <div 
          className={`glass-cockpit-card ${getAdaptiveClass('critical')} ${isTrafficThreat ? 'level1-highlight-alert' : ''}`}
          style={{ transition: 'all 0.5s' }}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {attentionLevel >= 3 && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldAlert size={13} style={{ color: isTrafficThreat ? '#ff1744' : '#00e676' }} /> 
              TCAS COLLISION AVOIDANCE
            </span>
            <span style={{ 
              color: isTrafficThreat ? '#ff1744' : '#00e676', 
              fontSize: '0.6rem', 
              animation: isTrafficThreat ? 'blink 1s infinite' : 'none' 
            }}>
              {isTrafficThreat ? 'WARN INTRUDER' : 'STANDBY SCAN'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', height: '95px', marginTop: '0.2rem' }}>
            <div style={{
              position: 'relative', width: '85px', height: '85px', borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <div style={{ width: '55px', height: '55px', border: '1px dashed rgba(0,240,255,0.1)', borderRadius: '50%', position: 'absolute' }} />
              <div style={{ width: '25px', height: '25px', border: '1px solid rgba(0,240,255,0.08)', borderRadius: '50%', position: 'absolute' }} />
              <Plane size={14} style={{ color: 'var(--hud-accent)', transform: 'rotate(-45deg)' }} />

              <div 
                className="radar-sweep" 
                style={{ 
                  transform: `rotate(${radarSweepAngle}deg)`, 
                  transformOrigin: '50% 50%',
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(0,240,255,0.2) 0deg, transparent 80deg)',
                  width: '100%', height: '100%', position: 'absolute', borderRadius: '50%', border: 'none'
                }} 
              />

              {tcasTargets.map(tgt => (
                <div 
                  key={tgt.id}
                  style={{
                    width: '6px', height: '6px', background: tgt.range < 2.5 ? '#ff1744' : '#ffc107', borderRadius: '50%',
                    position: 'absolute', top: `calc(50% + ${tgt.relY}px)`, left: `calc(50% + ${tgt.relX}px)`,
                    boxShadow: tgt.range < 2.5 ? '0 0 10px #ff1744' : '0 0 5px #ffc107', 
                    animation: tgt.range < 2.5 ? 'blink 0.8s infinite' : 'none'
                  }}
                  title={`${tgt.label} alt: ${tgt.altDiff}`}
                />
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>
                {isTrafficThreat ? 'Proximity Threat Warning' : 'Proximity Advisory'}
              </span>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', color: isTrafficThreat ? '#ff1744' : '#00e676', display: 'block', fontWeight: 'bold' }}>
                {isTrafficThreat 
                  ? `TRAFFIC ALERT: ${closestTarget.altDiff > 0 ? '+' : ''}${closestTarget.altDiff}FT` 
                  : 'NO TRAFFIC THREATS // CLEAN'}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block', marginTop: '1px' }}>
                {isTrafficThreat 
                  ? `RANGE: ${closestTarget.range} NM | CLOSURE: ${closestTarget.closure} kts` 
                  : 'TCAS SCAN MODE DETECTING'}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block' }}>
                {isTrafficThreat 
                  ? `CMD: CLIMB RATE > 1500 FT/MIN` 
                  : 'STANDBY ADVISORY LIMITS'}
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            4. NAVIGATION COMPASS & WEATHER RADAR (DYNAMIC)
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
            <div style={{
              position: 'relative', width: '85px', height: '85px', borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden', flexShrink: 0
            }}>
              <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', width: '70px', height: '70px', borderRadius: '50%', position: 'absolute', top: '7px', left: '7px' }} />
              <div style={{ border: '1px dashed rgba(0, 240, 255, 0.1)', width: '40px', height: '40px', borderRadius: '50%', position: 'absolute', top: '22px', left: '22px' }} />
              
              <div style={{
                position: 'absolute', top: '15px', left: '42px', width: '22px', height: '22px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,23,68,0.3) 0%, rgba(255,145,0,0.15) 60%, transparent 100%)'
              }} />
              <div style={{
                position: 'absolute', top: '38px', left: '15px', width: '28px', height: '18px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.2) 0%, rgba(0,230,118,0.05) 75%, transparent 100%)'
              }} />

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
                WEATHER CELL DETECTED
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block', marginTop: '1px' }}>
                CELL CELL-A9: {weatherDistance.toFixed(1)} NM | HEADING: {weatherHeading.toString().padStart(3, '0')}°
              </span>
              <span style={{ fontSize: '0.62rem', color: '#ff9100', fontFamily: 'var(--font-hud)', display: 'block' }}>
                {stormWarning}
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            5. ENGINE MONITORING DECK (EICAS - DYNAMIC)
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
              <div><span style={{ color: 'var(--text-secondary)' }}>ITT TEMP:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{ittTemp}°C</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>VIB LEVEL:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{vibration} IPS</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>FUEL TEMP:</span> <span style={{ color: fuelTemp < 0 ? 'var(--color-distracted)' : '#00e676', fontWeight: 'bold' }}>{fuelTemp > 0 ? '+' : ''}{fuelTemp}°C</span></div>
            </div>
          </div>
        </div>

        {/* ==========================================
            6. FUEL & PROPULSION MANAGEMENT (DYNAMIC)
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
                <span className="telemetry-val" style={{ fontFamily: 'var(--font-hud)' }}>{Math.round(leftFuel).toLocaleString()} lbs</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.2rem 0' }}>
                <span className="telemetry-label">Right Outer Tank</span>
                <span className="telemetry-val" style={{ fontFamily: 'var(--font-hud)' }}>{Math.round(rightFuel).toLocaleString()} lbs</span>
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
            7. ARINC 429 DECODED SERIAL DATA TERMINAL
           ========================================== */}
        <div 
          className={`glass-cockpit-card ${getAdaptiveClass('low')}`}
          style={{ gridColumn: '1 / span 2', background: 'rgba(1, 3, 7, 0.9)', minHeight: '92px' }}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 255, 102, 0.15)', paddingBottom: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00ff66', textShadow: '0 0 5px rgba(0, 255, 102, 0.4)' }}>
              <Radio size={13} /> 
              ARINC 429 DECODED SERIAL BUS LOGS
            </span>
            <span style={{ color: '#00ff66', fontSize: '0.55rem' }}>RATE: 10 HZ LOCK</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.3rem 0', fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: '#00ff66', textTransform: 'uppercase' }}>
            {arincFeed.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(0, 255, 102, 0.05)', paddingBottom: '1px' }}>
                <span>&gt;&gt; {line.split(' [')[0]}</span>
                <span style={{ opacity: 0.8 }}>{line.split(' [')[1] ? `[${line.split(' [')[1]}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
