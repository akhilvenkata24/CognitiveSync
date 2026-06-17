import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'

// Which cloud tiers are visible per phase
const PHASE_CLOUDS: Record<
  FlightPhase,
  { high: boolean; mid: boolean; low: boolean; fogDensity: number }
> = {
  [FlightPhase.PREFLIGHT]: { high: true, mid: true, low: true, fogDensity: 0.04 },
  [FlightPhase.STARTUP]: { high: true, mid: true, low: true, fogDensity: 0.02 },
  [FlightPhase.TAXI]: { high: true, mid: true, low: false, fogDensity: 0.005 },
  [FlightPhase.TAKEOFF]: { high: true, mid: true, low: false, fogDensity: 0.001 },
  [FlightPhase.CLIMB]: { high: true, mid: true, low: false, fogDensity: 0.0 },
  [FlightPhase.CRUISE]: { high: false, mid: false, low: false, fogDensity: 0.0 },
  [FlightPhase.DESCENT]: { high: true, mid: true, low: false, fogDensity: 0.002 },
  [FlightPhase.LANDING]: { high: true, mid: true, low: true, fogDensity: 0.03 },
}

// ── High cirrus layer ─────────────────────────────────────────────────────────
function CirrusLayer() {
  const groupRef = useRef<THREE.Group>(null)
  const { currentPhase } = useFlightStore()
  const count = 16

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.position.x += delta * 5 // 5 m/s eastward drift
    if (groupRef.current.position.x > 3000) groupRef.current.position.x -= 6000
    const visible = PHASE_CLOUDS[currentPhase].high
    groupRef.current.visible = visible
  })

  const planes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 6000,
      z: (Math.random() - 0.5) * 6000,
      ry: Math.random() * Math.PI,
      sx: 600 + Math.random() * 600,
      sz: 80 + Math.random() * 120,
    }))
  }, [])

  return (
    <group ref={groupRef} position={[0, 10000, 0]}>
      {planes.map((p, i) => (
        <mesh key={i} position={[p.x, 0, p.z]} rotation={[-Math.PI / 2, 0, p.ry]}>
          <planeGeometry args={[p.sx, p.sz]} />
          <meshStandardMaterial
            color="#FFFFFF"
            transparent
            opacity={0.18}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Mid cumulus layer ─────────────────────────────────────────────────────────
function CloudBillboard({ pos }: { pos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ camera }) => {
    if (!ref.current) return
    ref.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={ref} position={pos}>
      <planeGeometry args={[320, 180]} />
      <meshStandardMaterial
        color="#E8EEF5"
        transparent
        opacity={0.55}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

function CumulusLayer() {
  const groupRef = useRef<THREE.Group>(null)
  const { currentPhase } = useFlightStore()
  const count = 40

  const positions = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: count }, () => [
        (Math.random() - 0.5) * 12000,
        2800 + Math.random() * 1200,
        (Math.random() - 0.5) * 12000,
      ]),
    []
  )

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.position.x += delta * 8
    if (groupRef.current.position.x > 4000) groupRef.current.position.x -= 8000
    groupRef.current.visible = PHASE_CLOUDS[currentPhase].mid
  })

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <CloudBillboard key={i} pos={p} />
      ))}
    </group>
  )
}

// ── Low stratus / ground fog ──────────────────────────────────────────────────
function StratusLayer() {
  const { currentPhase } = useFlightStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const targetOpacity = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current || !matRef.current) return
    const cfg = PHASE_CLOUDS[currentPhase]
    targetOpacity.current = cfg.low ? 0.35 : 0
    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      targetOpacity.current,
      delta * 0.8
    )
    meshRef.current.visible = matRef.current.opacity > 0.01
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 350, 0]}>
      <planeGeometry args={[8000, 8000]} />
      <meshStandardMaterial
        ref={matRef}
        color="#C8D4E0"
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function CloudSystem() {
  return (
    <>
      <CirrusLayer />
      <CumulusLayer />
      <StratusLayer />
    </>
  )
}
