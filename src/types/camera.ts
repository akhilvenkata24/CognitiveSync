export type CameraId = 'pilot' | 'observer_left' | 'observer_right' | 'command'

export interface CameraPreset {
  id: CameraId
  label: string
  icon: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  enableOrbit: boolean
}

export const CAMERA_PRESETS: Record<CameraId, CameraPreset> = {
  pilot: {
    id: 'pilot',
    label: 'Pilot View',
    icon: '👁️',
    position: [0, 1.6, 0.5],
    target: [0, 1.5, -10],
    fov: 75,
    enableOrbit: false,
  },
  observer_left: {
    id: 'observer_left',
    label: 'Observer Left',
    icon: '◀',
    position: [-12, 4, 2],
    target: [0, 1, 0],
    fov: 60,
    enableOrbit: true,
  },
  observer_right: {
    id: 'observer_right',
    label: 'Observer Right',
    icon: '▶',
    position: [12, 4, 2],
    target: [0, 1, 0],
    fov: 60,
    enableOrbit: true,
  },
  command: {
    id: 'command',
    label: 'Command Center',
    icon: '⊞',
    position: [0, 18, 28],
    target: [0, 0, 0],
    fov: 50,
    enableOrbit: true,
  },
}
