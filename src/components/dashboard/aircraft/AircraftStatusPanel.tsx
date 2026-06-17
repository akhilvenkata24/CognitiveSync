import { useTelemetryStore } from '../../../store/useTelemetryStore'
import { useFlightStore } from '../../../store/useFlightStore'
import { GaugeArc } from '../../shared/GaugeArc'
import { AnimatedNumber } from '../../shared/AnimatedNumber'
import { StatusLED } from '../../shared/StatusLED'
import { TacticalCard } from '../../shared/TacticalCard'
import { SparklineBar } from '../../shared/SparklineBar'
import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'

/** Rolling sparkline hook */
function useSparkline(value: number, length = 30) {
  const histRef = useRef<number[]>([])
  useEffect(() => {
    histRef.current = [...histRef.current, value].slice(-length)
  }, [value, length])
  return histRef.current
}

function DataRow({
  label,
  value,
  unit = '',
  color,
}: {
  label: string
  value: string | number
  unit?: string
  color?: string
}) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      <span className="data-value" style={color ? { color } : {}}>
        {typeof value === 'number' ? value.toFixed(0) : value}
        {unit && (
          <span className="text-muted" style={{ fontSize: '10px', marginLeft: '3px' }}>
            {unit}
          </span>
        )}
      </span>
    </div>
  )
}

function FlightDataGrid() {
  const t = useTelemetryStore(s => s.data)
  const altHist = useSparkline(t.altitude, 30)
  const iasHist = useSparkline(t.indicatedAirspeed, 30)

  const tiles = [
    {
      label: 'ALTITUDE',
      val: t.altitude,
      unit: 'FT',
      decimals: 0,
      color: 'var(--dt-cyan)',
      hist: altHist,
    },
    {
      label: 'IAS',
      val: t.indicatedAirspeed,
      unit: 'KTS',
      decimals: 0,
      color: 'var(--dt-cyan)',
      hist: iasHist,
    },
    {
      label: 'GND SPD',
      val: t.groundSpeed,
      unit: 'KTS',
      decimals: 0,
      color: 'var(--dt-text-bright)',
      hist: [],
    },
    {
      label: 'V/S',
      val: t.verticalSpeed,
      unit: 'FPM',
      decimals: 0,
      color:
        t.verticalSpeed > 50
          ? 'var(--dt-green)'
          : t.verticalSpeed < -50
            ? 'var(--dt-orange)'
            : 'var(--dt-text-dim)',
      hist: [],
    },
  ]

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}
    >
      {tiles.map(tile => (
        <div
          key={tile.label}
          style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.04), rgba(0,245,255,0.02))',
            border: '1px solid var(--dt-border)',
            borderRadius: '5px',
            padding: '8px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="data-label" style={{ marginBottom: '2px', fontSize: '9px' }}>
            {tile.label}
          </div>
          <div
            className="font-hud glow-primary"
            style={{ fontSize: '15px', color: tile.color, lineHeight: 1 }}
          >
            <AnimatedNumber value={tile.val} decimals={tile.decimals} />
          </div>
          <div
            className="font-data text-muted"
            style={{ fontSize: '8px', letterSpacing: '0.12em' }}
          >
            {tile.unit}
          </div>
          {tile.hist.length > 2 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.5 }}>
              <SparklineBar data={tile.hist} color={tile.color} height={12} width={100} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EngineGauges() {
  const t = useTelemetryStore(s => s.data)
  const n1Color = (n1: number) =>
    n1 > 95 ? 'var(--dt-red)' : n1 > 85 ? 'var(--dt-yellow)' : 'var(--dt-cyan)'
  const egtColor = (egt: number) =>
    egt > 870 ? 'var(--dt-red)' : egt > 820 ? 'var(--dt-orange)' : 'var(--dt-cyan)'

  const engineThreat =
    t.n1Left > 95 || t.n1Right > 95 || t.egt > 870
      ? 'emergency'
      : t.n1Left > 85 || t.n1Right > 85 || t.egt > 820
        ? 'warning'
        : 'nominal'

  return (
    <TacticalCard title="ENGINE GAUGES" threatLevel={engineThreat}>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
        <GaugeArc
          value={t.n1Left}
          size={76}
          color={n1Color(t.n1Left)}
          label="N1 LEFT"
          unit="%"
          displayValue={t.n1Left.toFixed(1)}
        />
        <GaugeArc
          value={t.n1Right}
          size={76}
          color={n1Color(t.n1Right)}
          label="N1 RIGHT"
          unit="%"
          displayValue={t.n1Right.toFixed(1)}
        />
        <GaugeArc
          value={t.egt / 10}
          size={76}
          color={egtColor(t.egt)}
          label="EGT"
          unit="°C"
          displayValue={t.egt.toFixed(0)}
          max={100}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
        <DataRow label="N2 L" value={`${t.n2Left.toFixed(1)}%`} />
        <DataRow label="N2 R" value={`${t.n2Right.toFixed(1)}%`} />
        <DataRow
          label="OIL PSI"
          value={`${t.oilPressure.toFixed(0)}`}
          unit="psi"
          color={t.oilPressure < 50 && t.n1Left > 10 ? 'var(--dt-orange)' : undefined}
        />
        <DataRow label="OIL °C" value={`${t.oilTemp.toFixed(0)}`} unit="°C" />
        <DataRow
          label="HLTH L"
          value={`${(t.engineHealthLeft ?? 100).toFixed(1)}%`}
          color={(t.engineHealthLeft ?? 100) < 95 ? 'var(--dt-red)' : (t.engineHealthLeft ?? 100) < 98 ? 'var(--dt-orange)' : 'var(--dt-green)'}
        />
        <DataRow
          label="HLTH R"
          value={`${(t.engineHealthRight ?? 100).toFixed(1)}%`}
          color={(t.engineHealthRight ?? 100) < 95 ? 'var(--dt-red)' : (t.engineHealthRight ?? 100) < 98 ? 'var(--dt-orange)' : 'var(--dt-green)'}
        />
      </div>
    </TacticalCard>
  )
}

