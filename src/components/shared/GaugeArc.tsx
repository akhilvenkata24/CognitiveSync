import { useRef, useEffect } from 'react'

interface Props {
  value: number
  size?: number
  color?: string
  label?: string
  unit?: string
  displayValue?: string
  max?: number
}

export function GaugeArc({
  value,
  size = 72,
  color = '#00F5FF',
  label,
  unit,
  displayValue,
  max = 100,
}: Props) {
  const pct = Math.min(Math.max(value / max, 0), 1)
  const r = size / 2 - 7
  const stroke = size < 64 ? 5 : 6
  const circumference = Math.PI * r // half circle arc
  const cx = size / 2
  const cy = size / 2

  // Arc spans 200° (from -160° to +40°), starting bottom-left
  const startAngle = -220 // degrees
  const arcSpan = 240 // degrees total
  const endAngle = startAngle + arcSpan * pct

  function polarToXY(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function describeArc(start: number, end: number, radius: number) {
    const s = polarToXY(start, radius)
    const e = polarToXY(end, radius)
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  // Threat zone colors painted on track
  const zones = [
    { from: 0, to: 0.65, color: 'rgba(0,255,136,0.15)' },
    { from: 0.65, to: 0.8, color: 'rgba(255,229,0,0.15)' },
    { from: 0.8, to: 0.92, color: 'rgba(255,107,0,0.15)' },
    { from: 0.92, to: 1.0, color: 'rgba(255,26,60,0.20)' },
  ]

  // Tick marks at 0, 25, 50, 75, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1.0]

  return (
    <div className="gauge-wrap" style={{ width: size, position: 'relative' }}>
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* Zones on track */}
        {zones.map((z, i) => {
          const zStart = startAngle + arcSpan * z.from
          const zEnd = startAngle + arcSpan * z.to
          return (
            <path
              key={i}
              d={describeArc(zStart, zEnd, r)}
              fill="none"
              stroke={z.color}
              strokeWidth={stroke + 4}
              strokeLinecap="round"
            />
          )
        })}

        {/* Track */}
        <path
          d={describeArc(startAngle, startAngle + arcSpan, r)}
          fill="none"
          stroke="rgba(22,42,72,0.8)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Fill arc */}
        <path
          d={describeArc(startAngle, endAngle, r)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            transition: 'all 0.4s ease',
          }}
        />

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const tickAngle = startAngle + arcSpan * t
          const outer = polarToXY(tickAngle, r + 2)
          const inner = polarToXY(tickAngle, r - 2)
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(0,245,255,0.25)"
              strokeWidth={1}
            />
          )
        })}

        {/* Needle dot */}
        {pct > 0.02 &&
          (() => {
            const pos = polarToXY(endAngle, r)
            return (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={3}
                fill={color}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />
            )
          })()}
      </svg>

      {/* Center value */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: size < 64 ? '11px' : '14px',
            color,
            textShadow: `0 0 8px ${color}`,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {displayValue ?? value.toFixed(0)}
        </div>
        {unit && (
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '8px',
              color: 'var(--dt-text-dim)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            {unit}
          </div>
        )}
      </div>

      {/* Label below */}
      {label && (
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '9px',
            fontWeight: 600,
            color: 'var(--dt-text-dim)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginTop: '2px',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
