// ==========================================
// Web Audio API Warning Synthesizer
// ==========================================

let audioCtx = null;
let alarmInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a simple synthesised beep
 */
export function playBeep(frequency = 800, duration = 0.1, type = 'sine', volume = 0.1) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth envelope to prevent clicking sounds
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Failed to play beep:', error);
  }
}

/**
 * Start repeating alarm based on severity
 */
export function startAlarm(type = 'distracted') {
  if (alarmInterval) clearInterval(alarmInterval);

  const ctx = getAudioContext();

  if (type === 'fatigued') {
    // Fatigued (Sleep) State: High alarm - urgent rapid alarm
    alarmInterval = setInterval(() => {
      // Double beep
      playBeep(980, 0.08, 'sawtooth', 0.25);
      setTimeout(() => {
        playBeep(980, 0.08, 'sawtooth', 0.25);
      }, 120);
    }, 450);
  } else if (type === 'distracted') {
    // Distracted State: Standard alert sound
    alarmInterval = setInterval(() => {
      playBeep(880, 0.15, 'triangle', 0.18);
    }, 800);
  }
}

/**
 * Stop any active repeating alarm
 */
export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
