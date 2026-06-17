import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCameraStore } from '../../store/useCameraStore'
import { useFlightStore } from '../../store/useFlightStore'
import { useTelemetryStore } from '../../store/useTelemetryStore'
import { FlightPhase } from '../../types/flightPhase'
import type { CameraId } from '../../types/camera'

// Per-camera, per-phase overrides for position & FOV
interface CameraConfig {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

const CAMERA_PHASE_CONFIG: Record<CameraId, Record<FlightPhase, CameraConfig>> = {
  pilot: {
    [FlightPhase.PREFLIGHT]: { position: [0, 1.05, 0.4], target: [0, 1.0, -15], fov: 75 },
    [FlightPhase.STARTUP]: { position: [0, 1.05, 0.4], target: [0, 1.0, -15], fov: 75 },
    [FlightPhase.TAXI]: { position: [0, 1.05, 0.4], target: [0, 1.0, -20], fov: 72 },
    [FlightPhase.TAKEOFF]: { position: [0, 1.05, 0.4], target: [0, 0.9, -25], fov: 68 }, // G-force FOV narrow
    [FlightPhase.CLIMB]: { position: [0, 1.05, 0.4], target: [0, 2.2, -40], fov: 75 }, // pitch up
    [FlightPhase.CRUISE]: { position: [0, 1.05, 0.4], target: [0, 1.2, -60], fov: 75 },
    [FlightPhase.DESCENT]: { position: [0, 1.05, 0.4], target: [0, 0.6, -30], fov: 75 }, // nose down
    [FlightPhase.LANDING]: { position: [0, 1.05, 0.4], target: [0, 0.4, -25], fov: 72 },
  },
  observer_left: {
    [FlightPhase.PREFLIGHT]: { position: [-12, 2, 4], target: [0, 0, 0], fov: 58 },
    [FlightPhase.STARTUP]: { position: [-13, 3, 4], target: [0, 0, 0], fov: 58 },
    [FlightPhase.TAXI]: { position: [-14, 1, 8], target: [0, 0, 4], fov: 58 }, // low, ahead
    [FlightPhase.TAKEOFF]: { position: [-14, 2, -2], target: [0, 1, 0], fov: 60 }, // runway level
    [FlightPhase.CLIMB]: { position: [-18, 6, 0], target: [0, 3, 0], fov: 60 }, // pulls out
    [FlightPhase.CRUISE]: { position: [-20, 8, 0], target: [0, 0, 0], fov: 55 },
    [FlightPhase.DESCENT]: { position: [-16, 6, 0], target: [0, 2, 0], fov: 58 },
    [FlightPhase.LANDING]: { position: [-14, 3, 8], target: [0, 0, 4], fov: 60 }, // behind+low
  },
  observer_right: {
    [FlightPhase.PREFLIGHT]: { position: [12, 2, 4], target: [0, 0, 0], fov: 58 },
    [FlightPhase.STARTUP]: { position: [13, 3, 4], target: [0, 0, 0], fov: 58 },
    [FlightPhase.TAXI]: { position: [14, 1, 8], target: [0, 0, 4], fov: 58 },
    [FlightPhase.TAKEOFF]: { position: [14, 2, -2], target: [0, 1, 0], fov: 60 },
    [FlightPhase.CLIMB]: { position: [18, 6, 0], target: [0, 3, 0], fov: 60 },
    [FlightPhase.CRUISE]: { position: [20, 8, 0], target: [0, 0, 0], fov: 55 },
    [FlightPhase.DESCENT]: { position: [16, 6, 0], target: [0, 2, 0], fov: 58 },
    [FlightPhase.LANDING]: { position: [14, 3, 8], target: [0, 0, 4], fov: 60 },
  },
  command: {
    [FlightPhase.PREFLIGHT]: { position: [0, 25, 55], target: [0, 0, 0], fov: 48 },
    [FlightPhase.STARTUP]: { position: [0, 22, 50], target: [0, 0, 0], fov: 46 },
    [FlightPhase.TAXI]: { position: [0, 28, 60], target: [0, 0, 0], fov: 45 },
    [FlightPhase.TAKEOFF]: { position: [0, 30, 80], target: [0, 0, 0], fov: 45 },
    [FlightPhase.CLIMB]: { position: [0, 80, 150], target: [0, 50, 0], fov: 42 },
    [FlightPhase.CRUISE]: { position: [0, 200, 400], target: [0, 100, 0], fov: 40 },
    [FlightPhase.DESCENT]: { position: [0, 80, 160], target: [0, 40, 0], fov: 42 },
    [FlightPhase.LANDING]: { position: [0, 25, 120], target: [0, 0, 20], fov: 38 }, // zoom in
  },
}

export function MissionCameraRig() {
  const { activeCamera } = useCameraStore()
  const { currentPhase, isRunning } = useFlightStore()
  const t = useTelemetryStore(s => s.data)
  const { camera } = useThree()

  const camPos = useRef(new THREE.Vector3(0, 25, 55))
  const camTarget = useRef(new THREE.Vector3(0, 0, 0))
  const currentFov = useRef(48)
  const headBobTime = useRef(0)
  const touchdownShake = useRef(0)

  // Command camera orbit angle
  const orbitAngle = useRef(0)

  // Trigger touchdown shake
  useEffect(() => {
    if (currentPhase === FlightPhase.LANDING) {
      touchdownShake.current = 1.0
    }
  }, [currentPhase])

  useFrame((state, delta) => {
    const cfg = CAMERA_PHASE_CONFIG[activeCamera][currentPhase]
    const lerpSpeed = Math.min(delta * 1.8, 1)

    let targetPos = new THREE.Vector3(...cfg.position)
    let targetLook = new THREE.Vector3(...cfg.target)

    // ── Pilot-specific behaviors ─────────────────────────
    if (activeCamera === 'pilot') {
      // Head bob (taxi, takeoff roll)
      if (
        isRunning &&
        ([FlightPhase.TAXI, FlightPhase.TAKEOFF, FlightPhase.LANDING] as FlightPhase[]).includes(
          currentPhase
        )
      ) {
        headBobTime.current += delta
        const bobAmp = currentPhase === FlightPhase.TAXI ? 0.012 : 0.018
        const bobFreq = currentPhase === FlightPhase.TAXI ? 0.4 : 0.6
        targetPos.y += Math.sin(headBobTime.current * bobFreq * Math.PI * 2) * bobAmp
      }

      // Turbulence shake (cruise)
      if (currentPhase === FlightPhase.CRUISE) {
        const turbAmp = 0.004
        targetPos.x += (Math.random() - 0.5) * turbAmp
        targetPos.y += (Math.random() - 0.5) * turbAmp
      }

      // G-force — camera pitches back during takeoff
      if (currentPhase === FlightPhase.TAKEOFF) {
        targetPos.y -= 0.04
        targetLook.y -= 0.08
      }

      // Touchdown bounce
      if (touchdownShake.current > 0) {
        touchdownShake.current = Math.max(0, touchdownShake.current - delta * 3)
        const bounce = Math.sin(touchdownShake.current * 18) * touchdownShake.current * 0.06
        targetPos.y += bounce
      }

      // Bank roll influence on pilot cam
      const bankAngle = THREE.MathUtils.degToRad(t.roll * 0.3)
      targetPos.x += Math.sin(bankAngle) * 0.08
    }

    // ── Command camera slow orbit ────────────────────────
    if (activeCamera === 'command') {
      orbitAngle.current += delta * 0.002
      const r = cfg.position[2]
      targetPos.x = Math.sin(orbitAngle.current) * r * 0.5
      targetPos.z = Math.cos(orbitAngle.current) * r
    }

    // Lerp position (cubic feel via smaller lerp on first half)
    camPos.current.lerp(targetPos, lerpSpeed * 0.7)
    camTarget.current.lerp(targetLook, lerpSpeed * 0.7)

    // FOV lerp
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, cfg.fov, lerpSpeed * 0.4)

    // Apply to Three.js camera
    camera.position.copy(camPos.current)
    camera.lookAt(camTarget.current)
    ;(camera as THREE.PerspectiveCamera).fov = currentFov.current
    ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
  })

  return null // Camera is controlled imperatively
}
