import { usePilotStore } from '../../../store/usePilotStore'
import { useAlertStore } from '../../../store/useAlertStore'
import { GaugeArc } from '../../shared/GaugeArc'
import { AnimatedNumber } from '../../shared/AnimatedNumber'
import { TacticalCard } from '../../shared/TacticalCard'
import { SEVERITY_COLORS } from '../../../types/alerts'
import { motion, AnimatePresence } from 'framer-motion'

/** Concentric biometric ring gauge */
function BiometricRings() {
  const p = usePilotStore(s => s.data)
  const hrColor =
    p.heartRate > 95 ? 'var(--dt-red)' : p.heartRate > 85 ? 'var(--dt-orange)' : 'var(--dt-green)'
  const spo2Color =
    p.spo2 < 94 ? 'var(--dt-red)' : p.spo2 < 96 ? 'var(--dt-yellow)' : 'var(--dt-green)'
  const hrPct = Math.min(((p.heartRate - 40) / 120) * 100, 100)
  const rrPct = Math.min((p.respirationRate / 30) * 100, 100)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
      <GaugeArc
        value={hrPct}
        size={76}
        color={hrColor}
        label="HEART RATE"
        unit="bpm"
        displayValue={p.heartRate.toFixed(0)}
      />
      <GaugeArc
        value={p.spo2}
        size={76}
        color={spo2Color}
        label="SpO₂"
        unit="%"
        displayValue={`${p.spo2.toFixed(1)}%`}
      />
      <GaugeArc
        value={rrPct}
        size={76}
        color="var(--dt-purple)"
        label="RESP RATE"
        unit="/min"
        displayValue={p.respirationRate.toFixed(0)}
      />
    </div>
  )
}

