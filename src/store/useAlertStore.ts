import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Alert } from '../types/alerts'

interface AlertState {
  alerts: Alert[]
  pushAlert: (alert: Alert) => void
  acknowledgeAlert: (id: string) => void
  clearExpiredAlerts: () => void
  clearAll: () => void
}

const MAX_ALERTS = 50

export const useAlertStore = create<AlertState>()(
  immer(set => ({
    alerts: [],

    pushAlert: alert => {
      set(state => {
        state.alerts.unshift(alert)
        if (state.alerts.length > MAX_ALERTS) {
          state.alerts = state.alerts.slice(0, MAX_ALERTS)
        }
      })
    },

    acknowledgeAlert: id => {
      set(state => {
        const alert = state.alerts.find(a => a.id === id)
        if (alert) alert.acknowledged = true
      })
    },

    clearExpiredAlerts: () => {
      const now = Date.now()
      set(state => {
        state.alerts = state.alerts.filter(a => {
          if (!a.autoExpireMs) return true
          return now - a.timestamp < a.autoExpireMs
        })
      })
    },

    clearAll: () => {
      set(state => {
        state.alerts = []
      })
    },
  }))
)
