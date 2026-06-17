import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlightStore } from '../../store/useFlightStore'
import { FlightPhase } from '../../types/flightPhase'
import { createWindshieldMaterial } from './WindshieldShader'

// Frost intensity per phase
const FROST_BY_PHASE: Record<FlightPhase, number> = {
  [FlightPhase.PREFLIGHT]: 0.65,
  [FlightPhase.STARTUP]: 0.3,
  [FlightPhase.TAXI]: 0.05,
  [FlightPhase.TAKEOFF]: 0.0,
  [FlightPhase.CLIMB]: 0.1,
  [FlightPhase.CRUISE]: 0.2,
  [FlightPhase.DESCENT]: 0.05,
  [FlightPhase.LANDING]: 0.0,
}

function Windshield() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const { currentPhase } = useFlightStore()
  const material = useMemo(() => createWindshieldMaterial(), [])

  useFrame((state, delta) => {
    if (!matRef.current) return
    matRef.current.uniforms.time.value = state.clock.elapsedTime
    const targetFrost = FROST_BY_PHASE[currentPhase]
    matRef.current.uniforms.frostIntensity.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.frostIntensity.value,
      targetFrost,
      delta * 0.4
    )
  })

  return (
    <group>
      {/* Main windshield panes */}
      <mesh position={[0, 1.05, 3.55]} rotation={[0.25, 0, 0]} renderOrder={10}>
        <planeGeometry args={[2.4, 1.0]} />
        <primitive object={material} ref={matRef} attach="material" />
      </mesh>
      {/* Left pane */}
      <mesh position={[-1.0, 0.9, 3.3]} rotation={[0.15, 0.35, 0]} renderOrder={10}>
        <planeGeometry args={[0.9, 0.8]} />
        <meshStandardMaterial
          color="#001840"
          transparent
          opacity={0.35}
          depthWrite={false}
          roughness={0.0}
          metalness={0.1}
        />
      </mesh>
      {/* Right pane */}
      <mesh position={[1.0, 0.9, 3.3]} rotation={[0.15, -0.35, 0]} renderOrder={10}>
        <planeGeometry args={[0.9, 0.8]} />
        <meshStandardMaterial
          color="#001840"
          transparent
          opacity={0.35}
          depthWrite={false}
          roughness={0.0}
          metalness={0.1}
        />
      </mesh>
      {/* Windshield frame / surround */}
      <mesh position={[0, 1.05, 3.5]}>
        <boxGeometry args={[2.6, 1.15, 0.04]} />
        <meshStandardMaterial color="#1A2030" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  )
}

// Instrument gauge (circular analog)
function AnalogGauge({
  position,
  label,
  value,
  minAngle = -140,
  maxAngle = 140,
}: {
  position: [number, number, number]
  label: string
  value: number // 0–1
  minAngle?: number
  maxAngle?: number
}) {
  const needleRef = useRef<THREE.Mesh>(null)
  const targetAngle = minAngle + value * (maxAngle - minAngle)
  const needleAngle = useRef(minAngle)

  useFrame((_, delta) => {
    if (!needleRef.current) return
    needleAngle.current = THREE.MathUtils.lerp(needleAngle.current, targetAngle, delta * 3)
    needleRef.current.rotation.z = THREE.MathUtils.degToRad(-needleAngle.current)
  })

  return (
    <group position={position}>
      {/* Gauge face */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.008, 32]} />
        <meshStandardMaterial color="#0A0E14" roughness={0.8} />
      </mesh>
      {/* Rim */}
      <mesh>
        <torusGeometry args={[0.082, 0.008, 8, 32]} />
        <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.005, 0.065, 0.003]} />
        <meshStandardMaterial color="#FF4400" emissive="#FF2200" emissiveIntensity={0.5} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0, 0.008]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#334455" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  )
}

