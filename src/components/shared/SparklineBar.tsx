import { useRef, useEffect } from 'react'

interface Props {
  data: number[] // array of 0–100 values
  color?: string
  height?: number
  width?: number
  filled?: boolean
}

export function SparklineBar({
  data,
  color = '#00F5FF',
  height = 28,
  width = 80,
  filled = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const xStep = width / (data.length - 1)

    const points = data.map((v, i) => ({
      x: i * xStep,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }))

    // Filled gradient under curve
    if (filled) {
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'))
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.moveTo(points[0].x, height)
      points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(points[points.length - 1].x, height)
      ctx.closePath()
      ctx.fillStyle = `rgba(0,245,255,0.10)`
      ctx.fill()
    }

    // Line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const cp = {
        x: (points[i - 1].x + points[i].x) / 2,
        y: (points[i - 1].y + points[i].y) / 2,
      }
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cp.x, cp.y)
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.shadowColor = color
    ctx.shadowBlur = 4
    ctx.stroke()

    // Last point dot
    const last = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowBlur = 8
    ctx.fill()
  }, [data, color, height, width, filled])

  return <canvas ref={canvasRef} style={{ width, height, display: 'block', opacity: 0.85 }} />
}
