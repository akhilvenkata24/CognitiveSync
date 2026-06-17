import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePilotStore } from '../../store/pilotStore'

export type AvatarState =
  | 'Focused'
  | 'Looking Left'
  | 'Looking Right'
  | 'Checking Instruments'
  | 'Relaxed'

export function PilotAvatar() {
  const pilotData = usePilotStore((s) => s.data)

  const spineRef = useRef<THREE.Group>(null)
  const neckRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const leftShoulderRef = useRef<THREE.Group>(null)
  const rightShoulderRef = useRef<THREE.Group>(null)

  // Track the active state internally for visual debug logging/reporting if needed
  const activeStateRef = useRef<AvatarState>('Focused')

  useFrame((state, delta) => {
    if (!spineRef.current || !neckRef.current || !headRef.current) return

    const { gazeX, gazeY, heartRate, stressLevel } = pilotData

    // ── 1. Determine Animation State ──
    let currentState: AvatarState = 'Focused'
    if (gazeX < 0.35) {
      currentState = 'Looking Left'
    } else if (gazeX > 0.65) {
      currentState = 'Looking Right'
    } else if (gazeY > 0.65) {
      currentState = 'Checking Instruments'
    } else if (stressLevel === 'LOW' && heartRate < 75) {
      currentState = 'Relaxed'
    }

    activeStateRef.current = currentState

    // ── 2. Transition target rotations ──
    let targetYaw: number
    let targetPitch: number
    let targetSpinePitch = 0.05 // conditionally overwritten, needs initial value

    switch (currentState) {
      case 'Looking Left':
        targetYaw = 0.55
        targetPitch = 0.05
        break
      case 'Looking Right':
        targetYaw = -0.55
        targetPitch = 0.05
        break
      case 'Checking Instruments':
        targetYaw = (gazeX - 0.5) * 0.2
        targetPitch = 0.35 // tilt head down
        targetSpinePitch = 0.12 // lean forward slightly
        break
      case 'Relaxed':
        targetYaw = (gazeX - 0.5) * 0.15
        targetPitch = (gazeY - 0.5) * 0.1
        targetSpinePitch = 0.02 // settled posture
        break
      case 'Focused':
      default:
        // Trace gaze coordinates directly but with dampening
        targetYaw = (gazeX - 0.5) * 0.4
        targetPitch = (gazeY - 0.5) * 0.25
        targetSpinePitch = 0.07 // alert posture
        break
    }

    // ── 3. Apply smooth joint interpolation ──
    const lerpSpeed = Math.min(delta * 4.5, 1.0)
    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      targetYaw,
      lerpSpeed
    )
    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      targetPitch,
      lerpSpeed
    )
    spineRef.current.rotation.x = THREE.MathUtils.lerp(
      spineRef.current.rotation.x,
      targetSpinePitch,
      lerpSpeed * 0.5
    )

    // ── 4. Biometrics-driven breathing/idle cycles ──
    const t = state.clock.elapsedTime
    
    // Heart rate maps to breathing frequency (bpm to rad/s)
    const breathingFreq = (heartRate / 60) * Math.PI * 2
    // Stress level amplifies chest expansions
    const stressAmpFactor =
      stressLevel === 'CRITICAL' ? 1.5 : stressLevel === 'HIGH' ? 1.35 : stressLevel === 'MODERATE' ? 1.15 : 1.0
    const breathingAmp = 0.005 * stressAmpFactor
    
    // Spine expands/contracts
    spineRef.current.position.y = Math.sin(t * breathingFreq) * breathingAmp
    spineRef.current.scale.set(
      1,
      1 + Math.sin(t * breathingFreq) * breathingAmp * 0.8,
      1
    )

    // Shoulder breathing follow-through
    if (leftShoulderRef.current && rightShoulderRef.current) {
      const shoulderElevation = Math.sin(t * breathingFreq) * breathingAmp * 0.5
      leftShoulderRef.current.position.y = shoulderElevation
      rightShoulderRef.current.position.y = shoulderElevation
    }
  })

  return (
    // position avatar seated in the PilotSeat
    <group position={[0, -0.05, 0.76]}>
      {/* ── SPINE ROOT ── */}
      <group ref={spineRef}>
        {/* Torso / Flight Suit */}
        <mesh position={[0, 0.35, 0.02]}>
          <boxGeometry args={[0.42, 0.55, 0.24]} />
          <meshStandardMaterial color="#1F2A38" roughness={0.8} metalness={0.1} />
        </mesh>

        {/* Harness Straps Overlay */}
        <mesh position={[-0.14, 0.35, 0.145]}>
          <boxGeometry args={[0.055, 0.55, 0.01]} />
          <meshStandardMaterial color="#D84F1E" roughness={0.8} />
        </mesh>
        <mesh position={[0.14, 0.35, 0.145]}>
          <boxGeometry args={[0.055, 0.55, 0.01]} />
          <meshStandardMaterial color="#D84F1E" roughness={0.8} />
        </mesh>

        {/* ── NECK & HEAD ── */}
        <group ref={neckRef} position={[0, 0.65, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.065, 0.075, 0.12, 16]} />
            <meshStandardMaterial color="#E5C298" roughness={0.6} />
          </mesh>

          {/* Head & Visor Helmet */}
          <group ref={headRef} position={[0, 0.18, 0]}>
            {/* Flight Helmet */}
            <mesh>
              <sphereGeometry args={[0.15, 32, 32]} />
              <meshStandardMaterial color="#0A0C10" roughness={0.35} metalness={0.8} />
            </mesh>

            {/* Glowing Visor */}
            <mesh position={[0, 0.02, 0.09]}>
              <sphereGeometry args={[0.11, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial
                color="#00f5ff"
                roughness={0.05}
                metalness={0.95}
                emissive="#003555"
                emissiveIntensity={0.65}
              />
            </mesh>

            {/* Helmet communication mic */}
            <mesh position={[0.07, -0.06, 0.12]} rotation={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.1]} />
              <meshStandardMaterial color="#222" roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* ── ARMS & HANDS ── */}
        {/* Left shoulder and arm holding the yoke */}
        <group ref={leftShoulderRef} position={[-0.23, 0.55, 0.02]}>
          <mesh position={[0, -0.15, 0.12]} rotation={[-0.45, 0, 0.1]}>
            <boxGeometry args={[0.07, 0.32, 0.07]} />
            <meshStandardMaterial color="#1F2A38" roughness={0.8} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.02, -0.26, 0.28]} rotation={[-1.1, 0.2, 0]}>
            <boxGeometry args={[0.06, 0.26, 0.06]} />
            <meshStandardMaterial color="#1F2A38" roughness={0.8} />
          </mesh>
          {/* Hand glove */}
          <mesh position={[-0.02, -0.26, 0.44]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#1A1C20" roughness={0.5} />
          </mesh>
        </group>

        {/* Right shoulder and arm holding throttle / console */}
        <group ref={rightShoulderRef} position={[0.23, 0.55, 0.02]}>
          <mesh position={[0, -0.15, 0.12]} rotation={[-0.45, 0, -0.1]}>
            <boxGeometry args={[0.07, 0.32, 0.07]} />
            <meshStandardMaterial color="#1F2A38" roughness={0.8} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.02, -0.26, 0.28]} rotation={[-1.1, -0.2, 0]}>
            <boxGeometry args={[0.06, 0.26, 0.06]} />
            <meshStandardMaterial color="#1F2A38" roughness={0.8} />
          </mesh>
          {/* Hand glove */}
          <mesh position={[0.02, -0.26, 0.44]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#1A1C20" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
