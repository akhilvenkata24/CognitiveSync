import { useFlightStore } from '../../store/flightStore'
import { useTelemetryStore } from '../../store/aircraftStore'
import { usePilotStore } from '../../store/pilotStore'
import { useCameraStore } from '../../store/cameraStore'
import { CAMERA_PRESETS } from '../../types/camera'
import { FLIGHT_PHASE_LABELS, FLIGHT_PHASE_ICONS } from '../../types/flightPhase'
import { GaugeArc } from '../shared/GaugeArc'
import { StatusLED } from '../shared/StatusLED'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export function MissionControlDashboard() {
  const flight = useFlightStore()
  const telemetry = useTelemetryStore((s) => s.data)
  const pilot = usePilotStore((s) => s.data)
  const { activeCamera, switchCamera } = useCameraStore()

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const localStr = time.toLocaleTimeString('en-IN', { hour12: false })
  const utcStr = time.toUTCString().split(' ').slice(4, 5)[0]

  // Derived GPS coordinate positions
  const lat = (28.6139 + (telemetry.distanceToDestination ?? 0) * 0.001).toFixed(4)
  const lon = (77.209 + (telemetry.distanceToDestination ?? 0) * 0.0008).toFixed(4)

  const activePreset = CAMERA_PRESETS[activeCamera]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
  } as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full overflow-y-auto w-full select-none"
    >
      {/* ── PANEL 1: AIRCRAFT TELEMETRY STATUS ── */}
      <motion.div variants={itemVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between">
        <div>
          <div className="section-header">AIRCRAFT STATUS</div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex flex-col items-center justify-center p-2 bg-slate-900/35 border border-slate-900 rounded">
              <span className="text-[8px] font-data text-muted tracking-wider">ALTITUDE</span>
              <span className="font-hud text-bright text-sm mt-1">{Math.round(telemetry.altitude).toLocaleString()} FT</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-slate-900/35 border border-slate-900 rounded">
              <span className="text-[8px] font-data text-muted tracking-wider">AIRSPEED</span>
              <span className="font-hud text-primary glow-primary text-sm mt-1">{Math.round(telemetry.indicatedAirspeed)} KTS</span>
            </div>
          </div>

          <div className="flex justify-around items-center py-4 border-b border-slate-900/60">
            <GaugeArc
              value={telemetry.n1Left}
              max={110}
              size={64}
              color="var(--dt-cyan)"
              label="ENG 1 (N1)"
              unit="%"
            />
            <GaugeArc
              value={telemetry.n1Right}
              max={110}
              size={64}
              color="var(--dt-cyan)"
              label="ENG 2 (N1)"
              unit="%"
            />
            <GaugeArc
              value={(telemetry.fuelTotal / 36800) * 100}
              max={100}
              size={64}
              color="var(--dt-green)"
              label="FUEL LEVEL"
              unit="%"
            />
          </div>

          <div className="flex flex-col gap-2 mt-3 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Engine Health (L/R):</span>
              <span className="text-bright">
                <span className={(telemetry.engineHealthLeft ?? 100) < 95 ? 'text-emergency font-bold' : 'text-success font-bold'}>
                  {(telemetry.engineHealthLeft ?? 100).toFixed(1)}%
                </span>
                <span className="text-muted mx-1">/</span>
                <span className={(telemetry.engineHealthRight ?? 100) < 95 ? 'text-emergency font-bold' : 'text-success font-bold'}>
                  {(telemetry.engineHealthRight ?? 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Hydraulics:</span>
              <span className={telemetry.hydraulicsPressure < 2600 ? 'text-emergency font-bold' : 'text-bright'}>
                {Math.round(telemetry.hydraulicsPressure)} PSI
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Cabin Diff Press:</span>
              <span className="text-bright">{telemetry.cabinPressure.toFixed(2)} PSI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Outside Temp:</span>
              <span className="text-bright">{telemetry.outsideAirTemp.toFixed(1)} °C</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PANEL 2: PILOT BIOMETRICS STATUS ── */}
      <motion.div variants={itemVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between">
        <div>
          <div className="section-header">PILOT STATUS</div>
          <div className="flex justify-around items-center py-3 border-b border-slate-900/60">
            <GaugeArc
              value={pilot.heartRate}
              max={160}
              size={64}
              color={pilot.heartRate > 90 ? 'var(--dt-red)' : 'var(--dt-green)'}
              label="HEART RATE"
              unit="bpm"
            />
            <GaugeArc
              value={pilot.spo2}
              max={100}
              size={64}
              color="var(--dt-cyan)"
              label="SpO2"
              unit="%"
            />
            <GaugeArc
              value={pilot.cognitiveLoad}
              max={100}
              size={64}
              color={pilot.cognitiveLoad > 75 ? 'var(--dt-orange)' : 'var(--dt-purple)'}
              label="COGNITIVE"
              unit="%"
            />
          </div>

          <div className="flex flex-col gap-2 mt-4 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Operator stress:</span>
              <span className={`font-hud text-[9px] ${pilot.stressLevel === 'HIGH' || pilot.stressLevel === 'CRITICAL' ? 'text-emergency' : 'text-bright'}`}>
                {pilot.stressLevel}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Fatigue index:</span>
              <span className="text-bright">{Math.round(pilot.fatigueIndex)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Eye Blink Rate:</span>
              <span className="text-bright">{Math.round(pilot.blinkRate)} /min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted uppercase">Gaze Vectors:</span>
              <span className="text-bright">X: {pilot.gazeX.toFixed(2)} Y: {pilot.gazeY.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PANEL 3: MISSION TIMELINE STATUS ── */}
      <motion.div variants={itemVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between">
        <div>
          <div className="section-header">MISSION STATUS</div>
          <div className="flex flex-col gap-3.5 mt-3 text-[10px] font-mono">
            <div className="flex justify-between items-center border-b border-slate-900/50 pb-2">
              <span className="text-muted uppercase">Zulu Clock:</span>
              <span className="text-primary font-hud text-[11px]">{utcStr}Z</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-900/50 pb-2">
              <span className="text-muted uppercase">Local Clock:</span>
              <span className="text-bright font-mono">{localStr}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-900/50 pb-2">
              <span className="text-muted uppercase">Elapsed Timer:</span>
              <span className="text-bright font-mono">
                {Math.floor(flight.totalMissionElapsedSeconds / 3600).toString().padStart(2, '0')}:
                {Math.floor((flight.totalMissionElapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
                {Math.floor(flight.totalMissionElapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-900/50 pb-2">
              <span className="text-muted uppercase">Destination Dist:</span>
              <span className="text-primary font-mono">{telemetry.distanceToDestination.toFixed(1)} NM</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-muted uppercase">Operator Comms:</span>
              <div className="flex items-center gap-1.5">
                <StatusLED status={flight.isRunning ? 'nominal' : 'caution'} />
                <span className="text-bright">{flight.isRunning ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PANEL 4: ACTIVE SENSOR CAMERA MONITOR ── */}
      <motion.div variants={itemVariants} className="glass-panel corner-bracket p-4 col-span-1 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="section-header">ACTIVE CAMERA VIEWPORT</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Live Camera Feed Simulator Box */}
            <div className="relative aspect-video rounded bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden">
              {/* Scanlines overlay */}
              <div className="scanline-overlay" />
              
              {/* Camera reticle crosshair */}
              <div className="absolute w-6 h-6 border-t border-b border-l border-r border-cyan-400/20" />
              <div className="absolute w-2 h-2 rounded-full bg-cyan-400/35" />

              {/* Feed simulation elements */}
              <div className="absolute top-2 left-2 font-mono text-[7px] text-cyan-400/70 tracking-widest uppercase">
                CAM: {activePreset.label.toUpperCase()}
              </div>
              <div className="absolute bottom-2 left-2 font-mono text-[7px] text-cyan-400/70 tracking-widest">
                FOV: {activePreset.fov}°
              </div>
              <div className="absolute bottom-2 right-2 font-mono text-[7px] text-cyan-400/70 tracking-widest">
                GPS: {lat}°N {lon}°E
              </div>

              <span className="font-hud text-[10px] text-cyan-400/40 tracking-widest select-none animate-pulse">
                [ CAMERA FEED SIMULATED ]
              </span>
            </div>

            {/* Active camera selector triggers */}
            <div className="flex flex-col gap-2 justify-center">
              {(['pilot', 'observer_left', 'observer_right', 'command'] as const).map((camId) => {
                const preset = CAMERA_PRESETS[camId]
                const isActive = activeCamera === camId

                return (
                  <button
                    key={camId}
                    onClick={() => switchCamera(camId)}
                    className={`flex items-center justify-between p-2.5 rounded border text-[10px] font-hud tracking-widest cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(0,245,255,0.15)] font-bold'
                        : 'bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{preset.icon}</span>
                      <span>{preset.label.toUpperCase()}</span>
                    </div>
                    {isActive && <span className="status-led nominal shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PANEL 5: FLIGHT PROGRESSION LIFE CARD ── */}
      <motion.div variants={itemVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between">
        <div>
          <div className="section-header">FLIGHT LIFE CYCLE</div>
          <div className="flex flex-col items-center gap-3 py-3 mt-1.5">
            {/* Hex badge styled phase representation */}
            <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center text-xl shadow-[0_0_16px_rgba(0,245,255,0.2)]">
              {FLIGHT_PHASE_ICONS[flight.currentPhase]}
            </div>
            
            <div className="text-center">
              <div className="font-hud text-bright tracking-widest text-xs font-bold">
                {FLIGHT_PHASE_LABELS[flight.currentPhase].toUpperCase()}
              </div>
              <div className="font-mono text-muted text-[8px] mt-1.5 uppercase tracking-wider">
                Simulation phase: {flight.currentPhase}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1.5">
              <span>PHASE PROGRESS</span>
              <span className="text-cyan-400">{(flight.phaseProgress * 100).toFixed(0)}%</span>
            </div>
            <div className="threat-bar-track h-[5px]">
              <motion.div
                className="threat-bar-fill bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_8px_rgba(0,245,255,0.5)]"
                animate={{ width: `${flight.phaseProgress * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
