import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  decimals?: number
  suffix?: string
  trend?: 'up' | 'down' | 'flat'
  flicker?: boolean
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  trend,
  flicker = false,
}: Props) {
  const [display, setDisplay] = useState(value)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const duration = 350

    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    rafRef.current = requestAnimationFrame(function step(ts) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / duration, 1)
      // ease-out cubic
      const eased = 1 - (1 - t) ** 3
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    })

    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : trend === 'flat' ? '—' : null
  const trendColor =
    trend === 'up'
      ? 'var(--dt-green)'
      : trend === 'down'
        ? 'var(--dt-orange)'
        : 'var(--dt-text-dim)'

  return (
    <span
      className={flicker ? 'animate-data-flicker' : ''}
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}
    >
      <span>{display.toFixed(decimals)}</span>
      {suffix && <span style={{ fontSize: '0.78em', opacity: 0.65 }}>{suffix}</span>}
      {trendIcon && (
        <span style={{ fontSize: '0.65em', color: trendColor, marginLeft: '2px' }}>
          {trendIcon}
        </span>
      )}
    </span>
  )
}