/** Neural activity bar (cognitive load + fatigue) */
function NeuralActivity() {
  const p = usePilotStore(s => s.data)
  const clColor =
    p.cognitiveLoad > 85
      ? 'var(--dt-red)'
      : p.cognitiveLoad > 65
        ? 'var(--dt-orange)'
        : p.cognitiveLoad > 40
          ? 'var(--dt-yellow)'
          : 'var(--dt-green)'
  const ftColor =
    p.fatigueIndex > 70
      ? 'var(--dt-red)'
      : p.fatigueIndex > 50
        ? 'var(--dt-orange)'
        : p.fatigueIndex > 30
          ? 'var(--dt-yellow)'
          : 'var(--dt-green)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
      {[
        { label: 'COGNITIVE LOAD', value: p.cognitiveLoad, color: clColor },
        { label: 'FATIGUE INDEX', value: p.fatigueIndex, color: ftColor },
      ].map(metric => (
        <div key={metric.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span
              className="data-label"
              style={{ color: 'var(--dt-text-dim)', letterSpacing: '0.12em' }}
            >
              {metric.label}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                color: metric.color,
                textShadow: `0 0 6px ${metric.color}88`,
              }}
            >
              <AnimatedNumber value={metric.value} decimals={0} suffix="%" />
            </span>
          </div>
          {/* Segmented bar */}
          <div
            style={{
              height: '5px',
              background: 'rgba(22,42,72,0.7)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${metric.value}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, var(--dt-green), ${metric.color})`,
                borderRadius: '3px',
                boxShadow: `0 0 8px ${metric.color}88`,
                position: 'relative',
              }}
            >
              {/* Shimmer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '6px',
                  height: '100%',
                  background: 'rgba(255,255,255,0.3)',
                  filter: 'blur(2px)',
                }}
              />
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Stress + reaction time */
function StressIndicator() {
  const { stressLevel, reactionTimeMs } = usePilotStore(s => s.data)
  const stressColors = {
    LOW: 'var(--dt-green)',
    MODERATE: 'var(--dt-yellow)',
    HIGH: 'var(--dt-orange)',
    CRITICAL: 'var(--dt-red)',
  }
  const col = stressColors[stressLevel]
  const stressPct = { LOW: 15, MODERATE: 40, HIGH: 70, CRITICAL: 95 }[stressLevel]

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(22,42,72,0.30)',
        borderRadius: '5px',
        padding: '8px 10px',
        border: `1px solid ${col}22`,
        marginBottom: '8px',
      }}
    >
      <div>
        <div className="data-label" style={{ marginBottom: '2px' }}>
          STRESS LEVEL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="font-hud"
            style={{ fontSize: '13px', color: col, textShadow: `0 0 8px ${col}88` }}
          >
            {stressLevel}
          </div>
          {/* Mini stress bar */}
          <div
            style={{
              width: '40px',
              height: '3px',
              background: 'rgba(22,42,72,0.8)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${stressPct}%` }}
              transition={{ duration: 0.4 }}
              style={{
                height: '100%',
                background: col,
                borderRadius: '2px',
                boxShadow: `0 0 4px ${col}`,
              }}
            />
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="data-label" style={{ marginBottom: '2px' }}>
          REACTION TIME
        </div>
        <div className="font-mono text-bright" style={{ fontSize: '13px' }}>
          <AnimatedNumber value={reactionTimeMs} decimals={0} suffix=" ms" />
        </div>
      </div>
    </div>
  )
}

/** Eye tracking with crosshair gaze visualizer */
function EyeTracking() {
  const { gazeX, gazeY, blinkRate } = usePilotStore(s => s.data)
  const W = 90,
    H = 60

  return (
    <TacticalCard title="EYE TRACKING">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* Gaze visualizer with sectors */}
        <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Sector lines */}
            <line
              x1={W / 2}
              y1={0}
              x2={W / 2}
              y2={H}
              stroke="rgba(0,245,255,0.08)"
              strokeWidth={0.5}
            />
            <line
              x1={0}
              y1={H / 2}
              x2={W}
              y2={H / 2}
              stroke="rgba(0,245,255,0.08)"
              strokeWidth={0.5}
            />
            <rect
              x={1}
              y={1}
              width={W - 2}
              height={H - 2}
              rx={4}
              fill="none"
              stroke="rgba(0,245,255,0.15)"
              strokeWidth={0.7}
            />
            {/* Center crosshair */}
            <line
              x1={W / 2 - 6}
              y1={H / 2}
              x2={W / 2 + 6}
              y2={H / 2}
              stroke="rgba(0,245,255,0.25)"
              strokeWidth={0.7}
            />
            <line
              x1={W / 2}
              y1={H / 2 - 6}
              x2={W / 2}
              y2={H / 2 + 6}
              stroke="rgba(0,245,255,0.25)"
              strokeWidth={0.7}
            />
          </svg>

          <motion.div
            animate={{ left: `${gazeX * 100}%`, top: `${gazeY * 100}%` }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--dt-cyan)',
              boxShadow: '0 0 10px var(--dt-cyan), 0 0 20px rgba(0,245,255,0.3)',
              transform: 'translate(-50%, -50%)',
              border: '1.5px solid rgba(255,255,255,0.5)',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          {[
            { l: 'GAZE X', v: `${(gazeX * 100).toFixed(0)}%` },
            { l: 'GAZE Y', v: `${(gazeY * 100).toFixed(0)}%` },
            { l: 'BLINK/MIN', v: blinkRate.toFixed(0) },
          ].map(r => (
            <div key={r.l} className="data-row">
              <span className="data-label">{r.l}</span>
              <span className="data-value">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </TacticalCard>
  )
}

/** Pilot readiness score */
function ReadinessScore() {
  const p = usePilotStore(s => s.data)
  const score = Math.max(
    0,
    Math.round(
      100 -
        p.fatigueIndex * 0.4 -
        p.cognitiveLoad * 0.3 -
        (p.heartRate > 90 ? (p.heartRate - 90) * 0.5 : 0)
    )
  )
  const color = score > 70 ? 'var(--dt-green)' : score > 40 ? 'var(--dt-yellow)' : 'var(--dt-red)'
  const label = score > 70 ? 'FIT FOR DUTY' : score > 40 ? 'DEGRADED' : 'IMPAIRED'

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(0,245,255,0.05), rgba(0,245,255,0.02))',
        border: '1px solid var(--dt-border)',
        borderRadius: '5px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
      }}
    >
      <GaugeArc
        value={score}
        size={68}
        color={color}
        label="READINESS"
        displayValue={`${score}%`}
      />
      <div>
        <div
          className="font-hud"
          style={{ fontSize: '13px', color, textShadow: `0 0 10px ${color}` }}
        >
          {label}
        </div>
        <div
          className="font-data text-muted"
          style={{ fontSize: '9px', marginTop: '2px', letterSpacing: '0.1em' }}
        >
          PILOT READINESS INDEX
        </div>
        <div className="font-mono" style={{ fontSize: '10px', color, marginTop: '2px' }}>
          <AnimatedNumber value={score} decimals={0} suffix="%" />
        </div>
      </div>
    </div>
  )
}

