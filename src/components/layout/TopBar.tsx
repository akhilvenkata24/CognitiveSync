import { useFlightStore } from '../../store/useFlightStore'
import { useAlertStore } from '../../store/useAlertStore'
import { FLIGHT_PHASE_LABELS, FLIGHT_PHASE_ICONS } from '../../types/flightPhase'
import { SEVERITY_COLORS } from '../../types/alerts'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

function MissionClock({ totalSeconds }: { totalSeconds: number }) {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0')
  return (
    <span
      className="font-hud text-primary glow-primary"
      style={{ fontSize: '14px', letterSpacing: '0.22em' }}
    >
      {h}:{m}:{s}
    </span>
  )
}

/** Animated radar arc — decorative logo background */
function RadarArcLogo() {
  return (
    <svg
      width={44}
      height={44}
      viewBox="0 0 44 44"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {[0.35, 0.65, 1.0].map((frac, i) => (
        <circle
          key={i}
          cx={22}
          cy={22}
          r={22 * frac - 1}
          fill="none"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth={0.75}
        />
      ))}
      <line
        x1={22}
        y1={22}
        x2={22}
        y2={3}
        stroke="rgba(0,245,255,0.5)"
        strokeWidth={1}
        style={{ transformOrigin: '22px 22px', animation: 'radar-sweep 3s linear infinite' }}
      />
      <circle
        cx={22}
        cy={22}
        r={2}
        fill="var(--dt-cyan)"
        style={{ filter: 'drop-shadow(0 0 4px var(--dt-cyan))' }}
      />
    </svg>
  )
}

