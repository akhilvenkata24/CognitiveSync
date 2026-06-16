import React, { useEffect, useRef, useState } from 'react';
import { Plane, ShieldAlert, CloudRain, Activity, Radio, AlertTriangle, Compass, Eye, Brain, Shield, Cpu } from 'lucide-react';

export default function AerospaceCockpit({ attentionLevel, telemetry, alerts = [] }) {
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
    gazeY = 0,
    detected = true,
    ear = 0.25
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

  // Helper styles/methods from TelemetryPanel
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attentionScore / 100) * circumference;

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

  const getAngleStyle = (val, max) => {
    return Math.abs(val) > max ? { color: 'var(--color-distracted)' } : { color: 'var(--hud-accent)' };
  };

  const getEarStyle = (val) => {
    return val < 0.18 ? { color: 'var(--color-fatigued)' } : { color: 'var(--hud-accent)' };
  };

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
          newLine = `150 BARO ALT: ${statsRef.current.altitude} FT      [HEX: 1500${hexVal}]`;
        } else {
          const statusVal = state === 'focused' ? '00FF' : (state === 'normal' ? '0F8A' : 'F94B');
          newLine = `270 MASTER STATUS: ${state.toUpperCase()}   [HEX: 2700${statusVal}]`;
        }
        
        newFeed.push(newLine);
        return newFeed;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [attentionLevel, state]);

  // HTML5 Canvas Render Loop: 3D Perspective Terrain & Horizon HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gridRows = 9;
    const gridCols = 10;
    let terrainScroll = 0;

    const render = () => {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.fillStyle = '#02040c';
      ctx.fillRect(0, 0, w, h);

      const currentYaw = telemetryRef.current.yaw;
      const currentPitch = telemetryRef.current.pitch;
      const currentRoll = telemetryRef.current.roll;
      const currentGazeX = telemetryRef.current.gazeX;
      const currentGazeY = telemetryRef.current.gazeY;

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

      ctx.save();
      ctx.translate(centerX, centerY);

      const radRoll = (currentRoll * Math.PI) / 180;
      ctx.rotate(-radRoll);

      const pitchOffset = currentPitch * 2.0;
      ctx.translate(0, pitchOffset);

      const skyGrad = ctx.createLinearGradient(0, -h, 0, 0);
      skyGrad.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
      skyGrad.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-w, -h * 2, w * 2, h * 2);

      ctx.lineWidth = 1;
      terrainScroll = (terrainScroll + 0.6) % 35;
      
      const gridColsRef = 10;
      for (let col = -gridColsRef; col <= gridColsRef; col++) {
        const xHorizon = col * 8 - currentYaw * 0.8;
        const xScreenBase = col * 90 - currentYaw * 2.5;

        ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0.01, 1 - Math.abs(col) / gridColsRef) * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(xHorizon, 0);
        ctx.lineTo(xScreenBase, h);
        ctx.stroke();
      }

      const gridRowsRef = 9;
      for (let r = 0; r < gridRowsRef; r++) {
        const scrollOffset = r * 22 + terrainScroll;
        const scaleFactor = scrollOffset / h;
        const yLine = scrollOffset;

        if (yLine < h) {
          const wLine = w * (0.1 + scaleFactor * 1.5);
          ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0.02, 1 - scaleFactor) * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(-wLine, yLine);
          ctx.lineTo(wLine, yLine);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = 'var(--hud-accent)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-75, 0);
      ctx.lineTo(75, 0);
      ctx.stroke();

      ctx.strokeStyle = 'var(--hud-accent)';
      ctx.lineWidth = 1.2;
      const ladderSteps = [-20, -10, 10, 20];
      ladderSteps.forEach(deg => {
        const yL = -deg * 4.0;
        ctx.beginPath();
        ctx.moveTo(-35, yL);
        ctx.lineTo(35, yL);
        ctx.stroke();
        
        ctx.fillStyle = 'var(--hud-accent)';
        ctx.font = '7px Share Tech Mono';
        ctx.fillText(Math.abs(deg).toString(), -46, yL + 2.5);
        ctx.fillText(Math.abs(deg).toString(), 39, yL + 2.5);
      });

      ctx.restore();

      ctx.strokeStyle = 'var(--hud-accent)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY);
      ctx.lineTo(centerX - 12, centerY);
      ctx.lineTo(centerX, centerY + 8);
      ctx.lineTo(centerX + 12, centerY);
      ctx.lineTo(centerX + 35, centerY);
      ctx.moveTo(centerX, centerY - 6);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
      ctx.stroke();

      if (showHeatmap && gazeHistoryRef.current.length > 0) {
        ctx.save();
        const history = gazeHistoryRef.current;
        
        ctx.shadowColor = '#00f0ff';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        
        history.forEach((pt, i) => {
          const mappedX = centerX + (pt.x * 6);
          const mappedY = centerY + (-pt.y * 5.2);
          
          if (i === 0) {
            ctx.moveTo(mappedX, mappedY);
          } else {
            ctx.lineTo(mappedX, mappedY);
          }
        });
        ctx.stroke();

        const latestPt = history[history.length - 1];
        const lx = centerX + (latestPt.x * 6);
        const ly = centerY + (-latestPt.y * 5.2);
        
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(lx, ly, 5.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lx, ly, 12, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [showHeatmap]);

  const getWorkingMemoryBuffer = () => {
    if (attentionLevel < 2) {
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
    return [
      { label: 'HUD', status: 'LOCK', color: 'text-green' },
      { label: 'TCAS', status: 'OVERFLOW', color: 'text-red animate-pulse' },
      { label: 'EICAS', status: 'OVERFLOW', color: 'text-red animate-pulse' },
      { label: 'COMM', status: 'MUTED', color: 'text-muted' }
    ];
  };

  const memoryBuffer = getWorkingMemoryBuffer();
  const closestTarget = tcasTargets.reduce((prev, curr) => (curr.range < prev.range ? curr : prev), tcasTargets[0]);
  const isTrafficThreat = closestTarget && closestTarget.range < 2.5;

  // Active Screen warnings mapping logic
  const hasPFDAlert = alerts.some(a => a.status === 'active' && 
    (a.message.includes("AUTOPILOT") || a.message.includes("TERRAIN") || a.message.includes("PRESSURE") || a.message.includes("PITOT"))
  );

  const hasNDAlert = alerts.some(a => a.status === 'active' && 
    (a.message.includes("TCAS") || a.message.includes("WIND") || a.message.includes("SHEAR"))
  );

  const hasEICASAlert = alerts.some(a => a.status === 'active' && 
    (a.message.includes("ENG") || a.message.includes("FIRE") || a.message.includes("HYD") || a.message.includes("FUEL") || a.message.includes("GEN") || a.message.includes("OIL") || a.message.includes("GEARBOX"))
  );

  const hasBMSAlert = alerts.some(a => a.status === 'active' && 
    (a.message.includes("HYPOXIA") || a.message.includes("COGNITIVE") || a.message.includes("ATTENTION") || a.message.includes("DISTRACT"))
  ) || (attentionLevel >= 2);

  const anyScreenHasAlert = hasPFDAlert || hasNDAlert || hasEICASAlert || hasBMSAlert;

  const getScreenStyle = (hasAlert) => {
    if (!anyScreenHasAlert) {
      return {
        filter: 'none',
        opacity: 1,
        transform: 'scale(1)',
        borderColor: 'var(--border-card)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }
    if (hasAlert) {
      const activeColor = 'var(--color-distracted)';
      return {
        filter: 'none',
        opacity: 1,
        transform: 'scale(1.022)',
        zIndex: 5,
        borderColor: activeColor,
        boxShadow: `0 12px 40px rgba(0,0,0,0.85), 0 0 18px rgba(255, 23, 68, 0.45)`,
        transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    } else {
      return {
        filter: 'blur(5px)',
        opacity: 0.18,
        transform: 'scale(0.96)',
        pointerEvents: 'none',
        boxShadow: 'none',
        transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }
  };

  const getSVGDialOffset = (val, max) => {
    const radiusVal = 24;
    const circ = 2 * Math.PI * radiusVal;
    return circ - (val / max) * circ;
  };

  return (
    <div className="glass-cockpit-container">
      
      {/* 1. FLIGHT MODE ANNUNCIATOR (FMA) SYSTEM */}
      <div className="glass-cockpit-fma">
        <div className="fma-section">
          <span className="fma-mode active-green">THR LVR</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span className="fma-mode active-cyan">HDG SEL</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span className="fma-mode active-green">VNAV LOCK</span>
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

      {/* 2. Glass Cockpit Displays 2x2 Screens Grid */}
      <div className="glass-cockpit-grid" style={{ gridTemplateRows: '1fr 1fr', height: 'calc(100vh - 12rem)', gap: '1rem' }}>
        
        {/* SCREEN 1: PRIMARY FLIGHT DISPLAY (PFD) */}
        <div 
          className="glass-cockpit-card"
          style={getScreenStyle(hasPFDAlert)}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {hasPFDAlert && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Compass size={13} style={{ color: 'var(--hud-accent)' }} /> 
              SCREEN 01: PRIMARY FLIGHT HUD // 3D TERRAIN
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`industry-tab ${showHeatmap ? 'active' : ''}`}
                style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Eye size={10} />
                <span>{showHeatmap ? 'HEATMAP ON' : 'HEATMAP OFF'}</span>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
            <canvas 
              ref={canvasRef} 
              width={650} 
              height={205} 
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Airspeed scroll tape */}
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

            {/* Altitude scroll tape */}
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
          </div>
        </div>

        {/* SCREEN 2: NAVIGATION DISPLAY (ND) / TCAS WEATHER RADAR */}
        <div 
          className="glass-cockpit-card"
          style={getScreenStyle(hasNDAlert)}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {hasNDAlert && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldAlert size={13} style={{ color: isTrafficThreat ? '#ff1744' : '#00e676' }} /> 
              SCREEN 02: NAVIGATION DISPLAY // WX + TCAS TARGETS
            </span>
            <span style={{ color: isTrafficThreat ? '#ff1744' : '#00e676', fontSize: '0.6rem' }}>
              {isTrafficThreat ? 'WARN INTRUDER' : 'STANDBY SCAN'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0.8rem', alignItems: 'center', flex: 1, marginTop: '0.2rem', overflow: 'hidden' }}>
            
            {/* TCAS Radar scan */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
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
                  />
                ))}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>
                  {isTrafficThreat ? 'Proximity Threat Warning' : 'Proximity Advisory'}
                </span>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', color: isTrafficThreat ? '#ff1744' : '#00e676', display: 'block', fontWeight: 'bold' }}>
                  {isTrafficThreat 
                    ? `TCAS: ${closestTarget.altDiff > 0 ? '+' : ''}${closestTarget.altDiff}FT` 
                    : 'TCAS: CLEAN'}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block' }}>
                  {isTrafficThreat 
                    ? `RNG: ${closestTarget.range}NM | CLOS: ${closestTarget.closure}kts` 
                    : 'RADAR SEARCH ACTIVE'}
                </span>
              </div>
            </div>

            {/* Weather Radar sweep */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', borderLeft: '1px dashed rgba(255,255,255,0.08)', paddingLeft: '0.6rem' }}>
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
                <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-hud)' }}>Weather Cell</span>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', color: 'var(--hud-accent)', display: 'block', fontWeight: 'bold' }}>
                  WX CELL: DETECTED
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-hud)', display: 'block' }}>
                  RNG: {weatherDistance.toFixed(1)}NM | HDG: {weatherHeading}°
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* SCREEN 3: ENGINE INDICATOR & CREW ALERTING SYSTEM (EICAS) */}
        <div 
          className="glass-cockpit-card"
          style={getScreenStyle(hasEICASAlert)}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {hasEICASAlert && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={13} style={{ color: 'var(--hud-accent)' }} /> 
              SCREEN 03: ENGINE EICAS SYSTEM // PROPULSION & LOGS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflow: 'hidden', marginTop: '0.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.8rem', alignItems: 'center', height: '90px' }}>
              
              {/* EICAS dials */}
              <div className="eicas-ring-container" style={{ gap: '0.6rem', padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <svg className="dial-circle-svg" style={{ width: '45px', height: '45px' }} viewBox="0 0 60 60">
                    <circle className="dial-track" cx="30" cy="30" r="24" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 3 }} />
                    <circle 
                      className="dial-fill" 
                      cx="30" 
                      cy="30" 
                      r="24" 
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={getSVGDialOffset(throttle, 100)}
                      style={{ fill: 'none', stroke: 'var(--hud-accent)', strokeWidth: 3, strokeLinecap: 'round' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '13px', textAlign: 'center', width: '100%' }}>
                    <span className="dial-value-text" style={{ fontSize: '0.65rem' }}>{Math.round(throttle)}%</span>
                  </div>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontFamily: 'var(--font-hud)' }}>N1 ENG 1</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <svg className="dial-circle-svg" style={{ width: '45px', height: '45px' }} viewBox="0 0 60 60">
                    <circle className="dial-track" cx="30" cy="30" r="24" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 3 }} />
                    <circle 
                      className="dial-fill" 
                      cx="30" 
                      cy="30" 
                      r="24" 
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={getSVGDialOffset(throttle - 0.2, 100)}
                      style={{ fill: 'none', stroke: 'var(--hud-accent)', strokeWidth: 3, strokeLinecap: 'round' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '13px', textAlign: 'center', width: '100%' }}>
                    <span className="dial-value-text" style={{ fontSize: '0.65rem' }}>{Math.round(throttle - 0.2)}%</span>
                  </div>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontFamily: 'var(--font-hud)' }}>N1 ENG 2</span>
                </div>

                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>ITT:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{ittTemp}°C</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>VIB:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{vibration} IPS</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>TEMP:</span> <span style={{ color: fuelTemp < 0 ? 'var(--color-distracted)' : '#00e676', fontWeight: 'bold' }}>{fuelTemp}°C</span></div>
                </div>
              </div>

              {/* Fuel Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>FUEL TANK STAGES</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', fontFamily: 'var(--font-hud)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>L TANK:</span>
                  <span style={{ color: '#fff' }}>{Math.round(leftFuel)} lb</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', fontFamily: 'var(--font-hud)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>R TANK:</span>
                  <span style={{ color: '#fff' }}>{Math.round(rightFuel)} lb</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', fontFamily: 'var(--font-hud)', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.1rem', marginTop: '0.1rem' }}>
                  <span style={{ color: 'var(--hud-accent)' }}>FLOW:</span>
                  <span style={{ color: 'var(--hud-accent)', fontWeight: 'bold' }}>{fuelFlow} lb/h</span>
                </div>
              </div>

            </div>

            {/* ARINC decoded logs */}
            <div style={{ background: 'rgba(1, 3, 7, 0.9)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '0.4rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 255, 102, 0.15)', paddingBottom: '2px', fontSize: '0.58rem', color: '#00ff66', fontFamily: 'var(--font-hud)' }}>
                <span>&gt;&gt; ARINC 429 DECODED LOG BUS</span>
                <span>RATE: 10HZ</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#00ff66', textTransform: 'uppercase', overflowY: 'auto' }}>
                {arincFeed.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(0, 255, 102, 0.04)' }}>
                    <span>{line.split(' [')[0]}</span>
                    <span style={{ opacity: 0.85 }}>{line.split(' [')[1] ? `[${line.split(' [')[1]}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCREEN 4: BIOMETRICS & SITUATIONAL AWARENESS (BMS) */}
        <div 
          className="glass-cockpit-card"
          style={getScreenStyle(hasBMSAlert)}
        >
          <div className="hud-corner-bracket bracket-tl" />
          <div className="hud-corner-bracket bracket-tr" />
          <div className="hud-corner-bracket bracket-bl" />
          <div className="hud-corner-bracket bracket-br" />

          {hasBMSAlert && <div className="hud-alert-frame" />}

          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Cpu size={13} style={{ color: hasBMSAlert ? '#ff1744' : 'var(--hud-accent)' }} /> 
              SCREEN 04: BIOMETRIC PILOT STATE & SITUATIONAL AWARENESS (SA)
            </span>
            <span style={{ color: hasBMSAlert ? '#ff1744' : '#00e676', fontSize: '0.6rem' }}>
              {hasBMSAlert ? 'STATE ANOMALY / OVERLOAD' : 'NOMINAL PILOT COGNITION'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', flex: 1, marginTop: '0.2rem', overflow: 'hidden' }}>
            
            {/* Left Column: Cognitive Capacity Gauge & SA Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div className="gauge-container" style={{ width: '75px', height: '75px', position: 'relative', flexShrink: 0, padding: 0 }}>
                  <svg className="gauge-svg" style={{ width: '100%', height: '100%' }} viewBox="0 0 154 154">
                    <circle cx="77" cy="77" r={radius} style={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 10, fill: 'none' }} />
                    <circle 
                      cx="77" 
                      cy="77" 
                      r={radius} 
                      stroke={getScoreColor()}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ strokeWidth: 10, fill: 'none', strokeLinecap: 'round', transition: 'stroke-dashoffset 0.4s' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: getScoreColor(), fontFamily: 'var(--font-hud)', fontSize: '0.95rem', fontWeight: 'bold' }}>
                      {detected ? attentionScore : '--'}
                    </span>
                    <span style={{ fontSize: '0.4rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '-2px' }}>CAPACITY</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>COGNITIVE STATE</span>
                  <span style={{ 
                    display: 'inline-block', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.58rem', fontWeight: 'bold', fontFamily: 'var(--font-hud)', textTransform: 'uppercase',
                    background: state === 'focused' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                    color: getScoreColor()
                  }}>
                    {detected ? state.toUpperCase() : 'NO SIGNAL'}
                  </span>
                </div>
              </div>

              {/* SA Levels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.35rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>L1: PERCEPTION (SYSTEM SCAN)</span>
                    <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--hud-accent)' }}>{detected ? `${endsleyL1}%` : '--'}</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '1px' }}>
                    <div style={{ width: detected ? `${endsleyL1}%` : '0%', height: '100%', background: 'var(--hud-accent)', transition: 'width 0.4s' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>L2: COMPREHENSION (MENTAL SYNC)</span>
                    <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--color-focused)' }}>{detected ? `${endsleyL2}%` : '--'}</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '1px' }}>
                    <div style={{ width: detected ? `${endsleyL2}%` : '0%', height: '100%', background: 'var(--color-focused)', transition: 'width 0.4s' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>L3: PROJECTION (TRAJECTORY)</span>
                    <span style={{ fontFamily: 'var(--font-hud)', color: 'var(--color-normal)' }}>{detected ? `${endsleyL3}%` : '--'}</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '1px' }}>
                    <div style={{ width: detected ? `${endsleyL3}%` : '0%', height: '100%', background: 'var(--color-normal)', transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Eye & Gaze Biometrics rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', justifyContent: 'space-around', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '0.6rem' }}>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>Look Vector</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', ...getAngleStyle(gazeX, 12) }}>{gazeX.toFixed(1)}°x / {gazeY.toFixed(1)}°y</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>Head Rotation</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', ...getAngleStyle(yaw, 15) }}>Y:{yaw}° / P:{pitch}° / R:{roll}°</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>Pupil Dilation</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', color: pupilDilation > 5.5 ? 'var(--color-fatigued)' : 'var(--hud-accent)' }}>{detected ? `${pupilDilation.toFixed(1)}mm` : '--'}</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>Cognitive Saturation</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', color: cognitiveSaturation > 70 ? 'var(--color-distracted)' : 'var(--hud-accent)' }}>{detected ? `${cognitiveSaturation.toFixed(1)}%` : '--'}</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>G-Force Load</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', color: gForce > 4.0 ? 'var(--color-distracted)' : 'var(--hud-accent)' }}>{detected ? `${gForce.toFixed(1)}G` : '--'}</span>
              </div>
              <div className="telemetry-row" style={{ padding: '0.05rem 0' }}>
                <span className="telemetry-label" style={{ fontSize: '0.52rem' }}>Blink Index (EAR)</span>
                <span className="telemetry-val" style={{ fontSize: '0.6rem', ...getEarStyle(ear) }}>{ear.toFixed(3)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