/** Alert history feed */
function AlertHistory() {
  const alerts = useAlertStore(s => s.alerts)
  const acknowledge = useAlertStore(s => s.acknowledgeAlert)

  return (
    <TacticalCard title="ALERT LOG">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <AnimatePresence>
          {alerts.slice(0, 8).map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => acknowledge(alert.id)}
              className={`alert-${alert.severity}`}
              style={{
                borderLeft: `3px solid ${SEVERITY_COLORS[alert.severity]}`,
                background: `rgba(${alert.severity === 'EMERGENCY' ? '255,26,60' : alert.severity === 'WARNING' ? '255,107,0' : alert.severity === 'CAUTION' ? '255,229,0' : '0,245,255'}, 0.05)`,
                borderRadius: '0 4px 4px 0',
                padding: '5px 8px',
                cursor: 'pointer',
                opacity: alert.acknowledged ? 0.35 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '7.5px',
                    letterSpacing: '0.12em',
                    color: SEVERITY_COLORS[alert.severity],
                    textShadow:
                      alert.severity === 'EMERGENCY'
                        ? `0 0 6px ${SEVERITY_COLORS[alert.severity]}`
                        : 'none',
                  }}
                >
                  {alert.severity} · {alert.system}
                </span>
                <span className="font-mono text-muted" style={{ fontSize: '7.5px' }}>
                  {new Date(alert.timestamp).toTimeString().split(' ')[0]}
                </span>
              </div>
              <div
                className="font-mono"
                style={{ fontSize: '10px', color: 'var(--dt-text)', marginTop: '2px' }}
              >
                {alert.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {alerts.length === 0 && (
          <div
            className="font-mono text-muted"
            style={{ fontSize: '10px', textAlign: 'center', padding: '12px' }}
          >
            ◈ No active alerts
          </div>
        )}
      </div>
    </TacticalCard>
  )
}

export function PilotStatusPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Pilot identity card */}
      <TacticalCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {/* Tactical ID badge */}
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, rgba(0,245,255,0.08), rgba(0,245,255,0.03))',
              border: '2px solid rgba(0,245,255,0.35)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,245,255,0.20)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '24px', lineHeight: 1 }}>👨‍✈️</div>
            {/* Status bar bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--dt-green), rgba(0,255,136,0.5))',
              }}
            />
          </div>
          <div>
            <div
              className="font-hud text-bright"
              style={{ fontSize: '13px', letterSpacing: '0.12em', marginBottom: '2px' }}
            >
              CPT. ARJUN MEHTA
            </div>
            <div
              className="font-data text-muted"
              style={{ fontSize: '9px', letterSpacing: '0.1em', marginBottom: '4px' }}
            >
              ATPL · 12,450 HRS · A320/737
            </div>
            {/* Clearance */}
            <div
              style={{
                display: 'inline-block',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '7px',
                letterSpacing: '0.15em',
                color: 'var(--dt-amber)',
                border: '1px solid rgba(255,179,0,0.30)',
                padding: '1px 6px',
                borderRadius: '3px',
              }}
            >
              CLEARANCE: TOP SECRET
            </div>
          </div>
        </div>

        <ReadinessScore />

        <div className="section-header">BIOMETRICS</div>
        <BiometricRings />
        <StressIndicator />
        <NeuralActivity />
      </TacticalCard>

      <EyeTracking />
      <AlertHistory />
    </div>
  )
}
