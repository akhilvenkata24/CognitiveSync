import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'

// Lighting parameters per phase
interface LightingParams {
  sunIntensity: number
  sunColorK: number // Kelvin
  sunElevation: number // degrees
  ambientIntensity: number
  hemisphereIntensity: number
  cockpitFillIntensity: number
  instrumentGlowIntensity: number
  landingLightsOn: boolean
  strobeOn: boolean
  runwayLightsOn: boolean
}

const PHASE_LIGHTING: Record<FlightPhase, LightingParams> = {
  [FlightPhase.PREFLIGHT]: {
    sunIntensity: 0.0,
    sunColorK: 2800,
    sunElevation: -5,
    ambientIntensity: 0.08,
    hemisphereIntensity: 0.12,
    cockpitFillIntensity: 0.04,
    instrumentGlowIntensity: 0.0,
    landingLightsOn: false,
    strobeOn: false,
    runwayLightsOn: true,
  },
  [FlightPhase.STARTUP]: {
    sunIntensity: 0.3,
    sunColorK: 3200,
    sunElevation: 2,
    ambientIntensity: 0.2,
    hemisphereIntensity: 0.25,
    cockpitFillIntensity: 0.05,
    instrumentGlowIntensity: 0.06,
    landingLightsOn: false,
    strobeOn: true,
    runwayLightsOn: true,
  },
  [FlightPhase.TAXI]: {
    sunIntensity: 1.2,
    sunColorK: 3800,
    sunElevation: 10,
    ambientIntensity: 0.5,
    hemisphereIntensity: 0.55,
    cockpitFillIntensity: 0.04,
    instrumentGlowIntensity: 0.05,
    landingLightsOn: false,
    strobeOn: true,
    runwayLightsOn: true,
  },
  [FlightPhase.TAKEOFF]: {
    sunIntensity: 2.0,
    sunColorK: 4800,
    sunElevation: 18,
    ambientIntensity: 0.8,
    hemisphereIntensity: 0.8,
    cockpitFillIntensity: 0.03,
    instrumentGlowIntensity: 0.04,
    landingLightsOn: true,
    strobeOn: true,
    runwayLightsOn: true,
  },
  [FlightPhase.CLIMB]: {
    sunIntensity: 2.8,
    sunColorK: 5200,
    sunElevation: 30,
    ambientIntensity: 1.0,
    hemisphereIntensity: 1.1,
    cockpitFillIntensity: 0.02,
    instrumentGlowIntensity: 0.03,
    landingLightsOn: false,
    strobeOn: true,
    runwayLightsOn: false,
  },
  [FlightPhase.CRUISE]: {
    sunIntensity: 3.5,
    sunColorK: 5800,
    sunElevation: 55,
    ambientIntensity: 1.3,
    hemisphereIntensity: 1.4,
    cockpitFillIntensity: 0.025,
    instrumentGlowIntensity: 0.035,
    landingLightsOn: false,
    strobeOn: true,
    runwayLightsOn: false,
  },
  [FlightPhase.DESCENT]: {
    sunIntensity: 1.8,
    sunColorK: 4000,
    sunElevation: 20,
    ambientIntensity: 0.7,
    hemisphereIntensity: 0.75,
    cockpitFillIntensity: 0.04,
    instrumentGlowIntensity: 0.05,
    landingLightsOn: false,
    strobeOn: true,
    runwayLightsOn: false,
  },
  [FlightPhase.LANDING]: {
    sunIntensity: 0.6,
    sunColorK: 2500,
    sunElevation: 3,
    ambientIntensity: 0.3,
    hemisphereIntensity: 0.35,
    cockpitFillIntensity: 0.06,
    instrumentGlowIntensity: 0.08,
    landingLightsOn: true,
    strobeOn: true,
    runwayLightsOn: true,
  },
}

function kelvinToRGB(k: number): [number, number, number] {
  const t = k / 100
  let r: number, g: number, b: number
  if (t <= 66) {
    r = 1.0
    g = Math.max(0, Math.min(1, (99.4708025861 * Math.log(t) - 161.1195681661) / 255))
    b =
      t <= 19
        ? 0
        : Math.max(0, Math.min(1, (138.5177312231 * Math.log(t - 10) - 305.0447927307) / 255))
  } else {
    r = Math.max(0, Math.min(1, (329.698727446 * Math.pow(t - 60, -0.1332047592)) / 255))
    g = Math.max(0, Math.min(1, (288.1221695283 * Math.pow(t - 60, -0.0755148492)) / 255))
    b = 1.0
  }
  return [r, g, b]
}

