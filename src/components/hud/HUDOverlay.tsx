import { useTelemetryStore } from '../../store/useTelemetryStore'
import { useFlightStore } from '../../store/useFlightStore'
import { AnimatedNumber } from '../shared/AnimatedNumber'
import { FlightPhase } from '../../types/flightPhase'
import { motion } from 'framer-motion'

/** F-35 style tape box with label + value + unit */
function TapeBox({
  label,
  value,
  unit,
  size = 'md',
  color = 'var(--dt-cyan)',
  sub,
  subLabel,
}: {
  label: string
  value: React.ReactNode
  unit: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  sub?: React.ReactNode
  subLabel?: string
}) {
  const valSize = size === 'lg' ? '28px' : size === 'sm' ? '18px' : '22px'
  return (
    <div className="hud-tape-box" style={{ minWidth: size === 'sm' ? '80px' : '100px' }}>
      <div
        className="font-data"
        style={{
          fontSize: '8px',
          letterSpacing: '0.18em',
          color: 'var(--dt-text-dim)',
          marginBottom: '2px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        className="font-hud"
        style={{
          fontSize: valSize,
          color,
          lineHeight: 1,
          textShadow: `0 0 12px ${color}88`,
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </div>
      <div
        className="font-data"
        style={{
          fontSize: '8px',
          color: 'rgba(0,245,255,0.45)',
          letterSpacing: '0.12em',
          marginTop: '1px',
        }}
      >
        {unit}
      </div>
      {sub !== undefined && (
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            className="font-data"
            style={{ fontSize: '8px', color: 'var(--dt-text-dim)', letterSpacing: '0.1em' }}
          >
            {subLabel}
          </div>
          <div className="font-mono" style={{ fontSize: '9px', color: 'var(--dt-text)' }}>
            {sub}
          </div>
        </div>
      )}
    </div>
  )
}

function AltitudeTape() {
  const alt = useTelemetryStore(s => s.data.altitude)
  const vs = useTelemetryStore(s => s.data.verticalSpeed)
  const trend = vs > 50 ? 'up' : vs < -50 ? 'down' : 'flat'
  const vsColor = vs > 50 ? 'var(--dt-green)' : vs < -50 ? 'var(--dt-orange)' : 'var(--dt-text-dim)'

  return (
    <TapeBox
      label="ALTITUDE"
      value={<AnimatedNumber value={alt} decimals={0} />}
      unit="FT MSL"
      size="lg"
      sub={
        <span style={{ color: vsColor }}>
          {vs > 0 ? '+' : ''}
          <AnimatedNumber value={vs} decimals={0} />
        </span>
      }
      subLabel="V/S"
    />
  )
}

function SpeedTape() {
  const ias = useTelemetryStore(s => s.data.indicatedAirspeed)
  const gs = useTelemetryStore(s => s.data.groundSpeed)
  const mach = (ias / 661.5).toFixed(2)
  return (
    <TapeBox
      label="AIRSPEED"
      value={<AnimatedNumber value={ias} decimals={0} />}
      unit="KTS IAS"
      size="lg"
      sub={<span>M {mach}</span>}
      subLabel="MACH"
    />
  )
}

function HeadingDisplay() {
  const hdg = useTelemetryStore(s => s.data.heading)
  const dirs = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]
  const cardinal = dirs[Math.round(hdg / 22.5) % 16]

  // Arc compass rose
  const arcs = [-30, -20, -10, 0, 10, 20, 30]
  const W = 120,
    H = 42,
    cx = W / 2,
    cy = H - 6
  const R = 80

  return (
    <div className="hud-tape-box" style={{ minWidth: '120px', padding: '6px 8px' }}>
      <div
        className="font-data"
        style={{
          fontSize: '8px',
          letterSpacing: '0.18em',
          color: 'var(--dt-text-dim)',
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}
      >
        HEADING
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {arcs.map(offset => {
          const a = hdg + offset
          const rad = (a - hdg) * (Math.PI / 180) * (R / 50)
          const px = cx + rad * 60
          if (px < 0 || px > W) return null
          const isCard = a % 90 === 0
          return (
            <g key={offset}>
              <line
                x1={px}
                y1={H - 2}
                x2={px}
                y2={H - (isCard ? 14 : 8)}
                stroke={isCard ? 'var(--dt-cyan)' : 'rgba(0,245,255,0.3)'}
                strokeWidth={isCard ? 1.5 : 1}
              />
              {isCard && (
                <text
                  x={px}
                  y={H - 16}
                  textAnchor="middle"
                  fill="var(--dt-cyan)"
                  fontSize={9}
                  fontFamily="'Orbitron', sans-serif"
                >
                  {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(a / 45) % 8]}
                </text>
              )}
            </g>
          )
        })}
        {/* Center bug */}
        <polygon
          points={`${cx},${H - 2} ${cx - 5},${H - 10} ${cx + 5},${H - 10}`}
          fill="var(--dt-amber)"
        />
      </svg>
      <div
        className="font-hud"
        style={{
          fontSize: '20px',
          color: 'var(--dt-cyan)',
          textShadow: '0 0 12px rgba(0,245,255,0.7)',
          textAlign: 'center',
          letterSpacing: '0.06em',
          marginTop: '-2px',
        }}
      >
        <AnimatedNumber value={hdg} decimals={0} />°
      </div>
      <div
        className="font-mono"
        style={{ fontSize: '10px', color: 'var(--dt-amber)', textAlign: 'center' }}
      >
        {cardinal}
      </div>
    </div>
  )
}

function AttitudeDisplay() {
  const pitch = useTelemetryStore(s => s.data.pitch)
  const roll = useTelemetryStore(s => s.data.roll)
  const gForce = useTelemetryStore(s => s.data.gForce)
  const pitchColor = Math.abs(pitch) > 20 ? 'var(--dt-orange)' : 'var(--dt-text)'
  const rollColor = Math.abs(roll) > 30 ? 'var(--dt-orange)' : 'var(--dt-text)'
  const gColor =
    gForce > 2.5 ? 'var(--dt-red)' : gForce > 1.5 ? 'var(--dt-orange)' : 'var(--dt-green)'

  // Simple artificial horizon SVG
  const S = 80,
    cx = 40,
    cy = 40,
    R = 34
  const rollRad = (roll * Math.PI) / 180
  const pitchOffset = pitch * 1.2

  return (
    <div className="hud-tape-box" style={{ padding: '8px 12px' }}>
      <div
        className="font-data"
        style={{
          fontSize: '8px',
          letterSpacing: '0.18em',
          color: 'var(--dt-text-dim)',
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}
      >
        ATTITUDE
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Artificial horizon */}
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ flexShrink: 0 }}>
          <defs>
            <clipPath id="adi-clip">
              <circle cx={cx} cy={cy} r={R} />
            </clipPath>
          </defs>
          {/* Sky */}
          <rect x={0} y={0} width={S} height={S} fill="#0A1A3A" clipPath="url(#adi-clip)" />
          {/* Ground */}
          <rect
            x={0}
            y={cy - pitchOffset}
            width={S}
            height={S}
            fill="#3A1A06"
            transform={`rotate(${roll}, ${cx}, ${cy})`}
            clipPath="url(#adi-clip)"
          />
          {/* Horizon line */}
          <line
            x1={cx - R}
            y1={cy - pitchOffset}
            x2={cx + R}
            y2={cy - pitchOffset}
            stroke="#888"
            strokeWidth={1}
            transform={`rotate(${roll}, ${cx}, ${cy})`}
            clipPath="url(#adi-clip)"
          />
          {/* Pitch marks */}
          {[-10, -5, 5, 10].map(p => (
            <line
              key={p}
              x1={cx - 12}
              y1={cy - pitchOffset - p * 1.2}
              x2={cx + 12}
              y2={cy - pitchOffset - p * 1.2}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.7}
              transform={`rotate(${roll}, ${cx}, ${cy})`}
              clipPath="url(#adi-clip)"
            />
          ))}
          {/* Bank arc */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="rgba(0,245,255,0.2)"
            strokeWidth={0.8}
          />
          {/* Reference lines */}
          <line
            x1={cx - 10}
            y1={cy}
            x2={cx - 4}
            y2={cy}
            stroke="var(--dt-amber)"
            strokeWidth={1.5}
          />
          <line
            x1={cx + 4}
            y1={cy}
            x2={cx + 10}
            y2={cy}
            stroke="var(--dt-amber)"
            strokeWidth={1.5}
          />
          <polygon
            points={`${cx},${cy} ${cx - 3},${cy + 5} ${cx + 3},${cy + 5}`}
            fill="var(--dt-amber)"
          />
          {/* Roll indicator tick */}
          <line
            x1={cx}
            y1={cy - R + 3}
            x2={cx}
            y2={cy - R + 9}
            stroke="var(--dt-cyan)"
            strokeWidth={1.5}
            transform={`rotate(${roll}, ${cx}, ${cy})`}
          />
        </svg>

        {/* Numeric readouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            { l: 'PITCH', v: pitch, fmt: `${pitch.toFixed(1)}°`, color: pitchColor },
            { l: 'ROLL', v: roll, fmt: `${roll.toFixed(1)}°`, color: rollColor },
            { l: 'G', v: gForce, fmt: `${gForce.toFixed(2)}g`, color: gColor },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span
                className="font-data"
                style={{
                  fontSize: '9px',
                  color: 'var(--dt-text-dim)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {r.l}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '11px', color: r.color, fontWeight: 500 }}
              >
                {r.fmt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Tactical crosshair reticle */
function ThreatReticle() {
  const W = 80,
    cx = 40,
    cy = 40
  return (
    <div className="reticle-center" style={{ opacity: 0.45 }}>
      <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={36}
          fill="none"
          stroke="rgba(0,245,255,0.25)"
          strokeWidth={0.75}
          strokeDasharray="4 4"
        />
        {/* Inner ring */}
        <circle cx={cx} cy={cy} r={18} fill="none" stroke="rgba(0,245,255,0.30)" strokeWidth={1} />
        {/* Cross hairs */}
        {[
          [-38, -2],
          [-22, 0],
          [22, 0],
          [38, -2],
          [0, -38],
          [0, -22],
          [0, 22],
          [0, 38],
        ].map(([dx, dy], i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + (i < 2 ? dx : i < 4 ? dx : dy < 0 ? 0 : 0)}
            y2={cy + (i < 4 ? 0 : dy)}
            stroke="rgba(0,245,255,0.40)"
            strokeWidth={0.8}
          />
        ))}
        {/* Rotating outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={36}
          fill="none"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth={1}
          strokeDasharray="8 16"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: 'reticle-spin 12s linear infinite',
          }}
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2.5} fill="var(--dt-amber)" />
      </svg>
    </div>
  )
}

/** NAV data bottom-left */
function NavDataOverlay() {
  const t = useTelemetryStore(s => s.data)
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '70px',
        left: '16px',
        background: 'rgba(1,8,16,0.78)',
        border: '1px solid var(--dt-cyan-edge)',
        borderRadius: '6px',
        padding: '8px 10px',
        backdropFilter: 'blur(10px)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {[
        { l: 'DEST', v: 'VABB' },
        { l: 'DIST', v: `${(t.distanceToDestination ?? 0).toFixed(0)} NM` },
        { l: 'WND', v: `${(t.windSpeed ?? 0).toFixed(0)}KT/${(t.windDirection ?? 0).toFixed(0)}°` },
        { l: 'OAT', v: `${(t.outsideAirTemp ?? 0).toFixed(1)}°C` },
      ].map(r => (
        <div
          key={r.l}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '1px 0',
          }}
        >
          <span
            className="font-data"
            style={{
              fontSize: '8px',
              color: 'var(--dt-text-dim)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {r.l}
          </span>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--dt-text-bright)' }}>
            {r.v}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HUDOverlay() {
  const { isRunning, currentPhase } = useFlightStore()
  const showHUD =
    isRunning && currentPhase !== FlightPhase.PREFLIGHT && currentPhase !== FlightPhase.STARTUP

  if (!showHUD) return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      {/* Top center — primary flight instruments */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start',
        }}
      >
        <SpeedTape />
        <HeadingDisplay />
        <AltitudeTape />
      </div>

      {/* Bottom center — attitude + artificial horizon */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <AttitudeDisplay />
      </div>

      {/* Center reticle */}
      <ThreatReticle />

      {/* NAV data overlay */}
      <NavDataOverlay />

      {/* Top-left badge */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(0,245,255,0.7)',
          background: 'rgba(1,8,16,0.75)',
          border: '1px solid rgba(0,245,255,0.18)',
          padding: '4px 10px',
          borderRadius: '4px',
          backdropFilter: 'blur(6px)',
        }}
      >
        ◈ AI·TWIN ACTIVE
      </motion.div>
    </div>
  )
}
