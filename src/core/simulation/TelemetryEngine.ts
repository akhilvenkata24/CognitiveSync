import type { TelemetryData, TelemetryEnvelope } from '../../types/telemetry'
import { FlightPhase } from '../../types/flightPhase'
import { TELEMETRY_PROFILES } from './telemetryProfiles'

function lerp(current: number, target: number, rate: number, dt: number): number {
  const step = rate * dt
  if (Math.abs(target - current) <= step) return target
  return current + Math.sign(target - current) * step
}

function applyVariance(value: number, variance: number): number {
  if (variance === 0) return value
  return value + (Math.random() - 0.5) * 2 * variance * 0.3
}

function tickEnvelope(current: number, envelope: TelemetryEnvelope, dt: number): number {
  const smoothed = lerp(current, envelope.target, envelope.rampRate, dt)
  return applyVariance(smoothed, envelope.variance)
}

export function createInitialTelemetry(): TelemetryData {
  return {
    altitude: 0,
    indicatedAirspeed: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 145,
    pitch: 0,
    roll: 0,
    gForce: 1.0,
    n1Left: 0,
    n1Right: 0,
    n2Left: 0,
    n2Right: 0,
    egt: 15,
    oilPressure: 0,
    oilTemp: 20,
    fuelLeft: 18400,
    fuelRight: 18400,
    fuelTotal: 36800,
    fuelBurnRate: 0,
    hydraulicsPressure: 0,
    cabinAltitude: 0,
    cabinPressure: 0,
    outsideAirTemp: 22,
    windSpeed: 8,
    windDirection: 230,
    visibility: 12,
    latitude: 28.5562,
    longitude: 77.1,
    distanceToDestination: 1240,
    riskScore: 0,
    anomalyFlags: [],
    engineHealthLeft: 100,
    engineHealthRight: 100,
  }
}

export function tickTelemetry(
  current: TelemetryData,
  phase: FlightPhase,
  dt: number
): TelemetryData {
  const profile = TELEMETRY_PROFILES[phase]

  const n1 = tickEnvelope(current.n1Left, profile.n1, dt)
  const n2 = tickEnvelope(current.n2Left, profile.n2, dt)
  const altitude = tickEnvelope(current.altitude, profile.altitude, dt)
  const ias = tickEnvelope(current.indicatedAirspeed, profile.indicatedAirspeed, dt)
  const vs = tickEnvelope(current.verticalSpeed, profile.verticalSpeed, dt)
  const fuelBurn = tickEnvelope(current.fuelBurnRate, profile.fuelBurnRate, dt)
  const fuelConsumedLbs = (fuelBurn / 3600) * dt
  const newFuelTotal = Math.max(0, current.fuelTotal - fuelConsumedLbs)

  // Derive ground speed from IAS (simplified — no wind correction)
  const groundSpeed = Math.max(0, ias + (Math.random() - 0.5) * 6)

  // Oil pressure correlates with N1
  const oilPressure = n1 > 0 ? 68 + (Math.random() - 0.5) * 4 : 0
  const oilTemp = n1 > 0 ? 82 + (Math.random() - 0.5) * 3 : 25

  // Cabin altitude tracks real altitude up to cruise
  const cabinAltitude = altitude > 10000 ? Math.min(8000, (altitude - 10000) * 0.32) : 0
  const cabinPressure = cabinAltitude > 0 ? 8.6 - cabinAltitude * 0.0005 : 0

  // OAT drops with altitude
  const outsideAirTemp = 22 - (altitude / 1000) * 1.98

  // Distance burns down with phase progression
  const distanceToDestination = Math.max(
    0,
    current.distanceToDestination - (groundSpeed / 3600) * dt
  )

  // Risk score: composite of engine, fuel, and flight dynamics
  const engineRisk = n1 > 97 ? 40 : n1 < 15 && phase !== FlightPhase.PREFLIGHT ? 30 : 0
  const fuelRisk = newFuelTotal < 5000 ? 50 : newFuelTotal < 10000 ? 20 : 0
  const riskScore = Math.min(100, engineRisk + fuelRisk + Math.random() * 5)

  // Engine health wear: higher wear during takeoff and climb
  const wearRateL = n1 > 90 ? 0.003 : n1 > 20 ? 0.0003 : 0
  const wearRateR = tickEnvelope(current.n1Right, profile.n1, dt) > 90 ? 0.003 : tickEnvelope(current.n1Right, profile.n1, dt) > 20 ? 0.0003 : 0

  const prevHealthL = current.engineHealthLeft ?? 100
  const prevHealthR = current.engineHealthRight ?? 100

  const baseHealthL = Math.max(0, prevHealthL - wearRateL * dt)
  const baseHealthR = Math.max(0, prevHealthR - wearRateR * dt)

  // Subtle sensor noise if engines are active
  const noiseL = n1 > 10 ? (Math.random() - 0.5) * 0.015 : 0
  const noiseR = tickEnvelope(current.n1Right, profile.n1, dt) > 10 ? (Math.random() - 0.5) * 0.015 : 0

  const engineHealthLeft = Math.max(0, Math.min(100, baseHealthL + noiseL))
  const engineHealthRight = Math.max(0, Math.min(100, baseHealthR + noiseR))

  return {
    ...current,
    altitude: Math.max(0, altitude),
    indicatedAirspeed: Math.max(0, ias),
    groundSpeed: Math.max(0, groundSpeed),
    verticalSpeed: vs,
    heading: tickEnvelope(current.heading, profile.heading, dt),
    pitch: tickEnvelope(current.pitch, profile.pitch, dt),
    roll: tickEnvelope(current.roll, profile.roll, dt),
    gForce: tickEnvelope(current.gForce, profile.gForce, dt),
    n1Left: Math.max(0, n1),
    n1Right: Math.max(
      0,
      tickEnvelope(current.n1Right, profile.n1, dt) + (Math.random() - 0.5) * 0.3
    ),
    n2Left: Math.max(0, n2),
    n2Right: Math.max(
      0,
      tickEnvelope(current.n2Right, profile.n2, dt) + (Math.random() - 0.5) * 0.3
    ),
    egt: Math.max(0, tickEnvelope(current.egt, profile.egt, dt)),
    oilPressure,
    oilTemp,
    fuelLeft: newFuelTotal / 2,
    fuelRight: newFuelTotal / 2,
    fuelTotal: newFuelTotal,
    fuelBurnRate: Math.max(0, fuelBurn),
    hydraulicsPressure: Math.max(
      0,
      tickEnvelope(current.hydraulicsPressure, profile.hydraulicsPressure, dt)
    ),
    cabinAltitude,
    cabinPressure,
    outsideAirTemp,
    distanceToDestination,
    riskScore,
    anomalyFlags: [],
    engineHealthLeft,
    engineHealthRight,
  }
}
