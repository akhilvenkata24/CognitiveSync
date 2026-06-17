import { useFlightStore } from '../../store/useFlightStore'
import { useAlertStore } from '../../store/useAlertStore'
import { useUIStore } from '../../store/useUIStore'
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
      style={{ fontSize: '13px', letterSpacing: '0.18em' }}
    >
      {h}:{m}:{s}
    </span>
  )
}

function RadarArcLogo() {
  return (
    <svg
      width={38}
      height={38}
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

function SignalBars({ strength = 4 }: { strength?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            width: 3,
            height: 3 + n * 2.5,
            borderRadius: '1px',
            background: n <= strength ? 'var(--dt-green)' : 'var(--dt-border-2)',
            boxShadow: n <= strength ? '0 0 4px var(--dt-green)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function Header() {
  const { totalMissionElapsedSeconds, isRunning } = useFlightStore()
  const { activeView, setView } = useUIStore()
  const alerts = useAlertStore((s) => s.alerts)
  const activeAlerts = alerts.filter((a) => !a.acknowledged)
  const activeEmergency = alerts.find((a) => a.severity === 'EMERGENCY' && !a.acknowledged)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utcStr = time.toUTCString().split(' ').slice(4, 5)[0]

  return (
    <header
      className="flex items-center justify-between w-full h-[64px] border-b border-slate-800 px-4 select-none relative overflow-hidden shrink-0 z-50"
      style={{
        background:
          'linear-gradient(90deg, rgba(1,8,16,0.99) 0%, rgba(5,15,30,0.97) 30%, rgba(8,20,40,0.96) 50%, rgba(5,15,30,0.97) 70%, rgba(1,8,16,0.99) 100%)',
      }}
    >
      {/* Bottom edge glowing line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--dt-cyan-edge) 20%, var(--dt-cyan) 50%, var(--dt-cyan-edge) 80%, transparent 100%)',
          opacity: 0.65,
        }}
      />

      {/* scanline */}
      <div className="scanline-overlay" />

      {/* Brand area */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="relative w-[38px] h-[38px] shrink-0">
          <RadarArcLogo />
          <div
            className="absolute inset-[6px] rounded flex items-center justify-center text-sm font-bold font-hud select-none"
            style={{
              background: 'linear-gradient(135deg, #00F5FF, #0055AA)',
              boxShadow: '0 0 12px rgba(0,245,255,0.35)',
            }}
          >
            ✈
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-hud text-bright tracking-wider text-[13px] font-bold">AEROTWIN AI</span>
          <span className="text-muted font-data text-[8px] tracking-wider font-semibold">
            DIGITAL TWIN COMMAND CENTER
          </span>
        </div>
        <div className="w-[1px] h-7 bg-slate-800 mx-1 hidden sm:block" />
        <span className="text-[7px] font-hud tracking-widest text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded hidden sm:block">
          CLASSIFIED
        </span>
      </div>

      {/* Center View Selector */}
      <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-md p-0.5 relative">
        <button
          onClick={() => setView('cockpit')}
          className={`px-4 py-1 text-[10px] font-hud tracking-widest rounded transition-all duration-200 cursor-pointer ${
            activeView === 'cockpit'
              ? 'bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'border border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          COCKPIT VIEW
        </button>
        <button
          onClick={() => setView('dashboard')}
          className={`px-4 py-1 text-[10px] font-hud tracking-widest rounded transition-all duration-200 cursor-pointer ${
            activeView === 'dashboard'
              ? 'bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'border border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          SYSTEM DASHBOARD
        </button>

        {activeEmergency && (
          <div className="absolute top-[38px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/80 border border-red-500 text-red-400 px-3 py-0.5 rounded text-[8px] font-hud tracking-widest animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            ⚠ EMERGENCY · {activeEmergency.message}
          </div>
        )}
      </div>

      {/* Right side stats/meters */}
      <div className="flex items-center gap-4 min-w-[240px] justify-end">
        {/* Comms indicator */}
        <div className="flex flex-col items-center gap-1">
          <SignalBars strength={isRunning ? 4 : 2} />
          <span className="text-[7px] font-data tracking-wider text-muted font-bold">COMMS</span>
        </div>

        <div className="w-[1px] h-7 bg-slate-800 hidden sm:block" />

        {/* Mission clock */}
        <div className="text-right hidden sm:block">
          <div className="text-[8px] font-data text-muted tracking-wider">MISSION ELAPSED</div>
          <MissionClock totalSeconds={totalMissionElapsedSeconds} />
        </div>

        <div className="w-[1px] h-7 bg-slate-800" />

        {/* Zulu time */}
        <div className="text-right">
          <div className="text-[8px] font-data text-muted tracking-wider">ZULU TIME</div>
          <div className="font-mono text-bright text-[12px] tracking-wider">{utcStr}Z</div>
        </div>

        <div className="w-[1px] h-7 bg-slate-800" />

        {/* Alerts count badge */}
        <div
          className={`px-2 py-0.5 rounded text-center min-w-[44px] border transition-all ${
            activeAlerts.length > 0
              ? 'bg-red-500/10 border-red-500/30 animate-pulse'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-[7px] font-data text-muted tracking-wider font-semibold">ALERTS</div>
          <div
            className="font-hud text-sm font-bold"
            style={{
              color:
                activeAlerts.length > 0
                  ? SEVERITY_COLORS[alerts[0]?.severity ?? 'INFO']
                  : 'var(--dt-text-dim)',
            }}
          >
            {activeAlerts.length.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </header>
  )
}
