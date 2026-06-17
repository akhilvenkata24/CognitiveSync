import { useEffect, useRef } from 'react'
import { useFlightStore } from '../store/useFlightStore'
import { useTelemetryStore } from '../store/useTelemetryStore'
import { usePilotStore } from '../store/usePilotStore'
import { useAlertStore } from '../store/useAlertStore'
import { PHASE_DURATIONS_SECONDS } from '../types/flightPhase'
import { getPhaseAlerts, generateRandomAnomaly } from '../core/simulation/alertScripts'

export function useSimulationLoop() {
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const phaseAlertsInjectedRef = useRef<Set<string>>(new Set())

  const flightStore = useFlightStore()
  const telemetryTick = useTelemetryStore(s => s.tick)
  const pilotTick = usePilotStore(s => s.tick)
  const { pushAlert, clearExpiredAlerts } = useAlertStore()

  useEffect(() => {
    if (!flightStore.isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
      const deltaMs = Math.min(timestamp - lastTimeRef.current, 100) // cap at 100ms
      lastTimeRef.current = timestamp

      const { currentPhase, phaseElapsedSeconds, advancePhase } = useFlightStore.getState()

      // Tick stores
      useFlightStore.getState().tickPhase(deltaMs)
      telemetryTick(currentPhase, deltaMs)
      pilotTick(currentPhase, deltaMs)

      // Expire stale alerts
      clearExpiredAlerts()

      // Inject phase scripted alerts once on entry
      const phaseKey = `${currentPhase}-${Math.floor(phaseElapsedSeconds / PHASE_DURATIONS_SECONDS[currentPhase])}`
      if (!phaseAlertsInjectedRef.current.has(currentPhase)) {
        phaseAlertsInjectedRef.current.add(currentPhase)
        const phaseAlerts = getPhaseAlerts(currentPhase)
        phaseAlerts.forEach((alert, idx) => {
          setTimeout(() => pushAlert(alert), idx * 1200)
        })
      }

      // Random anomaly injection
      const anomaly = generateRandomAnomaly(currentPhase)
      if (anomaly) pushAlert(anomaly)

      // Auto-advance phase
      const duration = PHASE_DURATIONS_SECONDS[currentPhase]
      if (useFlightStore.getState().phaseElapsedSeconds >= duration) {
        advancePhase()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTimeRef.current = 0
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [flightStore.isRunning])

  // Reset phaseAlertsInjectedRef when phase changes
  useEffect(() => {
    // Allow re-injection after manual phase set (not auto-advance)
  }, [flightStore.currentPhase])
}