function FuelIndicator() {
  const t = useTelemetryStore(s => s.data)
  const fuelPct = (t.fuelTotal / 36800) * 100
  const fuelColor =
    fuelPct > 40 ? 'var(--dt-green)' : fuelPct > 20 ? 'var(--dt-yellow)' : 'var(--dt-red)'
  const fuelThreat = fuelPct > 40 ? 'nominal' : fuelPct > 20 ? 'caution' : 'emergency'

  // Animated fuel flow bar
  const leftPct = (t.fuelLeft / 18400) * 100
  const rightPct = (t.fuelRight / 18400) * 100

  return (
    <TacticalCard title="FUEL SYSTEM" threatLevel={fuelThreat}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <GaugeArc
          value={fuelPct}
          size={72}
          color={fuelColor}
          label="TOTAL"
          displayValue={`${fuelPct.toFixed(0)}%`}
        />
        <div style={{ flex: 1 }}>
          <DataRow label="TOTAL" value={`${t.fuelTotal.toFixed(0)}`} unit="lbs" />
          <DataRow label="BURN/HR" value={`${t.fuelBurnRate.toFixed(0)}`} unit="lb/h" />
        </div>
      </div>
      {/* Tank flow bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {[
          { label: 'TANK LEFT', pct: leftPct, val: t.fuelLeft },
          { label: 'TANK RIGHT', pct: rightPct, val: t.fuelRight },
        ].map(tank => (
          <div key={tank.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="data-label" style={{ fontSize: '9px' }}>
                {tank.label}
              </span>
              <span className="font-mono" style={{ fontSize: '9px', color: fuelColor }}>
                {tank.pct.toFixed(0)}%
              </span>
            </div>
            <div className="threat-bar-track">
              <motion.div
                className="threat-bar-fill"
                animate={{ width: `${tank.pct}%` }}
                transition={{ duration: 0.6 }}
                style={{
                  background: `linear-gradient(90deg, rgba(0,245,255,0.4), ${fuelColor})`,
                  boxShadow: `0 0 6px ${fuelColor}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </TacticalCard>
  )
}

function SystemHealthGrid() {
  const t = useTelemetryStore(s => s.data)
  const systems: Array<{
    label: string
    status: 'nominal' | 'caution' | 'warning' | 'emergency' | 'off'
  }> = [
    {
      label: 'HYDRAULICS',
      status:
        t.hydraulicsPressure > 2800
          ? 'nominal'
          : t.hydraulicsPressure > 2000
            ? 'caution'
            : 'warning',
    },
    { label: 'AVIONICS', status: 'nominal' },
    { label: 'NAVIGATION', status: 'nominal' },
    { label: 'ELECTRICS', status: 'nominal' },
    { label: 'PRESSURIZE', status: t.cabinAltitude < 7000 ? 'nominal' : 'caution' },
    {
      label: 'FUEL SYS',
      status: t.fuelTotal > 8000 ? 'nominal' : t.fuelTotal > 4000 ? 'caution' : 'warning',
    },
  ]

  const threatLevel = systems.some(s => s.status === 'warning' || s.status === 'emergency')
    ? 'warning'
    : systems.some(s => s.status === 'caution')
      ? 'caution'
      : 'nominal'

  return (
    <TacticalCard title="SYSTEM HEALTH" threatLevel={threatLevel as any}>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}
      >
        {systems.map(sys => (
          <div
            key={sys.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(22,42,72,0.25)',
              borderRadius: '4px',
              padding: '5px 7px',
              border: `1px solid ${sys.status === 'nominal' ? 'var(--dt-border)' : sys.status === 'caution' ? 'rgba(255,229,0,0.20)' : 'rgba(255,107,0,0.25)'}`,
            }}
          >
            <StatusLED status={sys.status} />
            <span className="data-label" style={{ fontSize: '8px', letterSpacing: '0.08em' }}>
              {sys.label}
            </span>
          </div>
        ))}
      </div>
      <DataRow label="HYD PRESS" value={`${t.hydraulicsPressure?.toFixed(0) ?? '--'}`} unit="psi" />
      <DataRow
        label="CABIN ALT"
        value={`${t.cabinAltitude?.toFixed(0) ?? '--'}`}
        unit="ft"
        color={t.cabinAltitude > 7000 ? 'var(--dt-yellow)' : undefined}
      />
      <DataRow
        label="DIST DEST"
        value={`${t.distanceToDestination?.toFixed(0) ?? '--'}`}
        unit="nm"
      />

      {/* Risk score hero */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="data-label">RISK SCORE</span>
          <span
            className="font-hud"
            style={{
              fontSize: '13px',
              color:
                t.riskScore > 70
                  ? 'var(--dt-red)'
                  : t.riskScore > 40
                    ? 'var(--dt-orange)'
                    : 'var(--dt-green)',
              textShadow: t.riskScore > 70 ? '0 0 8px var(--dt-red)' : 'none',
            }}
          >
            <AnimatedNumber value={t.riskScore ?? 0} decimals={0} suffix="%" />
          </span>
        </div>
        <div className="threat-bar-track" style={{ height: '5px' }}>
          <motion.div
            className="threat-bar-fill"
            animate={{ width: `${t.riskScore ?? 0}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background: `linear-gradient(90deg, var(--dt-green), ${t.riskScore > 70 ? 'var(--dt-red)' : t.riskScore > 40 ? 'var(--dt-orange)' : 'var(--dt-green)'})`,
              boxShadow: t.riskScore > 70 ? '0 0 8px var(--dt-red)' : 'none',
            }}
          />
        </div>
      </div>
    </TacticalCard>
  )
}

export function AircraftStatusPanel() {
  const t = useTelemetryStore(s => s.data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Flight Data */}
      <TacticalCard title="FLIGHT DATA">
        <FlightDataGrid />
        <div>
          <DataRow label="HEADING" value={`${t.heading.toFixed(0)}°`} unit="MAG" />
          <DataRow
            label="PITCH"
            value={`${t.pitch.toFixed(1)}°`}
            color={Math.abs(t.pitch) > 20 ? 'var(--dt-orange)' : undefined}
          />
          <DataRow
            label="ROLL"
            value={`${t.roll.toFixed(1)}°`}
            color={Math.abs(t.roll) > 30 ? 'var(--dt-orange)' : undefined}
          />
          <DataRow
            label="G-FORCE"
            value={`${t.gForce.toFixed(2)}g`}
            color={t.gForce > 2.5 ? 'var(--dt-red)' : undefined}
          />
          <DataRow label="OAT" value={`${t.outsideAirTemp.toFixed(1)}°C`} />
          <DataRow
            label="WIND"
            value={`${t.windSpeed.toFixed(0)}KT / ${t.windDirection.toFixed(0)}°`}
          />
        </div>
      </TacticalCard>

      <EngineGauges />
      <FuelIndicator />
      <SystemHealthGrid />
    </div>
  )
}
