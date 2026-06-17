import { useTelemetryStore } from '../../store/useTelemetryStore'
import { GaugeArc } from '../shared/GaugeArc'
import { motion } from 'framer-motion'

export function SystemDashboard() {
  const telemetry = useTelemetryStore((s) => s.data)

  // Subsections animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  } as const

  // Heading degrees helper
  const formatHeading = (deg: number) => {
    return `${Math.round(deg).toString().padStart(3, '0')}°`
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 h-full overflow-y-auto w-full select-none"
    >
      {/* ── CARD 1: PRIMARY FLIGHT TELEMETRY ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">PRIMARY TELEMETRY</div>
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="data-row">
              <span className="data-label">ALTITUDE</span>
              <span className="data-value text-primary glow-primary font-hud">
                {Math.round(telemetry.altitude).toLocaleString()} FT
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">INDICATED AIRSPEED</span>
              <span className="data-value text-primary glow-primary font-hud">
                {Math.round(telemetry.indicatedAirspeed)} KTS
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">GROUND SPEED</span>
              <span className="data-value text-bright font-hud">
                {Math.round(telemetry.groundSpeed)} KTS
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">VERTICAL SPEED</span>
              <span className={`data-value font-hud ${telemetry.verticalSpeed >= 100 ? 'text-success' : telemetry.verticalSpeed <= -100 ? 'text-emergency' : 'text-bright'}`}>
                {telemetry.verticalSpeed >= 0 ? '+' : ''}
                {Math.round(telemetry.verticalSpeed)} FPM
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 2: ATTITUDE & G-FORCE ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">ATTITUDE & VECTOR</div>
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="data-row">
              <span className="data-label">HEADING</span>
              <span className="data-value text-accent glow-amber font-hud">
                {formatHeading(telemetry.heading)}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">PITCH ANGLE</span>
              <span className="data-value font-hud">{telemetry.pitch.toFixed(1)}°</span>
            </div>
            <div className="data-row">
              <span className="data-label">ROLL ANGLE</span>
              <span className="data-value font-hud">{telemetry.roll.toFixed(1)}°</span>
            </div>
            <div className="data-row">
              <span className="data-label">G-FORCE</span>
              <span className={`data-value font-hud ${telemetry.gForce > 2.0 ? 'text-warning' : 'text-primary'}`}>
                {telemetry.gForce.toFixed(2)} G
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 3: PROPULSION (ENGINES) ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 col-span-1 md:col-span-2 flex flex-col min-h-[200px]">
        <div className="section-header">PROPULSION SYSTEMS</div>
        <div className="grid grid-cols-2 gap-4 flex-1 items-center justify-items-center py-2">
          {/* Engine 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className="font-hud text-[10px] text-muted tracking-wider">ENGINE 1 (LEFT)</div>
            <div className="flex gap-4 items-center">
              <GaugeArc
                value={telemetry.n1Left}
                max={110}
                size={80}
                color="var(--dt-cyan)"
                label="N1 THRUST"
                unit="%"
              />
              <div className="text-[10px] font-mono flex flex-col gap-1">
                <div>N2: <span className="text-bright">{telemetry.n2Left.toFixed(1)}%</span></div>
                <div>EGT: <span className="text-accent">{Math.round(telemetry.egt)}°C</span></div>
                <div>OIL: <span className="text-success">{Math.round(telemetry.oilPressure)} PSI</span></div>
                <div>HLTH: <span className={(telemetry.engineHealthLeft ?? 100) < 95 ? 'text-emergency font-bold' : 'text-success'}>{(telemetry.engineHealthLeft ?? 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>

          {/* Engine 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="font-hud text-[10px] text-muted tracking-wider">ENGINE 2 (RIGHT)</div>
            <div className="flex gap-4 items-center">
              <GaugeArc
                value={telemetry.n1Right}
                max={110}
                size={80}
                color="var(--dt-cyan)"
                label="N1 THRUST"
                unit="%"
              />
              <div className="text-[10px] font-mono flex flex-col gap-1">
                <div>N2: <span className="text-bright">{telemetry.n2Right.toFixed(1)}%</span></div>
                <div>EGT: <span className="text-accent">{Math.round(telemetry.egt)}°C</span></div>
                <div>OIL: <span className="text-success">{Math.round(telemetry.oilPressure)} PSI</span></div>
                <div>HLTH: <span className={(telemetry.engineHealthRight ?? 100) < 95 ? 'text-emergency font-bold' : 'text-success'}>{(telemetry.engineHealthRight ?? 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 4: FUEL MANAGEMENT ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">FUEL DIAGNOSTICS</div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="data-row">
              <span className="data-label">LEFT TANK</span>
              <span className="data-value font-hud">{Math.round(telemetry.fuelLeft).toLocaleString()} LBS</span>
            </div>
            <div className="data-row">
              <span className="data-label">RIGHT TANK</span>
              <span className="data-value font-hud">{Math.round(telemetry.fuelRight).toLocaleString()} LBS</span>
            </div>
            <div className="data-row">
              <span className="data-label">TOTAL FUEL</span>
              <span className={`data-value font-hud ${telemetry.fuelTotal < 8000 ? 'text-emergency glow-emergency' : telemetry.fuelTotal < 15000 ? 'text-caution' : 'text-success'}`}>
                {Math.round(telemetry.fuelTotal).toLocaleString()} LBS
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">FLOW RATE</span>
              <span className="data-value font-hud text-accent">{Math.round(telemetry.fuelBurnRate).toLocaleString()} LBS/HR</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 5: HYDRAULICS & CABIN SYSTEMS ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">UTILITY SYSTEMS</div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="data-row">
              <span className="data-label">HYD PRESS</span>
              <span className={`data-value font-hud ${telemetry.hydraulicsPressure < 2500 ? 'text-emergency' : 'text-success'}`}>
                {Math.round(telemetry.hydraulicsPressure)} PSI
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">CABIN ALT</span>
              <span className="data-value font-hud">{Math.round(telemetry.cabinAltitude).toLocaleString()} FT</span>
            </div>
            <div className="data-row">
              <span className="data-label">CABIN DIFF</span>
              <span className="data-value font-hud">{telemetry.cabinPressure.toFixed(2)} PSI</span>
            </div>
            <div className="data-row">
              <span className="data-label">OAT</span>
              <span className="data-value font-hud">{telemetry.outsideAirTemp.toFixed(1)} °C</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 6: WIND & NAVIGATION ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">ENVIRONMENTAL / NAV</div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="data-row">
              <span className="data-label">WIND VECTOR</span>
              <span className="data-value font-hud text-bright">
                {telemetry.windDirection}° / {Math.round(telemetry.windSpeed)} KTS
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">VISIBILITY</span>
              <span className="data-value font-hud">{telemetry.visibility} NM</span>
            </div>
            <div className="data-row">
              <span className="data-label">DIST TO DEST</span>
              <span className="data-value font-hud text-primary glow-primary">
                {telemetry.distanceToDestination.toFixed(1)} NM
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">ETA</span>
              <span className="data-value font-hud">
                {telemetry.groundSpeed > 50
                  ? `${(telemetry.distanceToDestination / telemetry.groundSpeed).toFixed(1)} HRS`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── CARD 7: COMPOSITE RISK SCORE ── */}
      <motion.div variants={cardVariants} className="glass-panel corner-bracket p-4 flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="section-header">RISK ANALYSIS</div>
          <div className="flex flex-col items-center justify-center flex-1 py-1 gap-2">
            <GaugeArc
              value={telemetry.riskScore}
              max={100}
              size={90}
              color={telemetry.riskScore > 50 ? 'var(--dt-red)' : telemetry.riskScore > 25 ? 'var(--dt-amber)' : 'var(--dt-green)'}
              label="COMPOSITE RISK"
              unit="SCORE"
            />
            {telemetry.riskScore > 30 && (
              <div className="text-[9px] text-emergency animate-pulse font-hud tracking-wider">
                ⚠ RISK LIMIT ELEVATED
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
