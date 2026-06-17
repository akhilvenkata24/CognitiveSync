import { useTelemetryStore } from '../../store/useTelemetryStore'
import { useFlightStore } from '../../store/useFlightStore'
import { FlightPhase } from '../../types/flightPhase'
import { StatusLED } from '../shared/StatusLED'

export function RiskPanel() {
  const telemetry = useTelemetryStore((s) => s.data)
  const { currentPhase } = useFlightStore()

  // Calculate status levels purely from real store values (no mock state)
  const getEngineStatus = () => {
    if (telemetry.n1Left > 97 || telemetry.n1Right > 97) return 'warning'
    if (telemetry.n1Left < 15 && currentPhase !== FlightPhase.PREFLIGHT) return 'caution'
    return 'nominal'
  }

  const getFuelStatus = () => {
    if (telemetry.fuelTotal < 5000) return 'emergency'
    if (telemetry.fuelTotal < 10000) return 'caution'
    return 'nominal'
  }

  const getHydraulicsStatus = () => {
    if (telemetry.hydraulicsPressure < 2500) return 'emergency'
    if (telemetry.hydraulicsPressure < 2800) return 'caution'
    return 'nominal'
  }

  const getCabinStatus = () => {
    if (telemetry.cabinAltitude > 8000) return 'emergency'
    if (telemetry.cabinAltitude > 6000) return 'caution'
    return 'nominal'
  }

  const getOverallRiskText = (score: number) => {
    if (score > 60) return 'CRITICAL ANOMALY ALERT'
    if (score > 35) return 'ELEVATED HAZARD LEVEL'
    if (score > 15) return 'CAUTION MONITORING ACTIVE'
    return 'NOMINAL FLIGHT OPERATIONS'
  }

  const getOverallRiskColor = (score: number) => {
    if (score > 60) return 'var(--dt-red)'
    if (score > 35) return 'var(--dt-orange)'
    if (score > 15) return 'var(--dt-amber)'
    return 'var(--dt-green)'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Risk Summary Header */}
      <div
        className="glass-panel p-3.5 border-l-4"
        style={{
          borderLeftColor: getOverallRiskColor(telemetry.riskScore),
        }}
      >
        <div className="font-data text-[9px] text-muted tracking-wider">RISK PROFILE STATUS</div>
        <div
          className="font-hud text-xs mt-1 font-bold"
          style={{
            color: getOverallRiskColor(telemetry.riskScore),
            textShadow: `0 0 8px ${getOverallRiskColor(telemetry.riskScore)}`,
          }}
        >
          {getOverallRiskText(telemetry.riskScore)}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] font-mono">
          <span className="text-muted">RISK INDEX:</span>
          <span
            className="font-hud text-sm"
            style={{ color: getOverallRiskColor(telemetry.riskScore) }}
          >
            {telemetry.riskScore.toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* Hazard Matrices */}
      <div>
        <div className="section-header">HAZARD MATRICES</div>
        <div className="flex flex-col gap-1.5 mt-2">
          {/* Engines */}
          <div className="glass-panel p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusLED status={getEngineStatus()} />
              <div className="flex flex-col">
                <span className="text-[10px] font-hud tracking-wide text-bright">ENGINES (N1/N2)</span>
                <span className="text-[8px] font-mono text-muted">Core speed & EGT tolerance</span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase text-muted tracking-wider">
              {getEngineStatus() === 'nominal' ? 'NOMINAL' : getEngineStatus() === 'caution' ? 'LOW THRUST' : 'OVERTHRUST'}
            </span>
          </div>

          {/* Fuel */}
          <div className="glass-panel p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusLED status={getFuelStatus()} />
              <div className="flex flex-col">
                <span className="text-[10px] font-hud tracking-wide text-bright">FUEL PRESSURE</span>
                <span className="text-[8px] font-mono text-muted">Flow rate & main tank capacity</span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase text-muted tracking-wider">
              {getFuelStatus() === 'nominal' ? 'NOMINAL' : getFuelStatus() === 'caution' ? 'LOW FUEL' : 'CRITICAL LOW'}
            </span>
          </div>

          {/* Hydraulics */}
          <div className="glass-panel p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusLED status={getHydraulicsStatus()} />
              <div className="flex flex-col">
                <span className="text-[10px] font-hud tracking-wide text-bright">HYDRAULIC LOOP</span>
                <span className="text-[8px] font-mono text-muted">System pressure integrity</span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase text-muted tracking-wider">
              {getHydraulicsStatus() === 'nominal' ? 'NOMINAL' : getHydraulicsStatus() === 'caution' ? 'LOSS ALERT' : 'CRITICAL FAIL'}
            </span>
          </div>

          {/* Cabin Environment */}
          <div className="glass-panel p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusLED status={getCabinStatus()} />
              <div className="flex flex-col">
                <span className="text-[10px] font-hud tracking-wide text-bright">CABIN ATMOSPHERE</span>
                <span className="text-[8px] font-mono text-muted">Altitude differential & OAT</span>
              </div>
            </div>
            <span className="text-[9px] font-mono uppercase text-muted tracking-wider">
              {getCabinStatus() === 'nominal' ? 'NOMINAL' : getCabinStatus() === 'caution' ? 'DIFF WARN' : 'DEPRESSURIZED'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Anomaly Warnings */}
      <div>
        <div className="section-header">ACTIVE ANOMALY FLAGS</div>
        {telemetry.anomalyFlags && telemetry.anomalyFlags.length > 0 ? (
          <div className="flex flex-col gap-2 mt-2">
            {telemetry.anomalyFlags.map((flag, idx) => (
              <div
                key={idx}
                className="glass-panel p-2.5 border-l-2 border-l-red-500 bg-red-950/20 text-red-400 font-mono text-[9px] flex items-center gap-2"
              >
                <span>⚠</span>
                <span>{flag.toUpperCase()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-4 text-center mt-2 border-dashed border-slate-800">
            <div className="font-mono text-[9px] text-muted tracking-wider">NO ACTIVE THREATS FOUND</div>
            <div className="font-mono text-[7px] text-muted/60 mt-1 uppercase">Continuous sensor diagnostics active</div>
          </div>
        )}
      </div>
    </div>
  )
}
