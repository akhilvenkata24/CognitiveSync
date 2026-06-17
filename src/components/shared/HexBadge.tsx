interface Props {
  size?: number
  color?: string
  borderColor?: string
  label?: string
  icon?: string
  active?: boolean
  completed?: boolean
  pulsing?: boolean
}

export function HexBadge({
  size = 32,
  color = '#00F5FF',
  borderColor,
  label,
  icon,
  active = false,
  completed = false,
  pulsing = false,
}: Props) {
  const bc = borderColor ?? color
  const s = size
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 3

  // Flat-top hexagon points
  const hex = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30)
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ position: 'relative', width: s, height: s }}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ overflow: 'visible' }}>
          {/* Pulse ring */}
          {pulsing && (
            <polygon
              points={hex}
              fill="none"
              stroke={bc}
              strokeWidth={1}
              opacity={0}
              style={{
                animation: 'pulse-beacon 1.8s ease-out infinite',
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          )}

          {/* Background */}
          <polygon
            points={hex}
            fill={
              completed
                ? `rgba(0,255,136,0.15)`
                : active
                  ? `rgba(0,245,255,0.10)`
                  : 'rgba(10,24,48,0.9)'
            }
          />

          {/* Border */}
          <polygon
            points={hex}
            fill="none"
            stroke={completed ? '#00FF88' : active ? bc : 'rgba(22,42,72,0.8)'}
            strokeWidth={completed || active ? 1.5 : 1}
            style={{
              filter: active || completed ? `drop-shadow(0 0 4px ${bc})` : 'none',
            }}
          />

          {/* Icon or check */}
          {(icon || completed) && (
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={s * 0.38}
              fill={completed ? '#00FF88' : color}
              style={{ userSelect: 'none', fontFamily: 'system-ui' }}
            >
              {completed ? '✓' : icon}
            </text>
          )}
        </svg>
      </div>

      {label && (
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '8px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: active ? color : completed ? '#00FF88' : 'var(--dt-text-dim)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
