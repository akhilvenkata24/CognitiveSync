import { useFlightStore } from '../../store/useFlightStore'
import { useTelemetryStore } from '../../store/useTelemetryStore'
import { FLIGHT_PHASE_ORDER, FLIGHT_PHASE_LABELS, FLIGHT_PHASE_ICONS } from '../../types/flightPhase'
import { motion } from 'framer-motion'

export function BottomTimeline() {
  const {
    currentPhase,
    phaseProgress,
    advancePhase,
    setPhase,
    isRunning,
    startMission,
    isMissionComplete,
  } = useFlightStore()

  const telemetry = useTelemetryStore((s) => s.data)

  const currentIndex = FLIGHT_PHASE_ORDER.indexOf(currentPhase)

  // Derived GPS coordinate positions
  const lat = (28.6139 + (telemetry.distanceToDestination ?? 0) * 0.001).toFixed(4)
  const lon = (77.209 + (telemetry.distanceToDestination ?? 0) * 0.0008).toFixed(4)

  return (
    <div
      className="w-full h-[64px] border-t border-slate-800 flex items-center justify-between px-4 select-none shrink-0 relative overflow-hidden z-40 bg-slate-950/98"
      style={{
        boxShadow: '0 -4px 24px rgba(1, 8, 16, 0.8)',
      }}
    >
      {/* Top thin line highlighting bottom deck */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--dt-cyan-edge) 20%, var(--dt-cyan) 50%, var(--dt-cyan-edge) 80%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* ─── LEFT: CONTROLS & LED ─── */}
      <div className="flex items-center gap-3 min-w-[200px]">
        {!isRunning && !isMissionComplete && (
          <button
            onClick={startMission}
            className="aero-btn success cursor-pointer font-hud text-[9px] py-1 px-3.5 tracking-wider shadow-[0_0_12px_rgba(0,255,136,0.15)]"
          >
            ▶ LAUNCH SIM
          </button>
        )}
        {isRunning && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="status-led nominal" />
              <span className="font-hud text-success text-[10px] tracking-widest font-bold">LIVE</span>
            </div>
            {!isMissionComplete && (
              <button
                onClick={advancePhase}
                className="aero-btn cursor-pointer font-hud text-[9px] py-0.5 px-2.5 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/10"
              >
                NEXT PHASE →
              </button>
            )}
          </div>
        )}
        {isMissionComplete && (
          <div className="flex items-center gap-1.5">
            <span className="status-led nominal" />
            <span className="font-hud text-primary glow-primary text-[10px] tracking-widest font-bold">
              CONCLUDED
            </span>
          </div>
        )}
      </div>

      {/* ─── CENTER: HORIZONTAL FLOW ─── */}
      <div className="flex-1 flex items-center justify-center relative px-8 overflow-x-auto max-w-[calc(100vw-440px)] scrollbar-none">
        {/* Timeline connector bar */}
        <div className="absolute left-[36px] right-[36px] h-[2px] bg-slate-800 top-1/2 -translate-y-1/2 z-0" />
        
        {/* Connected completed path */}
        <div
          className="absolute left-[36px] h-[2px] bg-gradient-to-r from-emerald-500 to-cyan-400 top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
          style={{
            width: `calc(${
              (currentIndex / (FLIGHT_PHASE_ORDER.length - 1)) * 100
            }% - 12px)`,
          }}
        />

        {/* Phase nodes */}
        <div className="w-full flex items-center justify-between z-10 gap-2 min-w-[700px]">
          {FLIGHT_PHASE_ORDER.map((phase, idx) => {
            const isActive = phase === currentPhase
            const isCompleted = idx < currentIndex
            const isFuture = idx > currentIndex

            return (
              <div
                key={phase}
                onClick={() => setPhase(phase)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                  isFuture ? 'opacity-40 hover:opacity-75' : 'opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs relative transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(0,245,255,0.4)]'
                      : isCompleted
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{FLIGHT_PHASE_ICONS[phase]}</span>

                  {/* Pulsing glow ring on active phase */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-full border border-cyan-400/30 animate-ping" />
                  )}
                </div>

                <span
                  className={`text-[8px] font-hud tracking-widest font-semibold text-center whitespace-nowrap ${
                    isActive
                      ? 'text-cyan-400 font-bold'
                      : isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                  }`}
                >
                  {FLIGHT_PHASE_LABELS[phase].toUpperCase()}
                  {isActive && (
                    <span className="block text-[7px] font-mono text-muted/80 font-normal mt-0.5">
                      {(phaseProgress * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── RIGHT: STATUS STRIP TELEMETRY ─── */}
      <div className="flex items-center gap-4 min-w-[220px] justify-end border-l border-slate-800 pl-4 h-9">
        {/* GPS coordinates */}
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-data text-muted tracking-wider font-semibold">GPS COORDS</span>
          <span className="text-[10px] font-mono text-primary font-medium">
            {lat}°N {lon}°E
          </span>
        </div>

        <div className="w-[1px] h-5 bg-slate-900" />

        {/* ATC frequency */}
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-data text-muted tracking-wider font-semibold">ATC FREQ</span>
          <span className="text-[10px] font-mono text-bright">128.375 MHz</span>
        </div>

        <div className="w-[1px] h-5 bg-slate-900" />

        {/* Squawk */}
        <div className="flex flex-col items-end">
          <span className="text-[7px] font-data text-muted tracking-wider font-semibold">SQUAWK</span>
          <span className="text-[10px] font-mono text-accent">7700</span>
        </div>
      </div>
    </div>
  )
}
