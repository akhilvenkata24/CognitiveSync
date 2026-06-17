import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { FlightPhase } from '../types/flightPhase'
import { FlightPhaseFSM } from '../core/simulation/FlightPhaseFSM'

export interface FlightState {
  currentPhase: FlightPhase
  previousPhase: FlightPhase | null
  phaseStartTime: number
  phaseElapsedSeconds: number
  phaseProgress: number
  isTransitioning: boolean
  missionStartTime: number
  totalMissionElapsedSeconds: number
  isRunning: boolean
  isMissionComplete: boolean

  advancePhase: () => void
  setPhase: (phase: FlightPhase) => void
  tickPhase: (deltaMs: number) => void
  startMission: () => void
  pauseMission: () => void
}

const fsm = new FlightPhaseFSM()

export const useFlightStore = create<FlightState>()(
  immer((set, get) => ({
    currentPhase: fsm.getCurrentPhase(),
    previousPhase: null,
    phaseStartTime: Date.now(),
    phaseElapsedSeconds: 0,
    phaseProgress: 0,
    isTransitioning: false,
    missionStartTime: Date.now(),
    totalMissionElapsedSeconds: 0,
    isRunning: false,
    isMissionComplete: false,

    advancePhase: () => {
      if (!fsm.canAdvance()) {
        set((state) => {
          state.isMissionComplete = true
        })
        return
      }

      const next = fsm.advance()
      if (next) {
        set((state) => {
          state.previousPhase = state.currentPhase
          state.currentPhase = next
          state.phaseStartTime = Date.now()
          state.phaseElapsedSeconds = 0
          state.phaseProgress = 0
          state.isTransitioning = true
        })

        setTimeout(() => {
          set((state) => {
            state.isTransitioning = false
          })
        }, 1500)
      } else {
        set((state) => {
          state.isMissionComplete = true
        })
      }
    },

    setPhase: (phase) => {
      fsm.setPhase(phase)
      set((state) => {
        state.previousPhase = state.currentPhase
        state.currentPhase = phase
        state.phaseStartTime = Date.now()
        state.phaseElapsedSeconds = 0
        state.phaseProgress = 0
        state.isTransitioning = true
      })
      setTimeout(() => {
        set((state) => {
          state.isTransitioning = false
        })
      }, 1500)
    },

    tickPhase: (deltaMs) => {
      set((state) => {
        const dt = deltaMs / 1000
        state.phaseElapsedSeconds += dt
        state.totalMissionElapsedSeconds += dt
        state.phaseProgress = fsm.getPhaseProgress(state.phaseElapsedSeconds)
      })
    },

    startMission: () => {
      set((state) => {
        state.isRunning = true
        state.missionStartTime = Date.now()
      })
    },

    pauseMission: () => {
      set((state) => {
        state.isRunning = false
      })
    },
  }))
)
