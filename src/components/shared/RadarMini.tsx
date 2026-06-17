import { useEffect, useRef } from 'react'
import { useTelemetryStore } from '../../store/useTelemetryStore'

interface Blip {
  angle: number
  dist: number
  size: number
  alpha: number
}

export function RadarMini() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sweepRef = useRef(0)
  const blipsRef = useRef<Blip[]>([
    { angle: 45, dist: 0.35, size: 3, alpha: 1 },
    { angle: 120, dist: 0.55, size: 2, alpha: 0.8 },
    { angle: 200, dist: 0.7, size: 2.5, alpha: 0.9 },
    { angle: 310, dist: 0.4, size: 2, alpha: 0.7 },
  ])
  const rafRef = useRef(0)
  const t = useTelemetryStore(s => s.data)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const S = 120
    const dpr = window.devicePixelRatio || 1
    canvas.width = S * dpr
    canvas.height = S * dpr
    ctx.scale(dpr, dpr)
    const cx = S / 2,
      cy = S / 2,
      R = S / 2 - 4

    function draw() {
      ctx.clearRect(0, 0, S, S)

      // Base circle
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,245,255,0.02)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,245,255,0.20)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Range rings
      ;[0.33, 0.66, 1].forEach(frac => {
        ctx.beginPath()
        ctx.arc(cx, cy, R * frac, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,245,255,0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Cross hairs
      ctx.strokeStyle = 'rgba(0,245,255,0.10)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(cx - R, cy)
      ctx.lineTo(cx + R, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - R)
      ctx.lineTo(cx, cy + R)
      ctx.stroke()

      // Sweep gradient
      const sweep = sweepRef.current
      const sweepGrad = ctx.createConicGradient
        ? ctx.createConicGradient(sweep - 1.2, cx, cy)
        : null

      if (!sweepGrad) {
        // Fallback: simple line
        const ex = cx + R * Math.cos(sweep)
        const ey = cy + R * Math.sin(sweep)
        const grad = ctx.createLinearGradient(cx, cy, ex, ey)
        grad.addColorStop(0, 'rgba(0,245,255,0.7)')
        grad.addColorStop(1, 'rgba(0,245,255,0)')
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.shadowColor = '#00F5FF'
        ctx.shadowBlur = 6
        ctx.stroke()
        ctx.shadowBlur = 0
      } else {
        sweepGrad.addColorStop(0, 'rgba(0,245,255,0)')
        sweepGrad.addColorStop(0.19, 'rgba(0,245,255,0.4)')
        sweepGrad.addColorStop(1, 'rgba(0,245,255,0)')
        ctx.beginPath()
        ctx.arc(cx, cy, R - 1, sweep - 1.2, sweep)
        ctx.lineTo(cx, cy)
        ctx.fillStyle = sweepGrad
        ctx.fill()
      }

      // Sweep line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + R * Math.cos(sweep), cy + R * Math.sin(sweep))
      ctx.strokeStyle = 'rgba(0,245,255,0.85)'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#00F5FF'
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0

      // Blips
      blipsRef.current.forEach(blip => {
        const bx = cx + R * blip.dist * Math.cos((blip.angle * Math.PI) / 180)
        const by = cy + R * blip.dist * Math.sin((blip.angle * Math.PI) / 180)
        ctx.beginPath()
        ctx.arc(bx, by, blip.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${blip.alpha * 0.9})`
        ctx.shadowColor = '#00FF88'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Center dot
      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#00F5FF'
      ctx.shadowColor = '#00F5FF'
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.shadowBlur = 0

      sweepRef.current += 0.02
      if (sweepRef.current > Math.PI * 2) sweepRef.current -= Math.PI * 2

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div className="radar-container" style={{ width: 120, height: 120 }}>
        <canvas ref={canvasRef} style={{ width: 120, height: 120, display: 'block' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#00FF88',
              boxShadow: '0 0 4px #00FF88',
            }}
          />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '8px',
              color: 'var(--dt-text-dim)',
              letterSpacing: '0.1em',
            }}
          >
            CONTACTS: {blipsRef.current.length}
          </span>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            color: 'var(--dt-text-dim)',
          }}
        >
          {t.distanceToDestination?.toFixed(0) ?? '--'} NM
        </div>
      </div>
    </div>
  )
}
