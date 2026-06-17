import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { FlightPhase } from '../types/flightPhase'

export interface PilotData {
  heartRate: number
  spo2: number
  respirationRate: number
  cognitiveLoad: number
  fatigueIndex: number
  reactionTimeMs: number
  stressLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  gazeX: number
  gazeY: number
  blinkRate: number
}

export interface PilotState {
  data: PilotData
  setPilotState: (data: Partial<PilotData>) => void
  tick: (phase: FlightPhase, deltaMs: number) => void
  reset: () => void
}

const initialPilotData: PilotData = {
  heartRate: 68,
  spo2: 99,
  respirationRate: 14,
  cognitiveLoad: 25,
  fatigueIndex: 10,
  reactionTimeMs: 220,
  stressLevel: 'LOW',
  gazeX: 0.5,
  gazeY: 0.5,
  blinkRate: 18,
}

export const usePilotStore = create<PilotState>()(
  immer((set) => ({
    data: initialPilotData,

    setPilotState: (partialData) => {
      set((state) => {
        state.data = { ...state.data, ...partialData }
      })
    },

    tick: (_phase, _deltaMs) => {
      // Biometric simulation engine is removed from the store itself
      // to keep the state architecture free of active generators.
    },

    reset: () => {
      set((state) => {
        state.data = initialPilotData
      })
    },
  }))
)
