export const FlightPhase = {
  PREFLIGHT: 'PREFLIGHT',
  STARTUP: 'STARTUP',
  TAXI: 'TAXI',
  TAKEOFF: 'TAKEOFF',
  CLIMB: 'CLIMB',
  CRUISE: 'CRUISE',
  DESCENT: 'DESCENT',
  LANDING: 'LANDING',
} as const

export type FlightPhase = (typeof FlightPhase)[keyof typeof FlightPhase]

export const FLIGHT_PHASE_ORDER: FlightPhase[] = [
  FlightPhase.PREFLIGHT,
  FlightPhase.STARTUP,
  FlightPhase.TAXI,
  FlightPhase.TAKEOFF,
  FlightPhase.CLIMB,
  FlightPhase.CRUISE,
  FlightPhase.DESCENT,
  FlightPhase.LANDING,
]

export const FLIGHT_PHASE_LABELS: Record<FlightPhase, string> = {
  [FlightPhase.PREFLIGHT]: 'Pre-Flight',
  [FlightPhase.STARTUP]: 'Startup',
  [FlightPhase.TAXI]: 'Taxi',
  [FlightPhase.TAKEOFF]: 'Takeoff',
  [FlightPhase.CLIMB]: 'Climb',
  [FlightPhase.CRUISE]: 'Cruise',
  [FlightPhase.DESCENT]: 'Descent',
  [FlightPhase.LANDING]: 'Landing',
}

export const FLIGHT_PHASE_ICONS: Record<FlightPhase, string> = {
  [FlightPhase.PREFLIGHT]: '🔍',
  [FlightPhase.STARTUP]: '⚙️',
  [FlightPhase.TAXI]: '🛞',
  [FlightPhase.TAKEOFF]: '🛫',
  [FlightPhase.CLIMB]: '📈',
  [FlightPhase.CRUISE]: '✈️',
  [FlightPhase.DESCENT]: '📉',
  [FlightPhase.LANDING]: '🛬',
}

export const PHASE_DURATIONS_SECONDS: Record<FlightPhase, number> = {
  [FlightPhase.PREFLIGHT]: 30,
  [FlightPhase.STARTUP]: 25,
  [FlightPhase.TAXI]: 30,
  [FlightPhase.TAKEOFF]: 25,
  [FlightPhase.CLIMB]: 40,
  [FlightPhase.CRUISE]: 50,
  [FlightPhase.DESCENT]: 40,
  [FlightPhase.LANDING]: 30,
}
