import { useMemo } from 'react'
import * as THREE from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'

const GROUND_PHASES: FlightPhase[] = [
  FlightPhase.PREFLIGHT,
  FlightPhase.STARTUP,
  FlightPhase.TAXI,
  FlightPhase.TAKEOFF,
  FlightPhase.LANDING,
]

// Instanced runway centerline lights
function RunwayCenterlineLights() {
  const count = 100
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const instancedRef = useMemo(() => {
    // Will be set by ref
    return null
  }, [])
  void instancedRef
  void dummy

  const positions = useMemo(() => Array.from({ length: count }, (_, i) => i * 3.6 - 180), [])

  return (
    <group>
      {positions.map((z, i) => (
        <mesh key={i} position={[0, -2.17, z]}>
          <boxGeometry args={[0.08, 0.02, 0.3]} />
          <meshStandardMaterial color="#FFFFE0" emissive="#FFFFC0" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  )
}

// Runway threshold markings
function ThresholdMarkings({ z }: { z: number }) {
  const bars = [-9, -6, -3, 0, 3, 6, 9]
  return (
    <group position={[0, -2.18, z]}>
      {bars.map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 6]} />
          <meshStandardMaterial color="#EEEEEE" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Touchdown zone stripes
function TouchdownZone({ z }: { z: number }) {
  return (
    <group position={[0, -2.185, z]}>
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * 8, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 16]} />
          <meshStandardMaterial color="#DDDDDD" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// PAPI lights (4 lights, angled for glideslope indication)
function PAPILights() {
  return (
    <group position={[35, -2.1, -120]}>
      {[0, 1, 2, 3].map(i => (
        <group key={i} position={[i * 3, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 0.6, 0.4]} />
            <meshStandardMaterial color="#333" roughness={0.8} />
          </mesh>
          <pointLight
            position={[0, 0.5, 0]}
            color={i < 2 ? '#FF3300' : '#FFFFFF'}
            intensity={3}
            distance={80}
          />
        </group>
      ))}
    </group>
  )
}

// Approach strobe sequence lights
function ApproachLights() {
  const positions = useMemo(() => Array.from({ length: 8 }, (_, i) => -(140 + i * 20)), [])

  return (
    <group>
      {positions.map((z, i) => (
        <group key={i} position={[0, -2.1, z]}>
          <mesh>
            <boxGeometry args={[0.3, 0.15, 0.3]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Terrain() {
  const { currentPhase } = useFlightStore()
  const showGround = GROUND_PHASES.includes(currentPhase)

  if (!showGround) {
    // Cruise/Climb — show cloud-top texture only
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -500, 0]}>
        <planeGeometry args={[80000, 80000]} />
        <meshStandardMaterial color="#C8D4E0" roughness={1} />
      </mesh>
    )
  }

  return (
    <>
      {/* Outer tarmac / apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.22, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#0F1520" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Grass infield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.23, 0]}>
        <planeGeometry args={[8000, 8000]} />
        <meshStandardMaterial color="#1A2A10" roughness={1} />
      </mesh>

      {/* Main runway surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <planeGeometry args={[60, 400]} />
        <meshStandardMaterial color="#1C2433" roughness={0.88} metalness={0} />
      </mesh>

      {/* Runway center line stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.19, 0]}>
        <planeGeometry args={[0.4, 380]} />
        <meshStandardMaterial color="#CCCC88" roughness={1} />
      </mesh>

      {/* Edge lines */}
      {[-28, 28].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -2.195, 0]}>
          <planeGeometry args={[0.5, 380]} />
          <meshStandardMaterial color="#DDDDDD" roughness={1} />
        </mesh>
      ))}

      {/* Threshold markings at both ends */}
      <ThresholdMarkings z={-185} />
      <ThresholdMarkings z={185} />

      {/* Touchdown zones */}
      <TouchdownZone z={-140} />
      <TouchdownZone z={140} />

      {/* Runway centerline lights */}
      <RunwayCenterlineLights />

      {/* PAPI */}
      <PAPILights />

      {/* Approach lights */}
      <ApproachLights />

      {/* Taxiway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, -2.21, 180]}>
        <planeGeometry args={[60, 80]} />
        <meshStandardMaterial color="#141C28" roughness={0.9} />
      </mesh>

      {/* Taxiway centerline (yellow) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, -2.205, 180]}>
        <planeGeometry args={[0.3, 80]} />
        <meshStandardMaterial
          color="#AAAA00"
          emissive="#888800"
          emissiveIntensity={0.4}
          roughness={1}
        />
      </mesh>

      {/* Distant mountains silhouette */}
      {[0, 60, 120, 180, 240, 300].map((ry, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((ry * Math.PI) / 180) * 4000,
            200,
            Math.cos((ry * Math.PI) / 180) * 4000,
          ]}
        >
          <coneGeometry args={[600 + Math.random() * 400, 600 + Math.random() * 200, 5]} />
          <meshStandardMaterial color="#1A2228" roughness={1} />
        </mesh>
      ))}
    </>
  )
}