/** Signal strength bars */
function SignalBars({ strength = 4 }: { strength?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
      {[1, 2, 3, 4].map(n => (
        <div
          key={n}
          style={{
            width: 3,
            height: 4 + n * 3,
            borderRadius: '1px',
            background: n <= strength ? 'var(--dt-green)' : 'var(--dt-border-2)',
            boxShadow: n <= strength ? '0 0 4px var(--dt-green)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function TopBar() {
  const {
    currentPhase,
    totalMissionElapsedSeconds,
    isRunning,
    startMission,
    isMissionComplete,
    phaseProgress,
  } = useFlightStore()
  const alerts = useAlertStore(s => s.alerts)
  const activeEmergency = alerts.find(a => a.severity === 'EMERGENCY' && !a.acknowledged)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utcStr = time.toUTCString().split(' ').slice(4, 5)[0]
  const activeAlerts = alerts.filter(a => !a.acknowledged)

  return (
    <div
      style={{
        gridArea: 'topbar',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        background:
          'linear-gradient(90deg, rgba(1,8,16,0.99) 0%, rgba(5,15,30,0.97) 30%, rgba(8,20,40,0.96) 50%, rgba(5,15,30,0.97) 70%, rgba(1,8,16,0.99) 100%)',
        borderBottom: '1px solid var(--dt-border)',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {/* Bottom edge glow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, var(--dt-cyan-edge) 20%, var(--dt-cyan) 50%, var(--dt-cyan-edge) 80%, transparent 100%)',
          opacity: 0.6,
        }}
      />

      {/* Scanline */}
      <div className="scanline-overlay" />

      {/* ─── LEFT: Brand ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '200px' }}>
        {/* Logo */}
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <RadarArcLogo />
          <div
            style={{
              position: 'absolute',
              inset: '8px',
              background: 'linear-gradient(135deg, #00F5FF, #0055AA)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,245,255,0.35)',
              fontSize: '16px',
            }}
          >
            ✈
          </div>
        </div>

        <div>
          <div
            className="font-hud text-bright glow-primary"
            style={{ fontSize: '15px', letterSpacing: '0.28em' }}
          >
            AEROTWIN AI
          </div>
          <div
            className="font-data text-muted"
            style={{ fontSize: '9px', letterSpacing: '0.18em', fontWeight: 500 }}
          >
            DIGITAL TWIN COMMAND CENTER · v2.0
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '36px', background: 'var(--dt-border-2)' }} />

        {/* Classification (decorative) */}
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '7px',
            letterSpacing: '0.15em',
            color: 'var(--dt-amber)',
            textShadow: '0 0 6px rgba(255,179,0,0.5)',
            border: '1px solid rgba(255,179,0,0.25)',
            padding: '2px 6px',
            borderRadius: '3px',
          }}
        >
          CLASSIFIED
        </div>
      </div>

      {/* ─── CENTER: Phase + Alert ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {/* Phase pill */}
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background:
              'linear-gradient(90deg, rgba(0,245,255,0.06), rgba(0,245,255,0.10), rgba(0,245,255,0.06))',
            border: '1px solid rgba(0,245,255,0.28)',
            borderRadius: '24px',
            padding: '5px 18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Phase progress fill */}
          <motion.div
            animate={{ width: `${phaseProgress * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, rgba(0,245,255,0.08), rgba(0,245,255,0.04))',
              borderRadius: '24px',
            }}
          />
          <span style={{ fontSize: '16px', position: 'relative' }}>
            {FLIGHT_PHASE_ICONS[currentPhase]}
          </span>
          <span
            className="font-hud text-primary"
            style={{ fontSize: '12px', letterSpacing: '0.22em', position: 'relative' }}
          >
            {FLIGHT_PHASE_LABELS[currentPhase].toUpperCase()}
          </span>
          <span className="font-mono text-muted" style={{ fontSize: '10px', position: 'relative' }}>
            {(phaseProgress * 100).toFixed(0)}%
          </span>
        </motion.div>

        {/* Emergency banner */}
        <AnimatePresence>
          {activeEmergency && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0.8 }}
              style={{
                background: 'rgba(255,26,60,0.15)',
                border: '1px solid var(--dt-red)',
                borderRadius: '4px',
                padding: '2px 12px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '9px',
                letterSpacing: '0.16em',
                color: 'var(--dt-red)',
                textShadow: '0 0 8px var(--dt-red)',
                animation: 'edge-flicker 0.8s ease-in-out infinite',
              }}
            >
              ⚠ EMERGENCY · {activeEmergency.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── RIGHT: Clocks + Controls ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: '220px',
          justifyContent: 'flex-end',
        }}
      >
        {/* Signal */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <SignalBars strength={isRunning ? 4 : 2} />
          <div
            className="font-data text-muted"
            style={{ fontSize: '7px', letterSpacing: '0.12em' }}
          >
            COMMS
          </div>
        </div>

        <div style={{ width: '1px', height: '32px', background: 'var(--dt-border)' }} />

        {/* Mission elapsed */}
        <div style={{ textAlign: 'right' }}>
          <div
            className="font-data text-muted"
            style={{ fontSize: '8px', letterSpacing: '0.14em' }}
          >
            MISSION ELAPSED
          </div>
          <MissionClock totalSeconds={totalMissionElapsedSeconds} />
        </div>

        <div style={{ width: '1px', height: '32px', background: 'var(--dt-border)' }} />

        {/* UTC */}
        <div style={{ textAlign: 'right' }}>
          <div className="font-data text-muted" style={{ fontSize: '8px' }}>
            ZULU TIME
          </div>
          <div
            className="font-mono text-bright"
            style={{ fontSize: '13px', letterSpacing: '0.1em' }}
          >
            {utcStr}Z
          </div>
        </div>

        <div style={{ width: '1px', height: '32px', background: 'var(--dt-border)' }} />

        {/* Alert counter */}
        <div
          style={{
            background: activeAlerts.length > 0 ? 'rgba(255,26,60,0.08)' : 'rgba(0,245,255,0.04)',
            border: `1px solid ${activeAlerts.length > 0 ? 'rgba(255,26,60,0.35)' : 'var(--dt-border)'}`,
            borderRadius: '6px',
            padding: '4px 10px',
            textAlign: 'center',
            minWidth: '48px',
            animation:
              activeAlerts.length > 0 ? 'threat-breathe 1.2s ease-in-out infinite' : 'none',
          }}
        >
          <div
            className="font-data text-muted"
            style={{ fontSize: '7px', letterSpacing: '0.14em' }}
          >
            ALERTS
          </div>
          <div
            className="font-hud"
            style={{
              fontSize: '18px',
              lineHeight: 1,
              color:
                activeAlerts.length > 0
                  ? SEVERITY_COLORS[alerts[0]?.severity ?? 'INFO']
                  : 'var(--dt-text-dim)',
            }}
          >
            {activeAlerts.length.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Launch / Live / Complete */}
        {!isRunning && !isMissionComplete && (
          <button
            id="start-mission-btn"
            className="aero-btn success"
            onClick={startMission}
            style={{ fontSize: '10px', letterSpacing: '0.18em' }}
          >
            ▶ LAUNCH
          </button>
        )}
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-led nominal" />
            <span
              className="font-hud text-success"
              style={{ fontSize: '10px', letterSpacing: '0.18em' }}
            >
              LIVE
            </span>
          </div>
        )}
        {isMissionComplete && (
          <div
            className="font-hud text-primary glow-primary"
            style={{ fontSize: '10px', letterSpacing: '0.18em' }}
          >
            ✓ COMPLETE
          </div>
        )}
      </div>
    </div>
  )
}
