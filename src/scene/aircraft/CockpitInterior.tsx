import { PilotSeat } from './PilotSeat'
import { InstrumentPanel } from './InstrumentPanel'
import { PilotAvatar } from './PilotAvatar'

// Side wall panels
function SideWall({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 1.35, 0.5, 1.5]}>
      {/* Main wall */}
      <mesh>
        <boxGeometry args={[0.06, 1.8, 3.4]} />
        <meshStandardMaterial color="#141C24" roughness={0.88} metalness={0.08} />
      </mesh>
      {/* Window opening */}
      <mesh position={[0, 0.25, 0.3]}>
        <boxGeometry args={[0.08, 0.45, 0.65]} />
        <meshStandardMaterial
          color="#001840"
          transparent
          opacity={0.55}
          roughness={0.0}
          depthWrite={false}
        />
      </mesh>
      {/* Arm rail */}
      <mesh position={[side * -0.04, -0.3, 0]}>
        <boxGeometry args={[0.04, 0.06, 2.8]} />
        <meshStandardMaterial color="#2A3845" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  )
}

// Cockpit ceiling / glareshield
function Glareshield() {
  return (
    <group position={[0, 1.35, 2.2]}>
      {/* Main glareshield top */}
      <mesh>
        <boxGeometry args={[2.2, 0.08, 1.0]} />
        <meshStandardMaterial color="#0C1018" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Eyebrow lights strip */}
      <mesh position={[0, -0.05, 0.45]}>
        <boxGeometry args={[1.8, 0.025, 0.04]} />
        <meshStandardMaterial color="#FF8800" emissive="#FF6600" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

// Cockpit floor
function CockpitFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 1.2]}>
      <planeGeometry args={[2.6, 3.2]} />
      <meshStandardMaterial color="#0D1218" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

// Rudder pedals
function RudderPedals() {
  return (
    <group position={[0, -0.2, 2.4]}>
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.16, 0.06, 0.24]} />
          <meshStandardMaterial color="#2A3440" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export function CockpitInterior() {
  return (
    <group>
      <SideWall side={-1} />
      <SideWall side={1} />
      <Glareshield />
      <CockpitFloor />
      <RudderPedals />
      <PilotSeat />
      <PilotAvatar />
      <InstrumentPanel />
    </group>
  )
}
