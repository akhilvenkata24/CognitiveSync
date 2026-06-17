import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useFlightStore } from '../store/useFlightStore'
import { useCameraStore } from '../store/useCameraStore'
import { FlightPhase } from '../types/flightPhase'

// DOF focus distance per phase + camera
const DOF_FOCUS: Record<string, number> = {
  pilot_PREFLIGHT: 2.5,
  pilot_STARTUP: 2.5,
  pilot_TAXI: 8.0,
  pilot_TAKEOFF: 20.0,
  pilot_CLIMB: 9999,
  pilot_CRUISE: 9999,
  pilot_DESCENT: 9999,
  pilot_LANDING: 30.0,
  command_default: 9999,
  observer_default: 9999,
}

// Bloom intensity per phase
const BLOOM: Record<FlightPhase, number> = {
  [FlightPhase.PREFLIGHT]: 0.3,
  [FlightPhase.STARTUP]: 0.5,
  [FlightPhase.TAXI]: 0.4,
  [FlightPhase.TAKEOFF]: 0.7,
  [FlightPhase.CLIMB]: 0.5,
  [FlightPhase.CRUISE]: 0.8,
  [FlightPhase.DESCENT]: 0.5,
  [FlightPhase.LANDING]: 0.6,
}

export function PostProcessingPipeline() {
  const { currentPhase } = useFlightStore()
  const { activeCamera } = useCameraStore()

  const focusKey =
    activeCamera === 'pilot'
      ? `pilot_${currentPhase}`
      : activeCamera === 'command'
        ? 'command_default'
        : 'observer_default'

  const focalLength = DOF_FOCUS[focusKey] ?? 9999
  const bloomIntensity = BLOOM[currentPhase]

  // Only apply DOF on pilot camera
  const useDOF = activeCamera === 'pilot' && focalLength < 500

  return (
    <EffectComposer>
      {
        [
          <Bloom
            key="bloom"
            intensity={bloomIntensity}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.6}
            blendFunction={BlendFunction.ADD}
          />,
          useDOF ? (
            <DepthOfField
              key="dof"
              focusDistance={focalLength / 10000}
              focalLength={0.06}
              bokehScale={3}
              blendFunction={BlendFunction.NORMAL}
            />
          ) : null,
          <Noise key="noise" opacity={0.025} blendFunction={BlendFunction.OVERLAY} />,
          <Vignette
            key="vignette"
            offset={0.25}
            darkness={0.55}
            blendFunction={BlendFunction.NORMAL}
          />,
          <ChromaticAberration
            key="chromatic"
            offset={new Vector2(0.0008, 0.0008)}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={true}
            modulationOffset={0.15}
          />,
        ].filter(Boolean) as any
      }
    </EffectComposer>
  )
}
