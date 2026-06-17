import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CameraId } from '../types/camera'
import { CameraManager } from '../core/cameras/CameraManager'

export interface CameraState {
  activeCamera: CameraId
  previousCamera: CameraId | null
  isTransitioning: boolean

  switchCamera: (id: CameraId) => void
}

export const useCameraStore = create<CameraState>()(
  immer((set) => ({
    activeCamera: 'command',
    previousCamera: null,
    isTransitioning: false,

    switchCamera: (id) => {
      // Log camera switch event in the CameraManager history
      CameraManager.getInstance().logSwitch(id)

      set((state) => {
        if (state.activeCamera === id) return
        state.previousCamera = state.activeCamera
        state.activeCamera = id
        state.isTransitioning = true
      })
      setTimeout(() => {
        set((state) => {
          state.isTransitioning = false
        })
      }, 1200)
    },
  }))
)
