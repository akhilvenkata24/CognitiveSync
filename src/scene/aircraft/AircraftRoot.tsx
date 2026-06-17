import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlightStore } from '../../store/useFlightStore'
import { useTelemetryStore } from '../../store/useTelemetryStore'
import { FlightPhase } from '../../types/flightPhase'
import { CockpitInterior } from './CockpitInterior'

// Altitude and forward position per phase
interface AircraftPose {
  altitude: number // Y world position
  forwardZ: number // Z world offset (runway position)
  pitch: number // degrees nose up
  bankMax: number // max bank amplitude
  vibrationFreq: number
  vibrationAmp: number
  gearDown: boolean
}

const PHASE_POSE: Record<FlightPhase, AircraftPose> = {
  [FlightPhase.PREFLIGHT]: {
    altitude: -2.2,
    forwardZ: 180,
    pitch: 0,
    bankMax: 0,
    vibrationFreq: 0,
    vibrationAmp: 0,
    gearDown: true,
  },
  [FlightPhase.STARTUP]: {
    altitude: -2.2,
    forwardZ: 180,
    pitch: 0,
    bankMax: 0,
    vibrationFreq: 12,
    vibrationAmp: 0.003,
    gearDown: true,
  },
  [FlightPhase.TAXI]: {
    altitude: -2.2,
    forwardZ: 80,
    pitch: 0,
    bankMax: 2,
    vibrationFreq: 0.5,
    vibrationAmp: 0.008,
    gearDown: true,
  },
  [FlightPhase.TAKEOFF]: {
    altitude: -2.2,
    forwardZ: -80,
    pitch: 8,
    bankMax: 3,
    vibrationFreq: 8,
    vibrationAmp: 0.012,
    gearDown: true,
  },
  [FlightPhase.CLIMB]: {
    altitude: 200,
    forwardZ: -600,
    pitch: 15,
    bankMax: 12,
    vibrationFreq: 2,
    vibrationAmp: 0.004,
    gearDown: false,
  },
  [FlightPhase.CRUISE]: {
    altitude: 1200,
    forwardZ: 0,
    pitch: 2,
    bankMax: 5,
    vibrationFreq: 1,
    vibrationAmp: 0.002,
    gearDown: false,
  },
  [FlightPhase.DESCENT]: {
    altitude: 300,
    forwardZ: 400,
    pitch: -4,
    bankMax: 8,
    vibrationFreq: 1.5,
    vibrationAmp: 0.003,
    gearDown: false,
  },
  [FlightPhase.LANDING]: {
    altitude: -2.2,
    forwardZ: 60,
    pitch: 3,
    bankMax: 2,
    vibrationFreq: 3,
    vibrationAmp: 0.006,
    gearDown: true,
  },
}

// Landing gear assembly
function LandingGear({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <group>
      {/* Nose gear */}
      <group position={[0, -0.8, 4.0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.85} />
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
      {/* Main gear L */}
      <group position={[-3.0, -0.8, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 8]} />
          <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.85} />
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 12]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
      {/* Main gear R */}
      <group position={[3.0, -0.8, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 8]} />
          <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.85} />
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 12]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

