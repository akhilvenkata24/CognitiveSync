import { FlightPhase, FLIGHT_PHASE_ORDER, PHASE_DURATIONS_SECONDS } from '../../types/flightPhase'

export class FlightPhaseFSM {
  private currentPhase: FlightPhase = FlightPhase.PREFLIGHT

  getCurrentPhase(): FlightPhase {
    return this.currentPhase
  }

  getNextPhase(): FlightPhase | null {
    const currentIndex = FLIGHT_PHASE_ORDER.indexOf(this.currentPhase)
    if (currentIndex === FLIGHT_PHASE_ORDER.length - 1) return null
    return FLIGHT_PHASE_ORDER[currentIndex + 1]
  }

  canAdvance(): boolean {
    return this.getNextPhase() !== null
  }

  advance(): FlightPhase | null {
    const next = this.getNextPhase()
    if (next) {
      this.currentPhase = next
      return next
    }
    return null
  }

  setPhase(phase: FlightPhase): void {
    this.currentPhase = phase
  }

  getPhaseProgress(elapsedSeconds: number): number {
    const duration = PHASE_DURATIONS_SECONDS[this.currentPhase]
    return Math.min(elapsedSeconds / duration, 1.0)
  }

  isPhaseDurationComplete(elapsedSeconds: number): boolean {
    const duration = PHASE_DURATIONS_SECONDS[this.currentPhase]
    return elapsedSeconds >= duration
  }

  getPhaseIndex(): number {
    return FLIGHT_PHASE_ORDER.indexOf(this.currentPhase)
  }

  isComplete(): boolean {
    return this.currentPhase === FlightPhase.LANDING && !this.canAdvance()
  }
}
