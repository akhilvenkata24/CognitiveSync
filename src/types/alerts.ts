export type AlertSeverity = 'INFO' | 'CAUTION' | 'WARNING' | 'EMERGENCY'

export type AlertSystem =
  | 'ENGINE'
  | 'FUEL'
  | 'HYDRAULICS'
  | 'AVIONICS'
  | 'NAVIGATION'
  | 'CABIN'
  | 'WEATHER'
  | 'TERRAIN'
  | 'TRAFFIC'
  | 'SYSTEM'

export interface Alert {
  id: string
  severity: AlertSeverity
  system: AlertSystem
  message: string
  timestamp: number
  autoExpireMs?: number
  acknowledged: boolean
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  INFO: '#00D4FF',
  CAUTION: '#FFD600',
  WARNING: '#FF6D00',
  EMERGENCY: '#FF1744',
}

export const SEVERITY_BG: Record<AlertSeverity, string> = {
  INFO: 'rgba(0, 212, 255, 0.1)',
  CAUTION: 'rgba(255, 214, 0, 0.1)',
  WARNING: 'rgba(255, 109, 0, 0.1)',
  EMERGENCY: 'rgba(255, 23, 68, 0.15)',
}