// Engine exhaust particles (simple emissive plane billboards)
function EngineExhaust({ side }: { side: -1 | 1 }) {
  const groupRef = useRef<THREE.Group>(null)
  const { isRunning } = useFlightStore()

  useFrame(state => {
    if (!groupRef.current || !isRunning) return
    const t = state.clock.elapsedTime
    // Gently pulse exhaust size
    const pulse = 0.9 + Math.sin(t * 8 + side) * 0.1
    groupRef.current.scale.set(pulse, pulse, pulse)
  })

  return (
    <group ref={groupRef} position={[side * 3.2, -0.5, -1.0]}>
      <mesh>
        <coneGeometry args={[0.28, 1.2, 12]} />
        <meshStandardMaterial
          color="#FF6600"
          emissive="#FF3300"
          emissiveIntensity={0.9}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function AircraftRoot() {
  const groupRef = useRef<THREE.Group>(null)
  const { currentPhase, phaseProgress } = useFlightStore()
  const t = useTelemetryStore(s => s.data)

  const lerpedPose = useRef({
    altitude: -2.2,
    forwardZ: 180,
    pitch: 0,
    vibPhase: 0,
  })

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const target = PHASE_POSE[currentPhase]
    const sp = Math.min(delta * 0.6, 1)

    lerpedPose.current.altitude = THREE.MathUtils.lerp(
      lerpedPose.current.altitude,
      target.altitude,
      sp
    )
    lerpedPose.current.forwardZ = THREE.MathUtils.lerp(
      lerpedPose.current.forwardZ,
      target.forwardZ,
      sp * 0.3
    )
    lerpedPose.current.pitch = THREE.MathUtils.lerp(lerpedPose.current.pitch, target.pitch, sp)

    // Vibration
    const vib =
      target.vibrationAmp > 0
        ? Math.sin(state.clock.elapsedTime * target.vibrationFreq) * target.vibrationAmp
        : 0

    // Bank from telemetry
    const bank = THREE.MathUtils.degToRad(-t.roll * 0.4)
    const pitch = THREE.MathUtils.degToRad(-lerpedPose.current.pitch * 0.12)

    groupRef.current.position.set(0, lerpedPose.current.altitude + vib, lerpedPose.current.forwardZ)
    groupRef.current.rotation.z = bank
    groupRef.current.rotation.x = pitch
    groupRef.current.rotation.y = THREE.MathUtils.degToRad(-t.heading * 0.01) // subtle heading

    // Taxi forward movement
    if (currentPhase === FlightPhase.TAXI) {
      groupRef.current.position.z -= phaseProgress * 100
    }
  })

  const gearDown = PHASE_POSE[currentPhase].gearDown

  return (
    <group ref={groupRef}>
      {/* ── Fuselage ── */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.7, 8, 8, 16]} />
        <meshStandardMaterial color="#C8D8E8" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ── Wings ── */}
      <mesh position={[0, -0.1, 0.2]}>
        <boxGeometry args={[14, 0.12, 2.5]} />
        <meshStandardMaterial color="#B8C8D8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wing sweep tip L */}
      <mesh position={[-6.5, 0.3, -0.3]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[1.6, 0.08, 0.6]} />
        <meshStandardMaterial
          color="#00D4FF"
          metalness={0.9}
          roughness={0.1}
          emissive="#00D4FF"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Wing sweep tip R */}
      <mesh position={[6.5, 0.3, -0.3]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[1.6, 0.08, 0.6]} />
        <meshStandardMaterial
          color="#00D4FF"
          metalness={0.9}
          roughness={0.1}
          emissive="#00D4FF"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Horizontal stabilizer */}
      <mesh position={[0, 0.1, -4.2]}>
        <boxGeometry args={[5.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#B8C8D8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Vertical stabilizer */}
      <mesh position={[0, 1.1, -3.9]}>
        <boxGeometry args={[0.12, 2.1, 1.5]} />
        <meshStandardMaterial color="#B8C8D8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engine nacelles */}
      {[-3.2, 3.2].map((x, i) => (
        <group key={i} position={[x, -0.5, 0.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.42, 2.0, 16]} />
            <meshStandardMaterial color="#888898" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Fan face */}
          <mesh position={[0, 0, 1.02]}>
            <circleGeometry args={[0.34, 16]} />
            <meshStandardMaterial color="#333344" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Exhaust heat */}
      <EngineExhaust side={-1} />
      <EngineExhaust side={1} />

      {/* Landing gear */}
      <LandingGear visible={gearDown} />

      {/* Nav lights */}
      <pointLight position={[7.4, 0, 0]} color="#FF3333" intensity={0.9} distance={18} />
      <pointLight position={[-7.4, 0, 0]} color="#33FF33" intensity={0.9} distance={18} />
      <pointLight position={[0, 0, -5.2]} color="#FFFFFF" intensity={0.6} distance={14} />

      {/* Cockpit interior (always inside) */}
      <CockpitInterior />
    </group>
  )
}
