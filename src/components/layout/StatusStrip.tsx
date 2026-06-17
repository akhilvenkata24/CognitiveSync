import { useState, useEffect } from 'react'
import { useFlightStore } from '../../store/useFlightStore'
import { useTelemetryStore } from '../../store/useTelemetryStore'

const MODES = ['NORMAL', 'TACTICAL', 'EMERGENCY'] as const
type Mode = (typeof MODES)[number]

const MODE_COLORS: Record<Mode, string> = {
  NORMAL: 'var(--dt-green)',
  TACTICAL: 'var(--dt-amber)',
  EMERGENCY: 'var(--dt-red)',
}

export function StatusStrip() {
  const [time, setTime] = useState(new Date())
  const [mode, setMode] = useState<Mode>('NORMAL')
  const { isRunning } = useFlightStore()
  const t = useTelemetryStore(s => s.data)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Cycle mode
  const nextMode = () => setMode(m => MODES[(MODES.indexOf(m) + 1) % MODES.length])

  const zulu = time.toUTCString().split(' ').slice(4, 5)[0]
  const localStr = time.toLocaleTimeString('en-IN', { hour12: false })

  // Fake GPS lat/lon derived from heading/distance
  const lat = (28.6139 + (t.distanceToDestination ?? 0) * 0.001).toFixed(4)
  const lon = (77.209 + (t.distanceToDestination ?? 0) * 0.0008).toFixed(4)
  const freq = '128.375'
  const squawk = '7700'

  return (
    <div className="status-strip" style={{ gridArea: 'strip', height: '32px' }}>
      {/* GPS */}
      <div className="strip-item">
        <div className="strip-label">GPS POSITION</div>
        <div className="strip-value" style={{ color: 'var(--dt-cyan)' }}>
          {lat}°N {lon}°E
        </div>
      </div>

      {/* Squawk */}
      <div className="strip-item">
        <div className="strip-label">SQUAWK</div>
        <div className="strip-value" style={{ color: 'var(--dt-amber)' }}>
          {squawk}
        </div>
      </div>

      {/* ATC Freq */}
      <div className="strip-item">
        <div className="strip-label">ATC FREQ</div>
        <div className="strip-value">{freq} MHz</div>
      </div>

      {/* Dist */}
      <div className="strip-item">
        <div className="strip-label">DIST DEST</div>
        <div className="strip-value">{(t.distanceToDestination ?? 0).toFixed(0)} NM</div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Local time */}
      <div
        className="strip-item"
        style={{ borderRight: 'none', borderLeft: '1px solid var(--dt-border)' }}
      >
        <div className="strip-label">LOCAL</div>
        <div className="strip-value">{localStr}</div>
      </div>

      {/* Zulu */}
      <div className="strip-item">
        <div className="strip-label">ZULU</div>
        <div className="strip-value" style={{ color: 'var(--dt-cyan)' }}>
          {zulu}Z
        </div>
      </div>

      {/* Mode toggle */}
      <div
        className="strip-item"
        style={{ borderRight: 'none', cursor: 'pointer' }}
        onClick={nextMode}
      >
        <div className="strip-label">MODE</div>
        <div
          className="strip-value"
          style={{
            color: MODE_COLORS[mode],
            textShadow: `0 0 6px ${MODE_COLORS[mode]}`,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '9px',
            letterSpacing: '0.08em',
          }}
        >
          {mode}
        </div>
      </div>
    </div>
  )
}
