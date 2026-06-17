export interface TelemetryData {
  // Flight dynamics
  altitude: number // feet MSL
  indicatedAirspeed: number // knots
  groundSpeed: number // knots
  verticalSpeed: number // fpm
  heading: number // degrees magnetic
  pitch: number // degrees
  roll: number // degrees
  gForce: number

  // Engines
  n1Left: number // % thrust
  n1Right: number
  n2Left: number
  n2Right: number
  egt: number // exhaust gas temp °C
  oilPressure: number // PSI
  oilTemp: number // °C

  // Fuel
  fuelLeft: number // lbs
  fuelRight: number // lbs
  fuelTotal: number // lbs
  fuelBurnRate: number // lbs/hr

  // Systems
  hydraulicsPressure: number // PSI
  cabinAltitude: number // feet
  cabinPressure: number // PSI differential
  outsideAirTemp: number // °C
  windSpeed: number // knots
  windDirection: number // degrees
  visibility: number // nm

  // Navigation
  latitude: number
  longitude: number
  distanceToDestination: number // nm

  // Risk
  riskScore: number // 0–100
  anomalyFlags: string[]

  // Engine health
  engineHealthLeft: number // %
  engineHealthRight: number // %
}

export interface TelemetryEnvelope {
  target: number
  variance: number
  rampRate: number // units per second toward target
}

export interface TelemetryProfile {
  phase: string
  durationSeconds: number
  altitude: TelemetryEnvelope
  indicatedAirspeed: TelemetryEnvelope
  verticalSpeed: TelemetryEnvelope
  heading: TelemetryEnvelope
  pitch: TelemetryEnvelope
  roll: TelemetryEnvelope
  gForce: TelemetryEnvelope
  n1: TelemetryEnvelope
  n2: TelemetryEnvelope
  egt: TelemetryEnvelope
  fuelBurnRate: TelemetryEnvelope
  hydraulicsPressure: TelemetryEnvelope
  anomalyProbabilityPerSecond: number
}
