import type { CameraId, CameraPreset } from '../../types/camera'
import { CAMERA_PRESETS } from '../../types/camera'

export interface CameraEvent {
  timestamp: number
  cameraId: CameraId
}

export class CameraManager {
  private static instance: CameraManager | null = null
  private history: CameraEvent[] = []
  private isReplaying = false

  private constructor() {}

  public static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager()
    }
    return CameraManager.instance
  }

  /** Logs a camera switch event with a timestamp */
  public logSwitch(cameraId: CameraId): void {
    if (this.isReplaying) return
    this.history.push({
      timestamp: Date.now(),
      cameraId,
    })
  }

  /** Gets the logged switches history */
  public getHistory(): CameraEvent[] {
    return [...this.history]
  }

  /** Clears the history log */
  public clearHistory(): void {
    this.history = []
  }

  /** Gets preset configs for a camera */
  public getPreset(id: CameraId): CameraPreset {
    return CAMERA_PRESETS[id]
  }

  /** Replays history log by triggering callback on each step */
  public async playHistory(onSwitch: (id: CameraId) => void): Promise<void> {
    if (this.history.length === 0 || this.isReplaying) return
    this.isReplaying = true

    for (let i = 0; i < this.history.length; i++) {
      const event = this.history[i]
      const delay = i === 0 ? 0 : event.timestamp - this.history[i - 1].timestamp

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      onSwitch(event.cameraId)
    }

    this.isReplaying = false
  }
}
