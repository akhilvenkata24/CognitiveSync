import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface UIState {
  leftPanelTab: 'aircraft' | 'risk' | 'timeline'
  rightPanelTab: 'pilot' | 'alerts'
  activeView: 'cockpit' | 'dashboard'
  leftCollapsed: boolean
  rightCollapsed: boolean
  hudVisible: boolean
  fullscreenViewport: boolean
  debugMode: boolean

  setLeftTab: (tab: UIState['leftPanelTab']) => void
  setRightTab: (tab: UIState['rightPanelTab']) => void
  setView: (view: UIState['activeView']) => void
  setLeftCollapsed: (collapsed: boolean) => void
  setRightCollapsed: (collapsed: boolean) => void
  toggleHUD: () => void
  toggleFullscreen: () => void
  toggleDebug: () => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    leftPanelTab: 'aircraft',
    rightPanelTab: 'pilot',
    activeView: 'cockpit',
    leftCollapsed: false,
    rightCollapsed: false,
    hudVisible: true,
    fullscreenViewport: false,
    debugMode: false,

    setLeftTab: (tab) =>
      set((state) => {
        state.leftPanelTab = tab
      }),
    setRightTab: (tab) =>
      set((state) => {
        state.rightPanelTab = tab
      }),
    setView: (view) =>
      set((state) => {
        state.activeView = view
      }),
    setLeftCollapsed: (collapsed) =>
      set((state) => {
        state.leftCollapsed = collapsed
      }),
    setRightCollapsed: (collapsed) =>
      set((state) => {
        state.rightCollapsed = collapsed
      }),
    toggleHUD: () =>
      set((state) => {
        state.hudVisible = !state.hudVisible
      }),
    toggleFullscreen: () =>
      set((state) => {
        state.fullscreenViewport = !state.fullscreenViewport
      }),
    toggleDebug: () =>
      set((state) => {
        state.debugMode = !state.debugMode
      }),
  }))
)
