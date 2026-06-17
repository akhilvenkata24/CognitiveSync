import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'

// Tire smoke burst (shown briefly on touchdown)
function TireSmoke() {
  const groupRef = useRef<THREE.Group>(null)
  const { currentPhase, phaseProgress } = useFlightStore()
  const active = currentPhase === FlightPhase.LANDING && phaseProgress < 0.15

  useFrame(state => {
    if (!groupRef.current) return
    groupRef.current.visible = active
    if (active) {
      const t = state.clock.elapsedTime
      groupRef.current.scale.setScalar(1 + phaseProgress * 4)
      groupRef.current.position.y = -2.2 + phaseProgress * 2
      // Drift sideways
      groupRef.current.position.x = Math.sin(t * 0.3) * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, -2.2, 0]}>
      {[-3, 3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#CCCCCC" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Engine contrail ribbons (active above cruise altitude)
function Contrails() {
  const { currentPhase } = useFlightStore()
  const active = ([FlightPhase.CLIMB, FlightPhase.CRUISE] as FlightPhase[]).includes(currentPhase)

  if (!active) return null

  return (
    <group>
      {[-3.2, 3.2].map((x, i) => (
        <mesh key={i} position={[x, -0.5, -20]}>
          <cylinderGeometry args={[0.15, 0.8, 40, 8]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Ground fog / runway heat shimmer plane
function GroundFog() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const { currentPhase } = useFlightStore()

  const TARGET_OPACITY: Record<FlightPhase, number> = {
    [FlightPhase.PREFLIGHT]: 0.22,
    [FlightPhase.STARTUP]: 0.12,
    [FlightPhase.TAXI]: 0.04,
    [FlightPhase.TAKEOFF]: 0.0,
    [FlightPhase.CLIMB]: 0.0,
    [FlightPhase.CRUISE]: 0.0,
    [FlightPhase.DESCENT]: 0.05,
    [FlightPhase.LANDING]: 0.15,
  }

  useFrame((_, delta) => {
    if (!matRef.current) return
    const target = TARGET_OPACITY[currentPhase]
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, delta * 0.5)
    if (meshRef.current) {
      meshRef.current.visible = matRef.current.opacity > 0.005
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        ref={matRef}
        color="#B8C8D8"
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </mesh>
  )
}

// Lens flare sun — simple additive billboard
function SunFlare() {
  const ref = useRef<THREE.Mesh>(null)
  const { currentPhase } = useFlightStore()

  useFrame(({ camera }) => {
    if (!ref.current) return
    // Only visible in cruise when sun is overhead
    ref.current.visible = currentPhase === FlightPhase.CRUISE
    // Billboard
    ref.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={ref} position={[200, 400, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial
        color="#FFFFFF"
        emissive="#FFFFD0"
        emissiveIntensity={2.0}
        transparent
        opacity={0.06}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Cloud penetration white flash (climb through clouds)
function CloudPenetrationFlash() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const { currentPhase, phaseProgress } = useFlightStore()

  const showFlash =
    (currentPhase === FlightPhase.CLIMB && phaseProgress > 0.08 && phaseProgress < 0.25) ||
    (currentPhase === FlightPhase.DESCENT && phaseProgress > 0.2 && phaseProgress < 0.35)

  useFrame((_, delta) => {
    if (!matRef.current) return
    const target = showFlash ? 0.55 : 0
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, delta * 2.5)
  })

  return (
    <mesh position={[0, 0, -0.5]} renderOrder={999}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial
        ref={matRef}
        color="#FFFFFF"
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

export function VFXLayer() {
  return (
    <>
      <TireSmoke />
      <Contrails />
      <GroundFog />
      <SunFlare />
      <CloudPenetrationFlash />
    </>
  )
}
