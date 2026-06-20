import React, { useEffect, useState, useRef } from 'react';
import { Play, RotateCcw, AlertOctagon, AlertTriangle, CheckCircle, Shield, Volume2, Compass, Radio, Plane, Eye } from 'lucide-react';

// Web Audio API Synthesizer for physical cockpit sound feedback
const playCockpitSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
      // Light key click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start();
      osc.stop(now + 0.05);
    } else if (type === 'thud') {
      // Heavy mechanical lever switch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'dial') {
      // Small dial tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.start();
      osc.stop(now + 0.02);
    } else if (type === 'gear') {
      // Gear transition hum
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.start();
      osc.stop(now + 1.2);
    }
  } catch (e) {
    console.warn("Audio context not allowed yet", e);
  }
};

// GPWS Synthesizer ("WHOOP WHOOP ... PULL UP!")
const playGpwsSiren = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    // Sweep 1: "Whoop"
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(380, now + 0.35);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Sweep 2: "Whoop"
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(180, now + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(380, now + 0.8);
    gain2.gain.setValueAtTime(0.2, now + 0.45);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.83);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.45);
    osc2.stop(now + 0.85);

    // Voice 1: "PULL"
    const oscVoice1 = audioCtx.createOscillator();
    const gainVoice1 = audioCtx.createGain();
    oscVoice1.type = 'square';
    oscVoice1.frequency.setValueAtTime(150, now + 0.95);
    gainVoice1.gain.setValueAtTime(0.25, now + 0.95);
    gainVoice1.gain.setValueAtTime(0.25, now + 1.25);
    gainVoice1.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
    oscVoice1.connect(gainVoice1);
    gainVoice1.connect(audioCtx.destination);
    oscVoice1.start(now + 0.95);
    oscVoice1.stop(now + 1.4);

    // Voice 2: "UP"
    const oscVoice2 = audioCtx.createOscillator();
    const gainVoice2 = audioCtx.createGain();
    oscVoice2.type = 'square';
    oscVoice2.frequency.setValueAtTime(130, now + 1.45);
    gainVoice2.gain.setValueAtTime(0.25, now + 1.45);
    gainVoice2.gain.setValueAtTime(0.25, now + 1.75);
    gainVoice2.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
    oscVoice2.connect(gainVoice2);
    gainVoice2.connect(audioCtx.destination);
    oscVoice2.start(now + 1.45);
    oscVoice2.stop(now + 1.9);

  } catch (e) {
    console.warn("GPWS Synthesis blocked by browser audio policy", e);
  }
};

const cockpitStyles = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@500;700;900&display=swap');

/* Skeuomorphic design tokens */
.b737-cockpit-frame {
  background: #191c22;
  background-image: 
    linear-gradient(180deg, #282c35 0%, #15181c 100%),
    radial-gradient(circle at 50% 30%, #353b47 0%, #101216 100%);
  background-blend-mode: overlay;
  border: 6px solid #0f1013;
  border-radius: 16px;
  box-shadow: 
    inset 0 6px 12px rgba(255,255,255,0.08),
    inset 0 -6px 12px rgba(0,0,0,0.7),
    0 25px 60px rgba(0,0,0,0.95);
  padding: 24px;
  color: #d1dbe7;
  font-family: 'Share Tech Mono', monospace;
  user-select: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

/* Panel Separators and Screws */
.panel-screw {
  position: absolute;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle at 35% 35%, #636b7a 0%, #20232b 85%);
  border: 1px solid #0d0f12;
  border-radius: 50%;
  box-shadow: 0 2px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15);
}
.panel-screw::before {
  content: '';
  position: absolute;
  top: 4px; left: 1px; width: 8px; height: 1.5px;
  background: #14161b;
  transform: rotate(45deg);
}
.screw-tl { top: 8px; left: 8px; }
.screw-tr { top: 8px; right: 8px; }
.screw-bl { bottom: 8px; left: 8px; }
.screw-br { bottom: 8px; right: 8px; }

.panel-section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #7b8e9f;
  text-transform: uppercase;
  margin-bottom: 8px;
  border-bottom: 2px solid rgba(255,255,255,0.06);
  padding-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* MCP Glare Shield Panel */
.b737-mcp {
  background: linear-gradient(180deg, #2a2d36 0%, #15181d 100%);
  border: 3px solid #090a0d;
  border-radius: 10px;
  box-shadow: 
    inset 0 4px 6px rgba(255,255,255,0.08), 
    inset 0 -4px 6px rgba(0,0,0,0.6), 
    0 8px 20px rgba(0,0,0,0.6);
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  position: relative;
  background-image: radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.05), transparent);
}

.mcp-dial-group {
  display: grid;
  grid-template-areas: 
    "blank label"
    "knob screen";
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: center;
  gap: 4px 12px;
}

.mcp-dial-label {
  grid-area: label;
  justify-self: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #a4b4c7;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  margin-bottom: 2px;
}

.mcp-vs-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mcp-screen-box {
  grid-area: screen;
  background: #030407;
  border: 2px solid #363d4a;
  border-radius: 6px;
  padding: 4px 10px;
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.95);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  min-width: 75px;
}
.mcp-screen-box::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.mcp-screen-val {
  color: #ff7700;
  text-shadow: 0 0 8px rgba(255,119,0,0.9);
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.35rem;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: right;
}

.mcp-screen-cyan .mcp-screen-val {
  color: #00f0ff;
  text-shadow: 0 0 8px rgba(0,240,255,0.9);
}

