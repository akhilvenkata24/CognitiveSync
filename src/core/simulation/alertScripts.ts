import { FlightPhase } from '../../types/flightPhase'
import type { Alert, AlertSystem } from '../../types/alerts'

let alertCounter = 0

function makeAlert(
  severity: Alert['severity'],
  system: AlertSystem,
  message: string,
  autoExpireMs?: number
): Alert {
  return {
    id: `alert-${++alertCounter}-${Date.now()}`,
    severity,
    system,
    message,
    timestamp: Date.now(),
    autoExpireMs,
    acknowledged: false,
  }
}

const PHASE_ALERTS: Record<FlightPhase, Alert[]> = {
  [FlightPhase.PREFLIGHT]: [
    makeAlert('INFO', 'SYSTEM', 'Pre-flight checklist initiated', 8000),
    makeAlert('INFO', 'AVIONICS', 'ADIRU alignment in progress', 10000),
    makeAlert('INFO', 'NAVIGATION', 'FMS flight plan loaded: DEL → BOM', 12000),
  ],
  [FlightPhase.STARTUP]: [
    makeAlert('INFO', 'ENGINE', 'Engine 1 start sequence initiated', 8000),
    makeAlert('INFO', 'ENGINE', 'Engine 2 start sequence initiated', 8000),
    makeAlert('CAUTION', 'ENGINE', 'EGT spike during ignition — within limits', 10000),
    makeAlert('INFO', 'HYDRAULICS', 'Hydraulic system A/B pressure nominal', 8000),
  ],
  [FlightPhase.TAXI]: [
    makeAlert('INFO', 'SYSTEM', 'Cleared to taxi runway 28L', 8000),
    makeAlert('CAUTION', 'NAVIGATION', 'Runway incursion advisory — traffic ahead', 12000),
    makeAlert('INFO', 'AVIONICS', 'Transponder set to ALT mode', 8000),
  ],
  [FlightPhase.TAKEOFF]: [
    makeAlert('INFO', 'SYSTEM', 'Takeoff clearance received', 6000),
    makeAlert('WARNING', 'ENGINE', 'N1 asymmetry detected — 0.4% differential', 10000),
    makeAlert('INFO', 'SYSTEM', 'V1 80kts — V2 160kts', 8000),
    makeAlert('INFO', 'AVIONICS', 'GPWS armed — terrain awareness active', 8000),
  ],
  [FlightPhase.CLIMB]: [
    makeAlert('INFO', 'SYSTEM', 'Passing 10,000ft — speed restrictions lifted', 8000),
    makeAlert('CAUTION', 'WEATHER', 'Moderate turbulence forecast at FL180', 12000),
    makeAlert('INFO', 'CABIN', 'Seat belt sign extinguished at FL100', 8000),
  ],
  [FlightPhase.CRUISE]: [
    makeAlert('INFO', 'NAVIGATION', 'On track — ETA BOM 14:35 IST', 10000),
    makeAlert('INFO', 'WEATHER', 'Smooth air reported ahead — FL350', 8000),
    makeAlert('CAUTION', 'FUEL', 'Fuel imbalance 200lbs — monitor', 12000),
    makeAlert('INFO', 'TRAFFIC', "TCAS: traffic 12 o'clock, FL370 — no conflict", 10000),
  ],
  [FlightPhase.DESCENT]: [
    makeAlert('INFO', 'SYSTEM', 'Top of descent reached — commencing approach', 8000),
    makeAlert('INFO', 'NAVIGATION', 'ILS 27 BOM captured — localizer active', 10000),
    makeAlert('CAUTION', 'WEATHER', 'Wind shear alert — final approach', 12000),
    makeAlert('WARNING', 'TERRAIN', 'GPWS: terrain — pull up', 6000),
  ],
  [FlightPhase.LANDING]: [
    makeAlert('INFO', 'SYSTEM', 'Landing gear down and locked', 8000),
    makeAlert('INFO', 'SYSTEM', 'Flaps 30 — landing configuration', 8000),
    makeAlert('INFO', 'SYSTEM', 'Touchdown — thrust reversers deployed', 8000),
    makeAlert('INFO', 'SYSTEM', 'Ground roll — decelerating to taxi speed', 8000),
  ],
}

export function getPhaseAlerts(phase: FlightPhase): Alert[] {
  return PHASE_ALERTS[phase].map(alert => ({
    ...alert,
    id: `alert-${++alertCounter}-${Date.now()}`,
    timestamp: Date.now(),
  }))
}

export function generateRandomAnomaly(phase: FlightPhase): Alert | null {
  const probability = {
    [FlightPhase.PREFLIGHT]: 0,
    [FlightPhase.STARTUP]: 0.002,
    [FlightPhase.TAXI]: 0.003,
    [FlightPhase.TAKEOFF]: 0.005,
    [FlightPhase.CLIMB]: 0.003,
    [FlightPhase.CRUISE]: 0.001,
    [FlightPhase.DESCENT]: 0.004,
    [FlightPhase.LANDING]: 0.004,
  }[phase]

  if (Math.random() > probability) return null

  const anomalies: Array<Pick<Alert, 'severity' | 'system' | 'message'>> = [
    { severity: 'CAUTION', system: 'ENGINE', message: 'Vibration N1 slightly elevated' },
    { severity: 'CAUTION', system: 'HYDRAULICS', message: 'Hydraulic fluid level low — system B' },
    { severity: 'WARNING', system: 'AVIONICS', message: 'FMS waypoint database mismatch' },
    { severity: 'CAUTION', system: 'FUEL', message: 'Fuel temperature approaching limits' },
    {
      severity: 'INFO',
      system: 'WEATHER',
      message: 'PIREPs: light chop ahead at current altitude',
    },
    { severity: 'CAUTION', system: 'ENGINE', message: 'Oil pressure fluctuation — engine 2' },
  ]

  const pick = anomalies[Math.floor(Math.random() * anomalies.length)]
  return makeAlert(pick.severity, pick.system, pick.message, 15000)
}