export function LightingRig() {
  const { currentPhase } = useFlightStore()
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const ambRef = useRef<THREE.AmbientLight>(null)
  const hemiRef = useRef<THREE.HemisphereLight>(null)
  const fillLRef = useRef<THREE.PointLight>(null)
  const fillRRef = useRef<THREE.PointLight>(null)
  const igRef = useRef<THREE.PointLight>(null)
  const landingLRef = useRef<THREE.SpotLight>(null)
  const landingRRef = useRef<THREE.SpotLight>(null)
  const strobeRef = useRef<THREE.PointLight>(null)

  // Lerped targets
  const lerped = useRef({
    sunIntensity: 0,
    ambientIntensity: 0.08,
    hemisphereIntensity: 0.12,
    cockpitFillIntensity: 0.04,
    instrumentGlowIntensity: 0,
    sunElevation: -5,
    sunColorK: 2800,
  })

  useFrame((state, delta) => {
    const target = PHASE_LIGHTING[currentPhase]
    const s = Math.min(delta * 0.5, 1) // slow lerp ~2s blend

    lerped.current.sunIntensity = THREE.MathUtils.lerp(
      lerped.current.sunIntensity,
      target.sunIntensity,
      s
    )
    lerped.current.ambientIntensity = THREE.MathUtils.lerp(
      lerped.current.ambientIntensity,
      target.ambientIntensity,
      s
    )
    lerped.current.hemisphereIntensity = THREE.MathUtils.lerp(
      lerped.current.hemisphereIntensity,
      target.hemisphereIntensity,
      s
    )
    lerped.current.cockpitFillIntensity = THREE.MathUtils.lerp(
      lerped.current.cockpitFillIntensity,
      target.cockpitFillIntensity,
      s
    )
    lerped.current.instrumentGlowIntensity = THREE.MathUtils.lerp(
      lerped.current.instrumentGlowIntensity,
      target.instrumentGlowIntensity,
      s
    )
    lerped.current.sunElevation = THREE.MathUtils.lerp(
      lerped.current.sunElevation,
      target.sunElevation,
      s * 0.3
    )
    lerped.current.sunColorK = THREE.MathUtils.lerp(lerped.current.sunColorK, target.sunColorK, s)

    // Sun
    if (sunRef.current) {
      sunRef.current.intensity = lerped.current.sunIntensity
      const [r, g, b] = kelvinToRGB(lerped.current.sunColorK)
      sunRef.current.color.setRGB(r, g, b)
      const elevRad = THREE.MathUtils.degToRad(lerped.current.sunElevation)
      sunRef.current.position.set(Math.cos(elevRad) * 200, Math.sin(elevRad) * 200, 100)
    }

    // Ambient
    if (ambRef.current) ambRef.current.intensity = lerped.current.ambientIntensity

    // Hemisphere
    if (hemiRef.current) {
      hemiRef.current.intensity = lerped.current.hemisphereIntensity
      const [r, g, b] = kelvinToRGB(lerped.current.sunColorK)
      hemiRef.current.color.setRGB(r * 0.6, g * 0.6, b * 0.7)
    }

    // Cockpit fills
    if (fillLRef.current) fillLRef.current.intensity = lerped.current.cockpitFillIntensity
    if (fillRRef.current) fillRRef.current.intensity = lerped.current.cockpitFillIntensity
    if (igRef.current) igRef.current.intensity = lerped.current.instrumentGlowIntensity

    // Landing lights
    const ll = target.landingLightsOn
    if (landingLRef.current) landingLRef.current.intensity = ll ? 8.0 : 0
    if (landingRRef.current) landingRRef.current.intensity = ll ? 8.0 : 0

    // Strobe (1 Hz pulse)
    if (strobeRef.current) {
      const pulse = target.strobeOn && Math.sin(state.clock.elapsedTime * 2 * Math.PI) > 0.9
      strobeRef.current.intensity = pulse ? 6.0 : 0
    }
  })

  return (
    <>
      {/* Sun */}
      <directionalLight
        ref={sunRef}
        position={[200, 0, 100]}
        intensity={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={2000}
        shadow-camera-left={-400}
        shadow-camera-right={400}
        shadow-camera-top={400}
        shadow-camera-bottom={-400}
      />

      {/* Ambient */}
      <ambientLight ref={ambRef} color="#B0C4D8" intensity={0.08} />

      {/* Hemisphere */}
      <hemisphereLight ref={hemiRef} color="#87CEEB" groundColor="#1A2030" intensity={0.12} />

      {/* Cockpit fill lights (warm, low) */}
      <pointLight
        ref={fillLRef}
        position={[-1.5, 1.5, 0.5]}
        color="#FFE4C4"
        intensity={0.04}
        distance={8}
      />
      <pointLight
        ref={fillRRef}
        position={[1.5, 1.5, 0.5]}
        color="#FFE4C4"
        intensity={0.04}
        distance={8}
      />

      {/* Instrument glow (blue-tinted) */}
      <pointLight ref={igRef} position={[0, 0.8, 0.6]} color="#4488FF" intensity={0} distance={4} />

      {/* Landing lights (aircraft nose) */}
      <spotLight
        ref={landingLRef}
        position={[-1.5, -0.5, 6]}
        target-position={[0, -5, 100]}
        angle={0.2}
        penumbra={0.3}
        intensity={0}
        color="#FFFFFF"
        distance={800}
      />
      <spotLight
        ref={landingRRef}
        position={[1.5, -0.5, 6]}
        target-position={[0, -5, 100]}
        angle={0.2}
        penumbra={0.3}
        intensity={0}
        color="#FFFFFF"
        distance={800}
      />

      {/* Strobe */}
      <pointLight
        ref={strobeRef}
        position={[0, 2, 0]}
        color="#FFFFFF"
        intensity={0}
        distance={60}
      />

      {/* Nav lights (always on from startup) */}
      <pointLight position={[7.5, 0, 0]} color="#FF4444" intensity={0.8} distance={15} />
      <pointLight position={[-7.5, 0, 0]} color="#44FF44" intensity={0.8} distance={15} />
      <pointLight position={[0, 0, -5.5]} color="#FFFFFF" intensity={0.5} distance={12} />
    </>
  )
}