// MFD screen (emissive panel)
function MFDScreen({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  color = '#001830',
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
}) {
  const { isRunning } = useFlightStore()
  const emissiveIntensity = isRunning ? 0.6 : 0.05

  return (
    <group position={position} rotation={rotation}>
      {/* Screen bezel */}
      <mesh>
        <boxGeometry args={[0.38, 0.28, 0.015]} />
        <meshStandardMaterial color="#0A0D14" roughness={0.8} metalness={0.4} />
      </mesh>
      {/* Screen face */}
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[0.34, 0.24]} />
        <meshStandardMaterial
          color={color}
          emissive={isRunning ? '#003080' : '#000810'}
          emissiveIntensity={emissiveIntensity}
          roughness={0.05}
        />
      </mesh>
      {/* Simulated data lines */}
      {isRunning &&
        [0.06, 0, -0.06].map((y, i) => (
          <mesh key={i} position={[0, y, 0.011]}>
            <planeGeometry args={[0.28, 0.012]} />
            <meshStandardMaterial
              color="#00D4FF"
              emissive="#00AAFF"
              emissiveIntensity={0.4 + i * 0.15}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
    </group>
  )
}

// Overhead panel
function OverheadPanel() {
  return (
    <group position={[0, 1.85, 0.5]} rotation={[0.3, 0, 0]}>
      <mesh>
        <boxGeometry args={[1.4, 0.6, 0.04]} />
        <meshStandardMaterial color="#131820" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Switch indicators (emissive dots) */}
      {Array.from({ length: 12 }, (_, i) => ({
        x: ((i % 4) - 1.5) * 0.28,
        y: (Math.floor(i / 4) - 1) * 0.18,
      })).map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.025]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#223344"
            emissive={i % 3 === 0 ? '#00FF88' : i % 3 === 1 ? '#FF8800' : '#334455'}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// Throttle quadrant
function ThrottleQuadrant() {
  const { currentPhase } = useFlightStore()
  const throttleRef = useRef<THREE.Mesh>(null)

  const targetY: Record<FlightPhase, number> = {
    [FlightPhase.PREFLIGHT]: -0.08,
    [FlightPhase.STARTUP]: -0.05,
    [FlightPhase.TAXI]: -0.02,
    [FlightPhase.TAKEOFF]: 0.09,
    [FlightPhase.CLIMB]: 0.06,
    [FlightPhase.CRUISE]: 0.03,
    [FlightPhase.DESCENT]: -0.01,
    [FlightPhase.LANDING]: -0.04,
  }

  useFrame((_, delta) => {
    if (!throttleRef.current) return
    throttleRef.current.position.y = THREE.MathUtils.lerp(
      throttleRef.current.position.y,
      targetY[currentPhase],
      delta * 1.5
    )
  })

  return (
    <group position={[0.55, 0.65, 0.4]} rotation={[-0.3, 0, 0]}>
      {/* Base */}
      <mesh>
        <boxGeometry args={[0.15, 0.04, 0.2]} />
        <meshStandardMaterial color="#1A2030" roughness={0.8} metalness={0.4} />
      </mesh>
      {/* Throttle lever */}
      <mesh ref={throttleRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
        <meshStandardMaterial color="#334455" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Throttle grip */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#556677" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

export function InstrumentPanel() {
  const t = useRef({ airspeed: 0, altitude: 0, vsi: 0.5, heading: 0.5 })
  const { currentPhase, phaseProgress } = useFlightStore()

  // Derive instrument values from phase
  const airspeed =
    {
      [FlightPhase.PREFLIGHT]: 0,
      [FlightPhase.STARTUP]: 0,
      [FlightPhase.TAXI]: 0.05 + phaseProgress * 0.05,
      [FlightPhase.TAKEOFF]: 0.1 + phaseProgress * 0.6,
      [FlightPhase.CLIMB]: 0.6 + phaseProgress * 0.2,
      [FlightPhase.CRUISE]: 0.75,
      [FlightPhase.DESCENT]: 0.7 - phaseProgress * 0.2,
      [FlightPhase.LANDING]: 0.5 - phaseProgress * 0.4,
    }[currentPhase] ?? 0

  const altitude =
    {
      [FlightPhase.PREFLIGHT]: 0,
      [FlightPhase.STARTUP]: 0,
      [FlightPhase.TAXI]: 0,
      [FlightPhase.TAKEOFF]: phaseProgress * 0.1,
      [FlightPhase.CLIMB]: 0.1 + phaseProgress * 0.5,
      [FlightPhase.CRUISE]: 0.6,
      [FlightPhase.DESCENT]: 0.6 - phaseProgress * 0.5,
      [FlightPhase.LANDING]: 0.1 - phaseProgress * 0.1,
    }[currentPhase] ?? 0

  return (
    <group position={[0, 0.88, 3.2]}>
      {/* Panel substrate */}
      <mesh>
        <boxGeometry args={[2.2, 0.85, 0.05]} />
        <meshStandardMaterial color="#0C1018" roughness={0.85} metalness={0.15} />
      </mesh>
      {/* ── Primary Flight Row ── */}
      <AnalogGauge position={[-0.55, 0.2, 0.04]} label="AIRSPEED" value={airspeed} />
      <AnalogGauge position={[0, 0.2, 0.04]} label="ATT" value={0.5} />
      <AnalogGauge position={[0.55, 0.2, 0.04]} label="ALT" value={altitude} />
      {/* ── Lower Row ── */}
      <AnalogGauge position={[-0.55, -0.05, 0.04]} label="TURN" value={0.5} />
      <AnalogGauge position={[0, -0.05, 0.04]} label="HEADING" value={0.5} />
      <AnalogGauge position={[0.55, -0.05, 0.04]} label="VSI" value={0.5} />
      {/* ── MFD Screens ── */}
      <MFDScreen position={[-0.75, 0.06, 0.04]} color="#001428" /> {/* PFD */}
      <MFDScreen position={[0.75, 0.06, 0.04]} color="#001428" /> {/* ND */}
      {/* ── Engine gauges (right sub-panel) ── */}
      <group position={[0.88, 0.18, 0.04]}>
        <AnalogGauge position={[0, 0.12, 0]} label="N1" value={airspeed} />
        <AnalogGauge position={[0, -0.08, 0]} label="EGT" value={airspeed * 0.7} />
      </group>
      {/* Overhead panel */}
      <OverheadPanel />
      {/* Throttle */}
      <ThrottleQuadrant />
      {/* Center console / yoke column */}
      <mesh position={[0, -0.55, 0.1]}>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 12]} />
        <meshStandardMaterial color="#2A3340" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Windshield */}
      <Windshield />
    </group>
  )
}
