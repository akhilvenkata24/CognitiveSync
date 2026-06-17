import * as THREE from 'three'

// Pilot seat with harness
export function PilotSeat() {
  return (
    <group position={[0, -0.1, 0.8]}>
      {/* Seat base / cushion */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.68, 0.1, 0.7]} />
        <meshStandardMaterial color="#1A1E28" roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Seat back */}
      <mesh position={[0, 0.6, -0.32]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.64, 1.1, 0.1]} />
        <meshStandardMaterial color="#1A1E28" roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Headrest */}
      <mesh position={[0, 1.18, -0.31]}>
        <boxGeometry args={[0.36, 0.28, 0.12]} />
        <meshStandardMaterial color="#131620" roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Armrest L */}
      <mesh position={[-0.38, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.48]} />
        <meshStandardMaterial color="#263040" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Armrest R */}
      <mesh position={[0.38, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.48]} />
        <meshStandardMaterial color="#263040" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Seat rails */}
      {[-0.26, 0.26].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0]}>
          <boxGeometry args={[0.04, 0.06, 0.8]} />
          <meshStandardMaterial color="#445566" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}

      {/* Harness straps — diagonal */}
      <mesh position={[-0.16, 0.55, -0.26]} rotation={[0.1, 0, 0.45]}>
        <boxGeometry args={[0.04, 0.5, 0.015]} />
        <meshStandardMaterial color="#E05020" roughness={0.8} />
      </mesh>
      <mesh position={[0.16, 0.55, -0.26]} rotation={[0.1, 0, -0.45]}>
        <boxGeometry args={[0.04, 0.5, 0.015]} />
        <meshStandardMaterial color="#E05020" roughness={0.8} />
      </mesh>

      {/* Lap strap */}
      <mesh position={[0, 0.06, 0.06]}>
        <boxGeometry args={[0.5, 0.035, 0.015]} />
        <meshStandardMaterial color="#E05020" roughness={0.8} />
      </mesh>

      {/* Central buckle */}
      <mesh position={[0, 0.18, -0.04]}>
        <boxGeometry args={[0.06, 0.06, 0.025]} />
        <meshStandardMaterial color="#778899" roughness={0.35} metalness={0.9} />
      </mesh>
    </group>
  )
}