.mcp-knob-container {
  grid-area: knob;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mcp-knob-wrapper {
  position: relative;
  width: 26px;
  height: 26px;
}

.mcp-knob-outer {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #768190 0%, #292e35 85%);
  border: 2px solid #111317;
  box-shadow: 0 4px 6px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.2);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.mcp-knob-outer::before {
  content: '';
  position: absolute;
  top: 2px;
  left: calc(50% - 1.5px);
  width: 3px;
  height: 7px;
  background: #ffec00;
  border-radius: 1px;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.mcp-knob-inc, .mcp-knob-dec {
  width: 14px;
  height: 14px;
  background: #23272e;
  border: 1px solid #3c424f;
  color: #8fa0b0;
  border-radius: 50%;
  font-size: 8px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.4);
  transition: all 0.1s;
}
.mcp-knob-inc:hover, .mcp-knob-dec:hover { color: #fff; background: #333845; }
.mcp-knob-inc:active, .mcp-knob-dec:active { transform: scale(0.9); }

/* Glare shield Warn buttons */
.glare-warn-panel {
  display: flex;
  gap: 6px;
  background: #1c1d22;
  border: 2px solid #0f1013;
  padding: 4px;
  border-radius: 6px;
  box-shadow: inset 0 2px 4px #000;
}

.mcp-warn-button {
  width: 42px;
  height: 32px;
  border: 2.5px solid #4a151b;
  border-radius: 4px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.52rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.1;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 3px 5px rgba(0,0,0,0.6);
  text-transform: uppercase;
}

.fire-warn-btn {
  background: linear-gradient(180deg, #4d0a11 0%, #200407 100%);
  color: #ff2d55;
  border-color: #7a1622;
  text-shadow: 0 0 4px rgba(255,45,85,0.4);
}
.fire-warn-btn.active-flashing {
  background: #ff2d55;
  color: #fff;
  border-color: #ff5274;
  box-shadow: 0 0 20px #ff2d55, inset 0 2px 4px rgba(255,255,255,0.4);
  text-shadow: 0 0 8px #fff;
  animation: mcp-warn-blink 0.4s infinite alternate;
}

.master-caut-btn {
  background: linear-gradient(180deg, #4a3306 0%, #1e1402 100%);
  color: #ff9f0a;
  border-color: #75520e;
  text-shadow: 0 0 4px rgba(255,159,10,0.4);
}
.master-caut-btn.active-flashing {
  background: #ff9f0a;
  color: #000;
  border-color: #ffb340;
  box-shadow: 0 0 20px #ff9f0a, inset 0 2px 4px rgba(255,255,255,0.5);
  text-shadow: none;
  font-weight: 900;
  animation: mcp-warn-blink 0.6s infinite alternate;
}

@keyframes mcp-warn-blink {
  0% { filter: brightness(0.85); opacity: 0.85; }
  100% { filter: brightness(1.35); opacity: 1; }
}

/* Rubber MCP buttons with LED status strip */
.mcp-ap-btn {
  position: relative;
  background: linear-gradient(180deg, #373c47 0%, #21242b 100%);
  border: 2px solid #0f1013;
  border-radius: 4px;
  color: #b5c2d1;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.54rem;
  font-weight: 700;
  width: 48px;
  height: 28px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 3px;
  cursor: pointer;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 3px 5px rgba(0,0,0,0.5);
  transition: all 0.15s;
}
.mcp-ap-btn:hover { background: linear-gradient(180deg, #434956 0%, #292d36 100%); }
.mcp-ap-btn:active { transform: translateY(1px); box-shadow: 0 1px 2px #000; }

.mcp-ap-btn-led {
  position: absolute;
  top: 4px;
  width: 22px;
  height: 4px;
  background: #111317;
  border-radius: 1px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
  transition: all 0.2s;
}

.mcp-ap-btn.engaged .mcp-ap-btn-led {
  background: #00ff66;
  box-shadow: 0 0 10px #00ff66, 0 0 2px #00ff66;
}

/* Main Display Units Layout */
.b737-main-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1.15fr 1.05fr;
  gap: 15px;
}

.b737-screen {
  background: #010204;
  border: 5px solid #2e3440;
  border-radius: 10px;
  box-shadow: 
    inset 0 6px 15px rgba(0,0,0,0.98), 
    0 8px 18px rgba(0,0,0,0.75);
  padding: 10px;
  position: relative;
  overflow: hidden;
  height: 290px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.b737-screen::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: 
    linear-gradient(rgba(18, 24, 45, 0.05) 50%, transparent 50%),
    radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%);
  background-size: 100% 4px, 100% 100%;
  pointer-events: none;
  z-index: 10;
}

/* DU 1: Primary Flight Display (PFD) styling */
.pfd-container {
  display: grid;
  grid-template-columns: 42px 1fr 48px;
  gap: 8px;
  flex: 1;
  position: relative;
}

.pfd-tape-viewport {
  position: relative;
  overflow: hidden;
  background: rgba(0,0,0,0.75);
  border-radius: 4px;
  height: 100%;
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.pfd-tape-scroller {
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  right: 0;
  transition: transform 0.1s linear;
}

.pfd-tape-num {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  color: #00f0ff;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.pfd-tape-num::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 1px;
  background: rgba(0, 240, 255, 0.4);
}
.pfd-airspeed-tape .pfd-tape-num::after { right: 0; }
.pfd-altitude-tape .pfd-tape-num::after { left: 0; }

.pfd-airspeed-tape {
  border-right: 2px solid rgba(0,240,255,0.4);
}
.pfd-altitude-tape {
  border-left: 2px solid rgba(0,240,255,0.4);
}
.pfd-altitude-tape.flashing-warning {
  border: 2px solid #ff2d55 !important;
  background: rgba(255,45,85,0.22) !important;
  animation: pfd-warning-pulse 0.5s infinite alternate;
}

@keyframes pfd-warning-pulse {
  0% { box-shadow: 0 0 5px rgba(255,45,85,0.3); border-color: rgba(255,45,85,0.5); }
  100% { box-shadow: 0 0 20px rgba(255,45,85,0.8); border-color: #ff2d55; }
}

.pfd-center-window {
  position: absolute;
  top: calc(50% - 13px);
  width: 100%;
  height: 26px;
  background: rgba(0,0,0,0.9);
  border: 2px solid #ffec00;
  border-radius: 4px;
  color: #ffec00;
  font-weight: 900;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  box-shadow: 0 2px 5px rgba(0,0,0,0.7);
  letter-spacing: 0.5px;
}

.pfd-horizon-area {
  flex: 1;
  background: linear-gradient(to bottom, #116fa7 0%, #328fc3 100%);
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #141c24;
}

.pfd-ground {
  position: absolute;
  bottom: 0;
  left: -50%;
  right: -50%;
  height: 50%;
  background: linear-gradient(to bottom, #6d3f18 0%, #46280d 100%);
  border-top: 3.5px solid #fff;
  transition: transform 0.1s linear, rotate 0.1s linear;
}

.pitch-ladder {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.pitch-line {
  width: 28px;
  height: 1.5px;
  background: rgba(255,255,255,0.7);
  margin: 18px 0;
  position: relative;
}
.pitch-line::before, .pitch-line::after {
  content: attr(data-val);
  position: absolute;
  color: #fff;
  font-size: 6.5px;
  font-family: 'Share Tech Mono', monospace;
  top: -4.5px;
}
.pitch-line::before { left: -18px; }
.pitch-line::after { right: -18px; }

.pfd-aircraft-reticle {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 14px;
  z-index: 8;
  pointer-events: none;
}
.pfd-aircraft-reticle::before, .pfd-aircraft-reticle::after {
  content: '';
  position: absolute;
  top: 4px;
  width: 22px; height: 5px;
  background: #ffec00;
  border: 1px solid #000;
  box-shadow: 0 0 6px #ffec00;
}
.pfd-aircraft-reticle::before { left: 0; }
.pfd-aircraft-reticle::after { right: 0; }
.pfd-aircraft-dot {
  position: absolute;
  top: 3px; left: 26px;
  width: 8px; height: 8px;
  background: #ffec00;
  border: 1.5px solid #000;
  border-radius: 50%;
  box-shadow: 0 0 6px #ffec00;
}

.green-dot-marker {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #00ff66;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 8px #00ff66;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12;
  font-weight: bold;
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  color: #000;
}

.pfd-look-lock-indicator {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 255, 102, 0.22);
  border: 2px solid #00ff66;
  color: #fff;
  font-size: 8px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 5px;
  z-index: 20;
  box-shadow: 0 0 10px rgba(0, 255, 102, 0.5);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pfd-ack-button {
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff2d55;
  color: #fff;
  font-weight: 900;
  border: 2px solid #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 9px;
  padding: 6px 14px;
  cursor: pointer;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  z-index: 25;
  box-shadow: 0 0 15px #ff2d55;
  border-radius: 6px;
  animation: level1-glow-pulse 0.5s infinite alternate;
}
.pfd-ack-button:hover { filter: brightness(1.25); transform: translateX(-50%) scale(1.05); }

.pfd-warning-banner {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,45,85,0.9);
  border: 2px solid #ff2d55;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 8px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 25;
  white-space: nowrap;
  animation: pfd-text-blink 0.4s infinite alternate;
  box-shadow: 0 0 12px rgba(255,45,85,0.6);
}

.pfd-gpws-overlay {
  position: absolute;
  top: 75px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff2d55;
  border: 2.5px solid #fff;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 14px;
  padding: 8px 18px;
  border-radius: 6px;
  z-index: 30;
  box-shadow: 0 0 30px #ff2d55, inset 0 2px 4px rgba(255,255,255,0.6);
  letter-spacing: 2px;
  text-shadow: 0 0 5px #000;
  animation: pfd-text-blink 0.25s infinite alternate;
}

@keyframes pfd-text-blink {
  from { opacity: 0.4; }
  to { opacity: 1; }
}

.ack-status-tip {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Share Tech Mono', monospace;
  font-size: 7.5px;
  white-space: nowrap;
  z-index: 25;
  text-align: center;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(0,0,0,0.85);
  border: 1px solid rgba(255,255,255,0.1);
}
.ack-status-tip.success { color: #00ff66; text-shadow: 0 0 4px #00ff66; border-color: #00ff66; }
.ack-status-tip.error { color: #ff2d55; text-shadow: 0 0 4px #ff2d55; border-color: #ff2d55; }
.ack-status-tip.notice { color: #ff9f0a; text-shadow: 0 0 4px #ff9f0a; border-color: #ff9f0a; }

/* DU 2: ND Radar Display */
.nd-radar-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 2px solid rgba(0, 240, 255, 0.25);
  background: radial-gradient(circle, rgba(2,6,12,0.9) 0%, rgba(0,1,3,1) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,240,255,0.12);
}

.nd-radar-sweep {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: conic-gradient(from 0deg, rgba(0,240,255,0.2) 0deg, transparent 80deg);
  border-radius: 50%;
}

.nd-control-dial {
  font-size: 6.5px;
  background: #23272e;
  border: 1px solid #3c424f;
  color: #d1dbe7;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
}
.nd-control-dial:hover { background: #353b47; }

/* Engine EICAS Gauges */
.eicas-dial-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.dial-circle-svg {
  width: 48px;
  height: 48px;
}

.eicas-needle-indicator {
  position: absolute;
  top: 22px;
  left: 22px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  transform-origin: center center;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.eicas-needle-indicator::before {
  content: '';
  width: 1.5px;
  height: 16px;
  background: #ff2d55;
  position: absolute;
  bottom: 2px;
  left: 1.2px;
  box-shadow: 0 0 3px #ff2d55;
}

/* Landing Gear slots & light */
.gear-section {
  background: linear-gradient(180deg, #20232a 0%, #121418 100%);
  border: 2.5px solid #0b0c0f;
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 62px;
  box-shadow: inset 0 2px 3px rgba(255,255,255,0.05), 0 3px 6px rgba(0,0,0,0.4);
}

.gear-light {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #14151a;
  border: 2px solid #07080a;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.9);
  transition: all 0.25s;
}
.gear-light.locked-down {
  background: #00ff66;
  border-color: #00cc52;
  box-shadow: 0 0 12px #00ff66, inset 0 1px 2px rgba(255,255,255,0.6);
}
.gear-light.in-transit {
  background: #ff2d55;
  border-color: #cc1b3e;
  box-shadow: 0 0 12px #ff2d55, inset 0 1px 2px rgba(255,255,255,0.6);
  animation: level1-glow-pulse 0.4s infinite alternate;
}

.gear-lever-track {
  width: 18px;
  height: 44px;
  background: #050608;
  border-radius: 9px;
  position: relative;
  cursor: pointer;
  border: 2px solid #2f3440;
  box-shadow: inset 0 4px 8px #000;
}

.gear-lever-handle {
  width: 28px;
  height: 18px;
  background: radial-gradient(circle at 35% 35%, #e1e7f0 0%, #686f7c 85%);
  border: 2px solid #14151a;
  border-radius: 50%;
  position: absolute;
  left: -7px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.6);
  transition: top 0.4s cubic-bezier(0.77, 0, 0.175, 1);
}

/* Pedestal bottom deck styling */
.b737-pedestal {
  display: grid;
  grid-template-columns: 1fr 1.35fr 1fr;
  gap: 15px;
  width: 100%;
  box-sizing: border-box;
}

/* CDU Console */
.b737-cdu {
  background: linear-gradient(180deg, #2d313d 0%, #1b1c22 100%);
  border: 3.5px solid #0c0d10;
  border-radius: 12px;
  box-shadow: 
    inset 0 2px 3px rgba(255,255,255,0.1), 
    inset 0 -2px 3px rgba(0,0,0,0.6), 
    0 10px 25px rgba(0,0,0,0.7);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.cdu-bezel-group {
  display: grid;
  grid-template-columns: 24px 1fr 24px;
  gap: 6px;
  align-items: center;
}

.cdu-lsk-column {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 145px;
  gap: 6px;
}

.cdu-lsk {
  background: linear-gradient(180deg, #444a57 0%, #2b2e38 100%);
  border: 1.5px solid #0f1013;
  color: #8fa0b0;
  font-size: 7px;
  width: 22px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}
.cdu-lsk:active {
  background: #191a21;
  transform: scale(0.95);
}

.cdu-screen {
  background: #020704;
  border: 3px solid #14171d;
  border-radius: 6px;
  box-shadow: inset 0 4px 10px rgba(0,0,0,0.95);
  padding: 8px 10px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem;
  color: #00ff66;
  text-shadow: 0 0 5px rgba(0,255,102,0.6);
  height: 155px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
}
.cdu-screen::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(rgba(0, 255, 102, 0.03) 50%, transparent 50%);
  background-size: 100% 4px;
  pointer-events: none;
}

.cdu-keyboard {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  background: #121418;
  border: 2px solid #000;
  border-radius: 6px;
  padding: 8px;
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.8);
}

.cdu-key {
  background: linear-gradient(180deg, #474f5d 0%, #282c35 100%);
  border: 1px solid #0a0b0d;
  border-radius: 3px;
  color: #fff;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.58rem;
  font-weight: bold;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 3px rgba(0,0,0,0.5);
  transition: all 0.1s;
}
.cdu-key:active {
  background: #14161c;
  box-shadow: inset 0 2px 3px #000;
  transform: translateY(1px);
}

/* Throttle console & Trim Wheel */
.b737-throttle-quadrant {
  background: linear-gradient(90deg, #1e2128 0%, #121418 100%);
  border: 3.5px solid #090a0d;
  border-radius: 12px;
  box-shadow: 
    inset 0 2px 3px rgba(255,255,255,0.08), 
    inset 0 -2px 3px rgba(0,0,0,0.5), 
    0 8px 20px rgba(0,0,0,0.6);
  padding: 14px;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  height: 290px;
  box-sizing: border-box;
}

.throttle-slider-input {
  position: absolute;
  width: 175px;
  height: 14px;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  top: 80px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.throttle-visual-handle {
  width: 32px;
  height: 36px;
  background: radial-gradient(circle at 35% 35%, #f4f6f9 0%, #8c95a5 85%);
  border: 2.5px solid #14151a;
  border-radius: 6px;
  position: absolute;
  z-index: 5;
  box-shadow: 0 5px 8px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.5);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: bottom 0.2s cubic-bezier(0.1, 0.8, 0.2, 1);
}
.throttle-visual-handle::after {
  content: '';
  width: 22px;
  height: 5px;
  background: #333;
  border-radius: 2px;
}

.toga-btn {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffcc00;
  border: 1.5px solid #111;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  cursor: pointer;
  position: absolute;
  top: -16px;
  left: 9px;
  z-index: 15;
}
.toga-btn:hover { background: #ffe066; }

.trim-wheel {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: repeating-conic-gradient(#15171c 0% 12.5%, #ffec00 12.5% 25%);
  border: 6px solid #484e5c;
  box-shadow: 
    0 5px 12px rgba(0,0,0,0.8),
    inset 0 3px 5px rgba(255,255,255,0.08);
  position: relative;
  transition: transform 0.1s linear;
}
.trim-wheel::after {
  content: '';
  position: absolute;
  top: calc(50% - 10px);
  left: calc(50% - 10px);
  width: 20px;
  height: 20px;
  background: #2a2d36;
  border: 2px solid #15171b;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.6);
}

.b737-mech-clock {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2c2e37 0%, #0d0f12 85%);
  border: 3px solid #565d6c;
  position: relative;
  box-shadow: 0 4px 8px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

/* Fuel Cutoff Switches */
.cutoff-switches-panel {
  display: flex;
  gap: 12px;
  background: #111216;
  border: 1.5px solid #2a2d35;
  border-radius: 5px;
  padding: 4px 10px;
  margin-top: 6px;
  justify-content: center;
  box-shadow: inset 0 2px 4px #000;
}
.cutoff-switch-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.cutoff-lever-slot {
  width: 10px;
  height: 24px;
  background: #000;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  border: 1px solid #333;
}
.cutoff-lever-handle {
  width: 14px;
  height: 10px;
  background: #c5ced9;
  border: 1px solid #1c1d22;
  border-radius: 2px;
  position: absolute;
  left: -3px;
  box-shadow: 0 2px 3px rgba(0,0,0,0.5);
  transition: top 0.2s ease;
}
.cutoff-lever-handle.cutoff { top: 13px; background: #e07b7b; }
.cutoff-lever-handle.idle { top: 1px; background: #8cd695; }
.cutoff-label {
  font-size: 5px;
  color: #8fa0b0;
  font-family: 'Share Tech Mono', monospace;
}

/* VHF Radio Panel Styling */
.b737-radio-panel {
  background: linear-gradient(180deg, #252830 0%, #15171b 100%);
  border: 3px solid #090a0c;
  border-radius: 8px;
  padding: 10px;
  box-shadow: inset 0 2px 3px rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 155px;
}
.radio-display {
  background: #050608;
  border: 1.5px solid #3a3f4d;
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.8rem;
  font-weight: bold;
  color: #00f0ff;
  text-shadow: 0 0 6px rgba(0,240,255,0.8);
  box-shadow: inset 0 2px 4px #000;
}
.radio-display-stby {
  color: #ff9f0a;
  text-shadow: 0 0 6px rgba(255,159,10,0.8);
}
.radio-swap-btn {
  background: linear-gradient(180deg, #444b58 0%, #292d37 100%);
  border: 1px solid #111;
  color: #fff;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.55rem;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.radio-swap-btn:active { transform: scale(0.95); }
.radio-tuner-buttons {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.radio-tuner-btn {
  background: #1f2229;
  border: 1px solid #333;
  color: #a4b4c7;
  font-size: 8px;
  width: 22px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.radio-tuner-btn:hover { background: #353b47; color: #fff; }
`;

export default function AerospaceCockpit({
  telemetry,
  attentionLevel,
  alerts = [],
  flightPhase,
  setFlightPhase,
  activeTranscript,
  setActiveTranscript,
  airspeed,
  setAirspeed,
  altitude,
  setAltitude,
  triggerScenario,
  onResetUnderstandingGap
}) {
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
    ear = 0.25,
    understanding = {}
  } = telemetry;

  // Retrieve calculated understanding gap score
  const understandingGap = telemetry.understandingGap !== undefined 
    ? telemetry.understandingGap 
    : (understanding.understanding_gap !== undefined ? understanding.understanding_gap : 0.0);

  // States for landing gear lever animation
  const [gearLeverPos, setGearLeverPos] = useState('down'); // 'up' or 'down'
  const [gearState, setGearState] = useState('down'); // 'up', 'down', or 'transit'
  
  // Fuel cutoff switch state ('idle' or 'cutoff')
  const [cutoffEng1, setCutoffEng1] = useState('idle');
  const [cutoffEng2, setCutoffEng2] = useState('idle');

  // States for MCP autopilot selections
  const [apCmdA, setApCmdA] = useState(true);
  const [apCmdB, setApCmdB] = useState(false);
  const [lnav, setLnav] = useState(true);
  const [vnav, setVnav] = useState(true);
  const [altHold, setAltHold] = useState(true);

  // Gaze verification states
  const isLookingAtAltitudeGauge = gazeX < -4 && gazeY < 2; // Left PFD
  const [ackTip, setAckTip] = useState({ type: 'notice', text: 'LOOK AT ALTIMETER TO ACK' });

  // Clock variables
  const [timeSec, setTimeSec] = useState(0);
  const [timeMin, setTimeMin] = useState(0);
  const [timeHour, setTimeHour] = useState(0);

  // CDU Scratchpad State
  const [scratchpad, setScratchpad] = useState('');

  // Detent positions for flaps lever: values map to detents bottom (position)
  const flapsList = ['UP', '1', '2', '5', '15', '30', '40'];
  const [flapsDetent, setFlapsDetent] = useState('30');
  const [speedbrakeDetent, setSpeedbrakeDetent] = useState('RETRACTED');

  // Interactive ND scales
  const [ndRange, setNdRange] = useState(40); // 10, 20, 40, 80 NM
  const [ndMode, setNdMode] = useState('MAP'); // MAP, VOR, PLAN

  // VHF-1 Radio Frequencies
  const [radioActive, setRadioActive] = useState(118.00);
  const [radioStby, setRadioStby] = useState(121.50);

  // TO/GA Mode
  const [togaClimb, setTogaClimb] = useState(false);

  // GPWS Terrain Alarm condition (altitude drops below 2500 ft with gear retracted)
  const gpwsActive = altitude < 2500 && gearState === 'up' && airspeed > 100;

  // Gear Lever transition timing
  useEffect(() => {
    playCockpitSound('gear');
    if (gearLeverPos === 'up') {
      setGearState('transit');
      const timer = setTimeout(() => {
        setGearState('up');
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setGearState('transit');
      const timer = setTimeout(() => {
        setGearState('down');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gearLeverPos]);

  // Keep ticking the mechanical clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeSec(now.getSeconds());
      setTimeMin(now.getMinutes());
      setTimeHour(now.getHours() % 12);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // GPWS audio warning cycle
  useEffect(() => {
    if (gpwsActive) {
      playGpwsSiren();
      const interval = setInterval(() => {
        playGpwsSiren();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [gpwsActive]);

  // Radio Active frequency Guard integration
  useEffect(() => {
    if (radioActive === 121.50) {
      setActiveTranscript("GUARD DISPATCH: Clipper 204, check altitude immediately! Discrepancy detected!");
    }
  }, [radioActive, setActiveTranscript]);

  // Update ACK status tip dynamically
  useEffect(() => {
    if (understandingGap > 70.0) {
      if (isLookingAtAltitudeGauge) {
        setAckTip({ type: 'success', text: 'EYE LOCK ON GAUGE: READY TO ACK' });
      } else {
        setAckTip({ type: 'notice', text: 'LOOK AT FLAPPING ALTIMETER TO ACK' });
      }
    } else {
      setAckTip({ type: 'notice', text: 'SYSTEM OPERATING NOMINAL' });
    }
  }, [understandingGap, isLookingAtAltitudeGauge]);

  // Handle ACK click
  const handleAckClick = () => {
    if (isLookingAtAltitudeGauge) {
      playCockpitSound('click');
      onResetUnderstandingGap();
      setTogaClimb(false);
      setAckTip({ type: 'success', text: 'LOOP CLOSED: RESET COMPLETED' });
    } else {
      playCockpitSound('thud');
      setAckTip({ type: 'error', text: 'GAZE MISMATCH: LOOK AT GAUGE FIRST' });
      // Play siren beep
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  };

  // Find active alerts to display on EICAS display
  const activeAlerts = [...alerts.filter(a => a.status === 'active')];
  if (cutoffEng1 === 'cutoff') {
    activeAlerts.push({ id: 'local_c1', message: 'ENG 1 SHUTDOWN', priority: 'critical' });
  }
  if (cutoffEng2 === 'cutoff') {
    activeAlerts.push({ id: 'local_c2', message: 'ENG 2 SHUTDOWN', priority: 'critical' });
  }
  if (gpwsActive) {
    activeAlerts.push({ id: 'local_gpws', message: 'TERRAIN PULL UP', priority: 'critical' });
  }
  if (radioActive === 121.50) {
    activeAlerts.push({ id: 'local_guard', message: 'GUARD LINK ACTIVE', priority: 'low' });
  }
  if (togaClimb) {
    activeAlerts.push({ id: 'local_toga', message: 'TO/GA GO-AROUND', priority: 'high' });
  }

  const showMismatchPFD = understandingGap > 70.0;
  const greenDotSpeed = 210;

  // SVGDial math
  const getSVGDialOffset = (val, max) => {
    const radiusVal = 18;
    const circ = 2 * Math.PI * radiusVal;
    const percentage = Math.min(100, Math.max(0, val)) / max;
    return circ - percentage * circ;
  };

  // CDU keyboard typing handler
  const handleCduKeyClick = (char) => {
    playCockpitSound('click');
    if (char === 'CLR') {
      setScratchpad('');
    } else if (char === 'INIT') {
      onResetUnderstandingGap();
      setTogaClimb(false);
      setScratchpad('RE-INITIALIZED');
    } else {
      if (scratchpad === 'RE-INITIALIZED') {
        setScratchpad(char);
      } else {
        setScratchpad(prev => (prev + char).substring(0, 16));
      }
    }
  };

  // Line Select Keys (LSK) Click handler
  const handleLskClick = (lskId) => {
    playCockpitSound('thud');
    if (lskId === '1L') {
      // Toggle Flight Phase
      setFlightPhase(prev => prev === 'Cruise' ? 'Approach' : 'Cruise');
    } else if (lskId === '6L') {
      // Re-initialize
      onResetUnderstandingGap();
      setTogaClimb(false);
      setScratchpad('FMS RESET');
    } else if (lskId === '1R') {
      triggerScenario('scenario1');
    } else if (lskId === '2R') {
      triggerScenario('scenario2');
    } else if (lskId === '3R') {
      triggerScenario('scenario3');
    } else if (lskId === '4R') {
      triggerScenario('scenario4');
    } else if (lskId === '6R') {
      setScratchpad('');
    }
  };

  // Trigger TO/GA climb sequence
  const handleTogaClick = () => {
    playCockpitSound('thud');
    setTogaClimb(true);
    setAirspeed(290);
    setAltitude(18000); // spool up and target altitude
    setFlightPhase('Climb');
  };

  // VHF standby tuner
  const adjustRadioFreq = (amt) => {
    playCockpitSound('dial');
    setRadioStby(prev => parseFloat(Math.max(118.00, Math.min(136.95, prev + amt)).toFixed(2)));
  };

  // Swap radio standby and active frequencies
  const swapRadioFreq = () => {
    playCockpitSound('click');
    const stby = radioStby;
    setRadioStby(radioActive);
    setRadioActive(stby);
  };

  // Calculate N1 levels based on airspeed and cutoff switch state
  const targetN1_1 = cutoffEng1 === 'cutoff' ? 0 : (togaClimb ? 98.2 : (84.5 + (airspeed - 250) / 15));
  const targetN1_2 = cutoffEng2 === 'cutoff' ? 0 : (togaClimb ? 98.0 : (84.3 + (airspeed - 250) / 15));

  // ND Map scale variables based on ndRange
  const ndScale = 40 / ndRange;

  return (
    <div className="b737-cockpit-frame">
      <style dangerouslySetInnerHTML={{ __html: cockpitStyles }} />
      
      {/* Corner screws representing panel hardware */}
      <div className="panel-screw screw-tl" />
      <div className="panel-screw screw-tr" />
      <div className="panel-screw screw-bl" />
      <div className="panel-screw screw-br" />

      {/* 1. MCP (MODE CONTROL PANEL) */}
      <div>
        <div className="panel-section-title">
          <span>Mode Control Panel (MCP) // Autopilot Control Glare Shield</span>
          <span style={{ fontSize: '7px', color: '#00ff66', letterSpacing: '1px' }}>SYS DUAL LINKED</span>
        </div>
        <div className="b737-mcp">
          
          {/* Left Master Warning Block */}
          <div className="glare-warn-panel">
            <button 
              className={`mcp-warn-button fire-warn-btn ${showMismatchPFD || gpwsActive ? 'active-flashing' : ''}`}
              onClick={handleAckClick}
            >
              FIRE<br/>WARN
            </button>
            <button 
              className={`mcp-warn-button master-caut-btn ${showMismatchPFD || gpwsActive ? 'active-flashing' : ''}`}
              onClick={handleAckClick}
            >
              MASTER<br/>CAUT
            </button>
          </div>

          {/* Left Course display - Knob Stacked Below Screen */}
          <div className="mcp-dial-group">
            <div className="mcp-dial-label">Crs L</div>
            <div className="mcp-screen-box">
              <span className="mcp-screen-val">360</span>
            </div>
            <div className="mcp-knob-container">
              <button className="mcp-knob-dec" onClick={() => { playCockpitSound('dial'); }} title="Dec">-</button>
              <div className="mcp-knob-wrapper">
                <div className="mcp-knob-outer" style={{ transform: `rotate(${(yaw * 4) % 360}deg)` }} />
              </div>
              <button className="mcp-knob-inc" onClick={() => { playCockpitSound('dial'); }} title="Inc">+</button>
            </div>
          </div>

          {/* Autopilot Speed Selector - Knob Stacked Below Screen */}
          <div className="mcp-dial-group">
            <div className="mcp-dial-label">Ias Mach</div>
            <div className={`mcp-screen-box ${airspeed < greenDotSpeed && flightPhase.toLowerCase() === 'cruise' ? 'mcp-screen-cyan animate-pulse' : ''}`}>
              <span className="mcp-screen-val">{Math.round(airspeed)}</span>
            </div>
            <div className="mcp-knob-container">
              <button className="mcp-knob-dec" onClick={() => { playCockpitSound('dial'); setAirspeed(prev => Math.max(100, prev - 5)); }} title="Dec Speed">-</button>
              <div className="mcp-knob-wrapper">
                <div className="mcp-knob-outer" style={{ transform: `rotate(${(airspeed * 2.5) % 360}deg)` }} />
              </div>
              <button className="mcp-knob-inc" onClick={() => { playCockpitSound('dial'); setAirspeed(prev => Math.min(340, prev + 5)); }} title="Inc Speed">+</button>
            </div>
          </div>

          {/* Heading Display - Knob Stacked Below Screen */}
          <div className="mcp-dial-group">
            <div className="mcp-dial-label">Hdg Sel</div>
            <div className="mcp-screen-box">
              <span className="mcp-screen-val">160</span>
            </div>
            <div className="mcp-knob-container">
              <button className="mcp-knob-dec" onClick={() => { playCockpitSound('dial'); }} title="Dec">-</button>
              <div className="mcp-knob-wrapper">
                <div className="mcp-knob-outer" style={{ transform: `rotate(160deg)` }} />
              </div>
              <button className="mcp-knob-inc" onClick={() => { playCockpitSound('dial'); }} title="Inc">+</button>
            </div>
          </div>

          {/* Autopilot mode push buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`mcp-ap-btn ${lnav ? 'engaged' : ''}`} onClick={() => { playCockpitSound('click'); setLnav(!lnav); }}>
              <div className="mcp-ap-btn-led" />
              LNAV
            </button>
            <button className={`mcp-ap-btn ${vnav ? 'engaged' : ''}`} onClick={() => { playCockpitSound('click'); setVnav(!vnav); }}>
              <div className="mcp-ap-btn-led" />
              VNAV
            </button>
            <button className={`mcp-ap-btn ${altHold ? 'engaged' : ''}`} onClick={() => { playCockpitSound('click'); setAltHold(!altHold); }}>
              <div className="mcp-ap-btn-led" />
              ALT HLD
            </button>
          </div>

          {/* Altitude Display - Knob Stacked Below Screen */}
          <div className="mcp-dial-group">
            <div className="mcp-dial-label">Altitude</div>
            <div className="mcp-screen-box">
              <span className="mcp-screen-val">{altitude}</span>
            </div>
            <div className="mcp-knob-container">
              <button className="mcp-knob-dec" onClick={() => { playCockpitSound('dial'); setAltitude(prev => Math.max(0, prev - 1000)); }} title="Dec Alt">-</button>
              <div className="mcp-knob-wrapper">
                <div className="mcp-knob-outer" style={{ transform: `rotate(${(altitude / 100) % 360}deg)` }} />
              </div>
              <button className="mcp-knob-inc" onClick={() => { playCockpitSound('dial'); setAltitude(prev => Math.min(41000, prev + 1000)); }} title="Inc Alt">+</button>
            </div>
          </div>

          {/* Vert Speed V/S Display */}
          <div className="mcp-vs-group">
            <div className="mcp-dial-label">V/S</div>
            <div className="mcp-screen-box mcp-screen-cyan">
              <span className="mcp-screen-val">1000</span>
            </div>
          </div>

          {/* Autopilot CMD System A/B Engage */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`mcp-ap-btn ${apCmdA ? 'engaged' : ''}`} onClick={() => { playCockpitSound('click'); setApCmdA(!apCmdA); setApCmdB(false); }}>
              <div className="mcp-ap-btn-led" />
              CMD A
            </button>
            <button className={`mcp-ap-btn ${apCmdB ? 'engaged' : ''}`} onClick={() => { playCockpitSound('click'); setApCmdB(!apCmdB); setApCmdA(false); }}>
              <div className="mcp-ap-btn-led" />
              CMD B
            </button>
          </div>

          {/* Right Master Warning Block */}
          <div className="glare-warn-panel">
            <button 
              className={`mcp-warn-button master-caut-btn ${showMismatchPFD || gpwsActive ? 'active-flashing' : ''}`}
              onClick={handleAckClick}
            >
              MASTER<br/>CAUT
            </button>
            <button 
              className={`mcp-warn-button fire-warn-btn ${showMismatchPFD || gpwsActive ? 'active-flashing' : ''}`}
              onClick={handleAckClick}
            >
              FIRE<br/>WARN
            </button>
          </div>

        </div>
      </div>

      {/* 2. MAIN COCKPIT MODULES */}
      <div className="b737-main-panel">
        
        {/* DU 1: Primary Flight Display (PFD) */}
        <div className="b737-screen" style={showMismatchPFD || gpwsActive ? { borderColor: '#ff2d55', boxShadow: '0 0 20px rgba(255,45,85,0.45)' } : {}}>
          <div className="panel-section-title">
            <span>DU 01: PFD // Pilot HUD</span>
            <span style={{ color: isLookingAtAltitudeGauge ? '#00ff66' : '#666', fontSize: '8px' }}>
              {isLookingAtAltitudeGauge ? 'EYE LOCK ON GAUGE' : 'GAZE OFF-TARGET'}
            </span>
          </div>

          {isLookingAtAltitudeGauge && (
            <div className="pfd-look-lock-indicator">
              <Eye size={10} className="animate-pulse" /> PILOT EYE LOCK DETECTED
            </div>
          )}

          <div className="pfd-container">
            
            {/* Smooth Rolling Airspeed tape */}
            <div className="pfd-tape-viewport pfd-airspeed-tape">
              <div 
                className="pfd-tape-scroller" 
                style={{ 
                  transform: `translateY(${-120 + ((airspeed % 10) * 2.4)}px)` 
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => {
                  const labelVal = Math.round((airspeed + 40) - (i * 10) - (airspeed % 10));
                  return (
                    <div key={i} className="pfd-tape-num">
                      {labelVal}
                    </div>
                  );
                })}
              </div>

              {/* Airspeed center window indicator */}
              <div className="pfd-center-window">
                {Math.round(airspeed)}
              </div>

              {/* Airbus Green-Dot Best L/D Speed marker */}
              <div 
                className="green-dot-marker"
                style={{
                  top: `calc(50% - 7px + ${(airspeed - greenDotSpeed) * 2.4}px)`
                }}
                title="Airbus Green-Dot Best L/D Speed"
              >
                GD
              </div>
            </div>

            {/* Attitude Indicator pitch/roll horizon area */}
            <div className="pfd-horizon-area">
              <div 
                className="pfd-ground" 
                style={{ 
                  transform: `translateY(${(togaClimb ? -30 : pitch * 2.5)}px) rotate(${-roll}deg)` 
                }} 
              />
              
              {/* Pitch Ladder lines */}
              <div className="pitch-ladder" style={{ transform: `translateY(${(togaClimb ? -30 : pitch * 2.5)}px) rotate(${-roll}deg)` }}>
                <div className="pitch-line" data-val="15" style={{ top: '-45px' }} />
                <div className="pitch-line" data-val="10" style={{ top: '-22px' }} />
                <div className="pitch-line" data-val="5" style={{ top: '0px' }} />
                <div className="pitch-line" data-val="5" style={{ bottom: '0px' }} />
                <div className="pitch-line" data-val="10" style={{ bottom: '-22px' }} />
                <div className="pitch-line" data-val="15" style={{ bottom: '-45px' }} />
              </div>

              {/* Yellow center aircraft reticle */}
              <div className="pfd-aircraft-reticle">
                <div className="pfd-aircraft-dot" />
              </div>
            </div>

            {/* Smooth Rolling Altitude tape */}
            <div className={`pfd-tape-viewport pfd-altitude-tape ${showMismatchPFD || gpwsActive ? 'flashing-warning' : ''}`}>
              <div 
                className="pfd-tape-scroller" 
                style={{ 
                  transform: `translateY(${-120 + (((altitude / 10) % 10) * 2.4)}px)` 
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => {
                  const labelVal = Math.round((altitude + 400) - (i * 100) - (altitude % 100));
                  return (
                    <div key={i} className="pfd-tape-num">
                      {labelVal}
                    </div>
                  );
                })}
              </div>

              {/* Altitude center window indicator */}
              <div className="pfd-center-window">
                {altitude}
              </div>
            </div>

            {/* GPWS Warning Overlay */}
            {gpwsActive && (
              <div className="pfd-gpws-overlay">
                PULL UP!
              </div>
            )}

            {/* Critical Mismatch Alerts Overlay */}
            {showMismatchPFD && !gpwsActive && (
              <div className="pfd-warning-banner">
                CRITICAL Mismatch: ALT LOSS
              </div>
            )}

            {/* Pulsing closed-loop ACK button overlay inside the Altimeter tape */}
            {(showMismatchPFD || gpwsActive) && (
              <>
                <button 
                  className="pfd-ack-button"
                  onClick={handleAckClick}
                >
                  [ACK]
                </button>
                <div className={`ack-status-tip ${ackTip.type}`}>
                  {ackTip.text}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '6px', color: '#a4b4c7' }}>
            <span>N1 ENG 1: {Math.round(targetN1_1)}%</span>
            <span>GD SPEED: {greenDotSpeed}kt</span>
            <span>SA: {Math.round(endsleyL1)}%</span>
          </div>
        </div>

        {/* DU 2: Navigation Display (ND) Compass with zoom/mode scaling dials */}
        <div className="b737-screen">
          <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>DU 02: ND Map // Radar</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {/* Range Knobs */}
              <button className="nd-control-dial" onClick={() => { playCockpitSound('dial'); setNdRange(prev => prev === 10 ? 20 : prev === 20 ? 40 : prev === 40 ? 80 : 10); }}>
                RNG: {ndRange}
              </button>
              {/* Mode Knobs */}
              <button className="nd-control-dial" onClick={() => { playCockpitSound('dial'); setNdMode(prev => prev === 'MAP' ? 'VOR' : prev === 'VOR' ? 'PLAN' : 'MAP'); }}>
                MODE: {ndMode}
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            {ndMode !== 'PLAN' ? (
              <div className="nd-radar-circle" style={{ width: '132px', height: '132px' }}>
                {/* Spinning sweep radar beam */}
                <div className="nd-radar-sweep" style={{ transform: `rotate(${(timeSec * 6) % 360}deg)` }} />
                
                {/* Compass dial */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  transform: ndMode === 'MAP' ? `rotate(${-yaw}deg)` : 'none', transition: 'transform 0.5s ease',
                  zIndex: 2, pointerEvents: 'none'
                }}>
                  <div style={{ position: 'absolute', top: '2px', left: 'calc(50% - 6px)', fontSize: '8px', color: '#fff', fontWeight: 'bold' }}>{ndMode === 'MAP' ? 'N' : '360'}</div>
                  <div style={{ position: 'absolute', right: '4px', top: 'calc(50% - 6px)', fontSize: '8px', color: '#fff', fontWeight: 'bold' }}>{ndMode === 'MAP' ? 'E' : '090'}</div>
                  <div style={{ position: 'absolute', bottom: '2px', left: 'calc(50% - 6px)', fontSize: '8px', color: '#fff', fontWeight: 'bold' }}>{ndMode === 'MAP' ? 'S' : '180'}</div>
                  <div style={{ position: 'absolute', left: '4px', top: 'calc(50% - 6px)', fontSize: '8px', color: '#fff', fontWeight: 'bold' }}>{ndMode === 'MAP' ? 'W' : '270'}</div>
                </div>

                {/* VOR needle CDI line */}
                {ndMode === 'VOR' && (
                  <div style={{
                    position: 'absolute', top: '10%', left: '50%', width: '2px', height: '80%',
                    background: '#00ff66', transform: `rotate(${-yaw}deg)`, opacity: 0.8, zIndex: 1
                  }} />
                )}

                {/* Center static aircraft icon */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#00f0ff', zIndex: 5 }}>
                  <Plane size={22} style={{ transform: 'rotate(0deg)', filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
                </div>

                {/* Scaled Route path */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.7 }}>
                  <line x1="65" y1="65" x2={`${65 + 25 * ndScale}`} y2={`${65 - 20 * ndScale}`} stroke="#00ff66" strokeWidth="2.5" strokeDasharray="3,3" />
                  <line x1={`${65 + 25 * ndScale}`} y1={`${65 - 20 * ndScale}`} x2={`${65 - 5 * ndScale}`} y2={`${65 - 40 * ndScale}`} stroke="#00ff66" strokeWidth="2.5" strokeDasharray="3,3" />
                </svg>

                {/* TCAS Threat Target (Triangle) */}
                <div style={{
                  position: 'absolute', top: `${65 - 27 * ndScale}px`, left: `${65 + 17 * ndScale}px`,
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '10px solid #ff2d55',
                  animation: 'blink 0.6s infinite',
                  zIndex: 4
                }}>
                  <span style={{ position: 'absolute', top: '10px', left: '-8px', fontSize: '6.5px', color: '#ff2d55', fontWeight: 'bold' }}>
                    +07
                  </span>
                </div>

                {/* Scaled weather cell clouds */}
                <div style={{
                  position: 'absolute', 
                  top: `${65 - 50 * ndScale}px`, 
                  left: `${65 - 40 * ndScale}px`, 
                  width: `${45 * ndScale}px`, 
                  height: `${45 * ndScale}px`,
                  borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,45,85,0.4) 0%, rgba(255,159,10,0.2) 60%, transparent 85%)',
                  zIndex: 1
                }} />
              </div>
            ) : (
              // Plan view (static grid coordinates list)
              <div style={{ width: '130px', height: '130px', background: '#020305', border: '2px solid rgba(255,255,255,0.06)', borderRadius: '6px', position: 'relative', overflow: 'hidden', padding: '10px', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '15px 15px', opacity: 0.35 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2, position: 'relative', fontSize: '6px', color: '#00ff66' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,102,0.3)', paddingBottom: '2px', fontWeight: 'bold' }}>
                    <span>PLAN WAYPOINTS</span>
                    <span>ETA</span>
                  </div>
                  <div>• LOTE1A (ACTIVE)</div>
                  <div>• KNT24 (12.4 NM)</div>
                  <div>• ELEV5 (24.8 NM)</div>
                  <div>• YAW33 (38.1 NM)</div>
                </div>
              </div>
            )}

            <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '7.5px', color: '#8fa0b0', lineHeight: 1.3 }}>
              <span>HDG: 160°<br/>VOR L: 112.30<br/>VOR R: 112.30</span>
            </div>
            
            <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '7.5px', color: '#00ff66', textAlign: 'right', lineHeight: 1.3 }}>
              <span>ACT RTE<br/>LOTE1A<br/>RNG: {ndRange} NM</span>
            </div>
          </div>
        </div>

        {/* Center Panel Section (Landing Gear Controls + EICAS Display) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Landing Gear Panel */}
          <div className="gear-section">
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '5px', color: '#8fa0b0' }}>NOSE</span>
                <div className={`gear-light ${gearState === 'down' ? 'locked-down' : (gearState === 'transit' ? 'in-transit' : '')}`} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '5px', color: '#8fa0b0' }}>L GEAR</span>
                <div className={`gear-light ${gearState === 'down' ? 'locked-down' : (gearState === 'transit' ? 'in-transit' : '')}`} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '5px', color: '#8fa0b0' }}>R GEAR</span>
                <div className={`gear-light ${gearState === 'down' ? 'locked-down' : (gearState === 'transit' ? 'in-transit' : '')}`} />
              </div>
            </div>

            <span style={{ fontSize: '6px', color: '#8fa0b0', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
              Landing<br/>Gear Lever
            </span>

            {/* Sliding Gear Lever Handle */}
            <div 
              className="gear-lever-track"
              onClick={() => {
                playCockpitSound('thud');
                setGearLeverPos(prev => prev === 'up' ? 'down' : 'up');
              }}
            >
              <div 
                className="gear-lever-handle"
                style={{
                  top: gearLeverPos === 'up' ? '2px' : '20px'
                }}
              />
            </div>
          </div>

          {/* EICAS Display screen */}
          <div className="b737-screen" style={{ height: '218px' }}>
            <div className="panel-section-title">DU 03: Primary EICAS // Engine</div>
            
            {/* Dual Circular N1 engine gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              
              {/* Engine 1 */}
              <div className="eicas-dial-container">
                <svg className="dial-circle-svg" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 3.5 }} />
                  <circle 
                    cx="30" 
                    cy="30" 
                    r="24" 
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={getSVGDialOffset(targetN1_1, 100)}
                    style={{ fill: 'none', stroke: '#00ff66', strokeWidth: 4, strokeLinecap: 'round', transition: 'stroke-dashoffset 0.4s' }}
                  />
                </svg>
                {/* Needle indicator */}
                <div 
                  className="eicas-needle-indicator"
                  style={{ transform: `rotate(${targetN1_1 * 2.7}deg)` }}
                />
                <div style={{ position: 'absolute', top: '15px', textAlign: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 'bold' }}>
                    {Math.round(targetN1_1)}%
                  </span>
                </div>
                <span style={{ fontSize: '5.5px', color: '#8fa0b0', marginTop: '3px' }}>N1 ENG 1</span>
              </div>

              {/* Engine 2 */}
              <div className="eicas-dial-container">
                <svg className="dial-circle-svg" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 3.5 }} />
                  <circle 
                    cx="30" 
                    cy="30" 
                    r="24" 
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={getSVGDialOffset(targetN1_2, 100)}
                    style={{ fill: 'none', stroke: '#00ff66', strokeWidth: 4, strokeLinecap: 'round', transition: 'stroke-dashoffset 0.4s' }}
                  />
                </svg>
                {/* Needle indicator */}
                <div 
                  className="eicas-needle-indicator"
                  style={{ transform: `rotate(${targetN1_2 * 2.7}deg)` }}
                />
                <div style={{ position: 'absolute', top: '15px', textAlign: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 'bold' }}>
                    {Math.round(targetN1_2)}%
                  </span>
                </div>
                <span style={{ fontSize: '5.5px', color: '#8fa0b0', marginTop: '3px' }}>N1 ENG 2</span>
              </div>
            </div>

            {/* Crew Alerting System (CAS) Display */}
            <div style={{ background: '#010203', border: '1.5px solid #23272d', borderRadius: '4px', padding: '6px', flex: 1, overflowY: 'auto', marginTop: '6px', boxShadow: 'inset 0 2px 4px #000' }}>
              {activeAlerts.length === 0 ? (
                <div style={{ color: '#00ff66', opacity: 0.6, fontSize: '0.65rem', textAlign: 'center', padding: '8px' }}>
                  &gt; CAS: NO MESSAGES ACTIVE
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    style={{ 
                      fontSize: '0.66rem', padding: '2px 0', borderBottom: '1px dashed rgba(255,255,255,0.04)',
                      color: alert.priority === 'critical' ? '#ff2d55' : (alert.priority === 'high' ? '#ff9f0a' : '#00f0ff'),
                      fontWeight: alert.priority === 'critical' ? 'bold' : 'normal'
                    }}
                  >
                    • {alert.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DU 4: Biometrics & SA display */}
        <div className="b737-screen">
          <div className="panel-section-title">DU 04: Biometrics // SA Twin</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '8px', flex: 1, alignItems: 'center' }}>
            <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '5px', color: '#a4b4c7' }}>
              <div>Att. Score: <span style={{ color: '#00ff66', fontWeight: 'bold' }}>{attentionScore}</span></div>
              <div>State: <span style={{ color: '#fff', fontWeight: 'bold' }}>{state.toUpperCase()}</span></div>
              <div>Gap: <span style={{ color: showMismatchPFD ? '#ff2d55' : '#00f0ff', fontWeight: 'bold' }}>{understandingGap.toFixed(1)}%</span></div>
              <div>Pitch: <span style={{ color: '#fff' }}>{pitch}°</span> Roll: <span style={{ color: '#fff' }}>{roll}°</span></div>
              <div>EAR: <span style={{ color: '#fff' }}>{ear.toFixed(3)}</span> Blink: <span style={{ color: '#fff' }}>{telemetry.isBlinking ? 'YES' : 'NO'}</span></div>
            </div>

            {/* Small mechanical cockpit clock */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="b737-mech-clock">
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ffec00', zIndex: 5 }} />
                
                {/* Clock Hands */}
                <div 
                  style={{
                    position: 'absolute', width: '2px', height: '14px', background: '#fff',
                    transformOrigin: 'bottom center', bottom: '50%', left: 'calc(50% - 1px)',
                    transform: `rotate(${timeHour * 30 + timeMin * 0.5}deg)`
                  }}
                />
                <div 
                  style={{
                    position: 'absolute', width: '1.5px', height: '18px', background: '#fff',
                    transformOrigin: 'bottom center', bottom: '50%', left: 'calc(50% - 0.75px)',
                    transform: `rotate(${timeMin * 6}deg)`
                  }}
                />
                <div 
                  style={{
                    position: 'absolute', width: '1px', height: '20px', background: '#ff2d55',
                    transformOrigin: 'bottom center', bottom: '50%', left: 'calc(50% - 0.5px)',
                    transform: `rotate(${timeSec * 6}deg)`
                  }}
                />
              </div>
              <span style={{ fontSize: '6.5px', color: '#8fa0b0', marginTop: '5px' }}>
                UTC {String(timeHour).padStart(2, '0')}:{String(timeMin).padStart(2, '0')}:{String(timeSec).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '6px', display: 'block', color: '#8fa0b0', textTransform: 'uppercase' }}>
              Cognitive Gap Risk Trend
            </span>
            <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
              {Array.from({ length: 14 }).map((_, idx) => (
                <div 
                  key={idx}
                  style={{
                    flex: 1,
                    height: '12px',
                    borderRadius: '1px',
                    background: idx * 7.5 < understandingGap ? '#ff2d55' : 'rgba(255,255,255,0.06)',
                    boxShadow: idx * 7.5 < understandingGap ? '0 0 5px #ff2d55' : 'none',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. LOWER PEDESTAL MODULES */}
      <div className="b737-pedestal">
        
        {/* Left CDU (FMS legs, phase, active status) */}
        <div className="b737-cdu">
          <div className="panel-section-title">Control Display Unit (CDU-1)</div>
          
          <div className="cdu-bezel-group">
            {/* Left Line Select Keys */}
            <div className="cdu-lsk-column">
              <button className="cdu-lsk" onClick={() => handleLskClick('1L')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('2L')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('3L')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('4L')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('5L')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('6L')}>▶</button>
            </div>

            <div className="cdu-screen">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,102,0.3)', paddingBottom: '2px', fontWeight: 'bold' }}>
                  <span>ACT FMS LEGS</span>
                  <span>1/1</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8fa0b0' }}>FMS PHASE:</span>
                    <span style={{ color: '#fff', textDecoration: 'underline' }}>{flightPhase.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8fa0b0' }}>AIRSPEED:</span>
                    <span>{Math.round(airspeed)} KT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8fa0b0' }}>ALTITUDE:</span>
                    <span>{altitude} FT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ color: '#8fa0b0' }}>SCRATCHPAD:</span>
                    <span style={{ color: '#ffec00', fontWeight: 'bold' }}>{scratchpad ? `>${scratchpad}` : 'EMPTY'}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed rgba(0,255,102,0.2)', paddingTop: '4px', fontSize: '5.8px', display: 'flex', justifyContent: 'space-between', color: '#ff9f0a' }}>
                <span>LSK1L: CHG PHASE</span>
                <span>LSK6L: [INIT RESET]</span>
              </div>
            </div>

            {/* Right Line Select Keys */}
            <div className="cdu-lsk-column">
              <button className="cdu-lsk" onClick={() => handleLskClick('1R')}>◀</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('2R')}>◀</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('3R')}>◀</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('4R')}>◀</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('5R')}>◀</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('6R')}>◀</button>
            </div>
          </div>

          {/* CDU Keyboard keycaps */}
          <div className="cdu-keyboard">
            {['A','B','C','D','E','F'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['G','H','I','J','K','L'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['M','N','O','P','Q','R'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['S','T','U','V','W','X'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['Y','Z','1','2','3','4'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            <button className="cdu-key" style={{ color: '#00ff66' }} onClick={() => handleCduKeyClick('INIT')}>INIT</button>
            <button className="cdu-key" style={{ color: '#ff2d55' }} onClick={() => handleCduKeyClick('CLR')}>CLR</button>
            {['5','6','7','8','9','0'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
          </div>
        </div>

        {/* Center Pedestal: Throttle Quadrant & Radio Panel */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
          
          <div className="b737-throttle-quadrant" style={{ flex: 1 }}>
            {/* Thrust Lever 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, position: 'relative' }}>
              <span style={{ fontSize: '5px', color: '#8fa0b0' }}>ENG 1</span>
              <div style={{ width: '16px', height: '175px', background: '#050608', borderRadius: '8px', border: '2px solid #2f3440', position: 'relative', display: 'flex', justifyContent: 'center', boxShadow: 'inset 0 4px 8px #000' }}>
                <input 
                  type="range"
                  className="throttle-slider-input"
                  min="0"
                  max="100"
                  value={Math.round(84.5 + (airspeed - 250)/15)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAirspeed(Math.round(250 + (val - 84.5)*15));
                  }}
                />
                <div 
                  className="throttle-visual-handle"
                  style={{
                    bottom: `${((84.5 + (airspeed - 250)/15) / 100) * 135 + 10}px`
                  }}
                >
                  {/* TO/GA Button on lever head */}
                  <button className="toga-btn" onClick={handleTogaClick} title="Trigger Takeoff Go-Around Auto Climb" />
                </div>
              </div>
              <span style={{ fontSize: '6px', color: '#a4b4c7' }}>THR 1</span>
              
              {/* Cutoff switch Eng 1 */}
              <div className="cutoff-switches-panel">
                <div className="cutoff-switch-group">
                  <span className="cutoff-label">ENG 1</span>
                  <div 
                    className="cutoff-lever-slot" 
                    onClick={() => {
                      playCockpitSound('thud');
                      setCutoffEng1(prev => prev === 'idle' ? 'cutoff' : 'idle');
                    }}
                  >
                    <div className={`cutoff-lever-handle ${cutoffEng1}`} />
                  </div>
                  <span className="cutoff-label" style={{ fontSize: '4.5px', color: cutoffEng1 === 'idle' ? '#00ff66' : '#ff2d55' }}>
                    {cutoffEng1.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Thrust Lever 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, position: 'relative' }}>
              <span style={{ fontSize: '5px', color: '#8fa0b0' }}>ENG 2</span>
              <div style={{ width: '16px', height: '175px', background: '#050608', borderRadius: '8px', border: '2px solid #2f3440', position: 'relative', display: 'flex', justifyContent: 'center', boxShadow: 'inset 0 4px 8px #000' }}>
                <input 
                  type="range"
                  className="throttle-slider-input"
                  min="0"
                  max="100"
                  value={Math.round(84.3 + (airspeed - 250)/15)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAirspeed(Math.round(250 + (val - 84.3)*15));
                  }}
                />
                <div 
                  className="throttle-visual-handle"
                  style={{
                    bottom: `${((84.3 + (airspeed - 250)/15) / 100) * 135 + 10}px`
                  }}
                />
              </div>
              <span style={{ fontSize: '6px', color: '#a4b4c7' }}>THR 2</span>

              {/* Cutoff switch Eng 2 */}
              <div className="cutoff-switches-panel">
                <div className="cutoff-switch-group">
                  <span className="cutoff-label">ENG 2</span>
                  <div 
                    className="cutoff-lever-slot" 
                    onClick={() => {
                      playCockpitSound('thud');
                      setCutoffEng2(prev => prev === 'idle' ? 'cutoff' : 'idle');
                    }}
                  >
                    <div className={`cutoff-lever-handle ${cutoffEng2}`} />
                  </div>
                  <span className="cutoff-label" style={{ fontSize: '4.5px', color: cutoffEng2 === 'idle' ? '#00ff66' : '#ff2d55' }}>
                    {cutoffEng2.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Pitch Trim Wheel spinning dynamically when altitude transitions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', flex: 0.9 }}>
              <span style={{ fontSize: '6px', color: '#8fa0b0', marginBottom: '6px' }}>TRIM</span>
              <div 
                className="trim-wheel"
                style={{
                  transform: `rotate(${pitch * 16}deg)`
                }}
              />
              <span style={{ fontSize: '6px', color: '#a4b4c7', marginTop: '8px' }}>STAB TRIM</span>
            </div>

            {/* Speed Brake lever */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 0.8 }}>
              <span style={{ fontSize: '5px', color: '#8fa0b0' }}>SPDBRK</span>
              <div 
                style={{ width: '12px', height: '175px', background: '#050608', borderRadius: '6px', border: '2px solid #2f3440', position: 'relative', display: 'flex', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 4px 8px #000' }}
                onClick={() => {
                  playCockpitSound('thud');
                  setSpeedbrakeDetent(prev => prev === 'RETRACTED' ? 'ARMED' : 'RETRACTED');
                }}
              >
                <div 
                  style={{
                    width: '20px', height: '24px', background: '#4b5260', border: '1.5px solid #111', borderRadius: '3px',
                    position: 'absolute', zIndex: 5, boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                    bottom: speedbrakeDetent === 'RETRACTED' ? '140px' : '40px',
                    transition: 'bottom 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: '5.5px', color: '#a4b4c7', textTransform: 'uppercase' }}>
                {speedbrakeDetent === 'RETRACTED' ? 'RET' : 'ARM'}
              </span>
            </div>

            {/* Flaps Detent lever */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 0.8 }}>
              <span style={{ fontSize: '5px', color: '#8fa0b0' }}>FLAPS</span>
              <div 
                style={{ width: '12px', height: '175px', background: '#050608', borderRadius: '6px', border: '2px solid #2f3440', position: 'relative', display: 'flex', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 4px 8px #000' }}
                onClick={() => {
                  playCockpitSound('thud');
                  const idx = flapsList.indexOf(flapsDetent);
                  const nextIdx = (idx + 1) % flapsList.length;
                  setFlapsDetent(flapsList[nextIdx]);
                }}
              >
                <div 
                  style={{
                    width: '20px', height: '24px', background: '#4b5260', border: '1.5px solid #111', borderRadius: '3px',
                    position: 'absolute', zIndex: 5, boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                    bottom: `${(flapsList.indexOf(flapsDetent) / flapsList.length) * 130 + 10}px`,
                    transition: 'bottom 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                  }}
                />
              </div>
              <span style={{ fontSize: '5.5px', color: '#a4b4c7' }}>
                {flapsDetent === 'UP' ? 'UP' : `F${flapsDetent}`}
              </span>
            </div>
          </div>

          {/* Pedestal Radio VHF Selector */}
          <div className="b737-radio-panel">
            <div style={{ fontFamily: 'Orbitron', fontSize: '6px', color: '#7b8e9f', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '3px' }}>
              VHF-1 COMM RADIO
            </div>
            <div className="radio-display">
              <div>
                <span style={{ fontSize: '5px', color: '#666', display: 'block' }}>ACTIVE</span>
                {radioActive.toFixed(2)}
              </div>
              <div className="radio-display-stby">
                <span style={{ fontSize: '5px', color: '#666', display: 'block' }}>STBY</span>
                {radioStby.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="radio-swap-btn" onClick={swapRadioFreq}>◄ XFR ►</button>
              <span style={{ fontSize: '5.5px', color: radioActive === 121.50 ? '#ff2d55' : '#8fa0b0' }}>
                {radioActive === 121.50 ? 'EMERGENCY GUARD' : 'ATC LINK OK'}
              </span>
            </div>

            <div className="radio-tuner-buttons">
              <button className="radio-tuner-btn" onClick={() => adjustRadioFreq(-1.0)}>-1</button>
              <button className="radio-tuner-btn" onClick={() => adjustRadioFreq(1.0)}>+1</button>
              <button className="radio-tuner-btn" onClick={() => adjustRadioFreq(-0.05)}>-0.05</button>
              <button className="radio-tuner-btn" onClick={() => adjustRadioFreq(0.05)}>+0.05</button>
            </div>
          </div>
        </div>

        {/* Right CDU (Scenario Selector with LSK triggers) */}
        <div className="b737-cdu">
          <div className="panel-section-title">Scenario Selector Panel (CDU-2)</div>
          
          <div className="cdu-bezel-group">
            {/* Left LSKs for Scenario selectors */}
            <div className="cdu-lsk-column">
              <button className="cdu-lsk" onClick={() => handleLskClick('1R')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('2R')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('3R')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('4R')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('5R')}>▶</button>
              <button className="cdu-lsk" onClick={() => handleLskClick('6R')}>▶</button>
            </div>

            <div className="cdu-screen" style={{ color: '#ffb340', textShadow: '0 0 5px rgba(255,179,64,0.6)', justifyContent: 'flex-start', gap: '6px' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid rgba(255,179,64,0.3)', paddingBottom: '3px', fontSize: '6.5px' }}>
                FMS SCENARIO SELECTOR
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.2px' }}>
                  <span>&lt; LSK1R: MODE CONFUSION</span>
                  <span style={{ color: '#fff', opacity: 0.8 }}>CRUISE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.2px' }}>
                  <span>&lt; LSK2R: NOMINAL CRUISE</span>
                  <span style={{ color: '#fff', opacity: 0.8 }}>LEVEL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.2px' }}>
                  <span>&lt; LSK3R: NOMINAL APPROACH</span>
                  <span style={{ color: '#fff', opacity: 0.8 }}>DESCENT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.2px' }}>
                  <span>&lt; LSK4R: ENG FLAMEOUT</span>
                  <span style={{ color: '#fff', opacity: 0.8 }}>ALERT</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed rgba(255,179,64,0.2)', paddingTop: '4px', fontSize: '5.8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', color: '#ff2d55' }}>
                <span>&lt; LSK6R: CLEAR ALERTS</span>
                <span>FMS OK</span>
              </div>
            </div>

            {/* Right LSKs (empty but physically present) */}
            <div className="cdu-lsk-column">
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
              <button className="cdu-lsk" onClick={() => { playCockpitSound('thud'); }}>◀</button>
            </div>
          </div>

          {/* CDU Keyboard keycaps */}
          <div className="cdu-keyboard">
            {['A','B','C','D','E','F'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['G','H','I','J','K','L'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['M','N','O','P','Q','R'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['S','T','U','V','W','X'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            {['Y','Z','1','2','3','4'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
            <button className="cdu-key" style={{ color: '#00ff66' }} onClick={() => handleCduKeyClick('INIT')}>INIT</button>
            <button className="cdu-key" style={{ color: '#ff2d55' }} onClick={() => handleCduKeyClick('CLR')}>CLR</button>
            {['5','6','7','8','9','0'].map(k => (
              <button key={k} className="cdu-key" onClick={() => handleCduKeyClick(k)}>{k}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
