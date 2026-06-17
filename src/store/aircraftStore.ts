import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TelemetryData } from '../types/telemetry'
import { FlightPhase } from '../types/flightPhase'
import { createInitialTelemetry, tickTelemetry } from '../core/simulation/TelemetryEngine'

export interface AircraftState {
  data: TelemetryData
  setAircraftState: (data: Partial<TelemetryData>) => void
  tick: (phase: FlightPhase, deltaMs: number) => void
  reset: () => void
}

export const useAircraftStore = create<AircraftState>()(
  immer((set) => ({
    data: createInitialTelemetry(),

    setAircraftState: (partialData) => {
      set((state) => {
        state.data = { ...state.data, ...partialData }
      })
    },

    tick: (phase, deltaMs) => {
      set((state) => {
        state.data = tickTelemetry(state.data, phase, deltaMs / 1000)
      })
    },

    reset: () => {
      set((state) => {
        state.data = createInitialTelemetry()
      })
    },
  }))
)

// Export alias for compatibility
export const useTelemetryStore = useAircraftStore
