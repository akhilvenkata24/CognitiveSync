import { Suspense } from 'react'
import { useFlightStore } from '../store/useFlightStore'
import { FlightPhase } from '../types/flightPhase'
import { SkyDome } from './SkyDome'
import { CloudSystem } from './CloudSystem'
import { Terrain } from './Terrain'
import { LightingRig } from './LightingRig'
import { VFXLayer } from './VFXLayer'
import { AircraftRoot } from './aircraft/AircraftRoot'
import { MissionCameraRig } from './cameras/MissionCameraRig'
import { PostProcessingPipeline } from './PostProcessingPipeline'

// Dynamic fog — color and near/far driven by phase
function SceneFog() {
  const { currentPhase } = useFlightStore()

  const FOG_CONFIG: Record<FlightPhase, { color: string; near: number; far: number }> = {
    [FlightPhase.PREFLIGHT]: { color: '#0A0E2A', near: 40, far: 600 },
    [FlightPhase.STARTUP]: { color: '#0D1228', near: 50, far: 800 },
    [FlightPhase.TAXI]: { color: '#101828', near: 80, far: 1500 },
    [FlightPhase.TAKEOFF]: { color: '#0E1A2A', near: 200, far: 4000 },
    [FlightPhase.CLIMB]: { color: '#061228', near: 2000, far: 20000 },
    [FlightPhase.CRUISE]: { color: '#020810', near: 5000, far: 60000 },
    [FlightPhase.DESCENT]: { color: '#0E1828', near: 1000, far: 15000 },
    [FlightPhase.LANDING]: { color: '#0A1018', near: 60, far: 800 },
  }

  const cfg = FOG_CONFIG[currentPhase]

  return <fog attach="fog" args={[cfg.color, cfg.near, cfg.far]} />
}

export function WorldScene() {
  return (
    <>
      {/* Camera — no OrbitControls, fully mission-driven */}
      <MissionCameraRig />

      {/* Atmospheric fog */}
      <SceneFog />

      {/* Environment layers */}
      <Suspense fallback={null}>
        <SkyDome />
        <CloudSystem />
        <Terrain />
        <LightingRig />
        <AircraftRoot />
        <VFXLayer />
        <PostProcessingPipeline />
      </Suspense>
    </>
  )
}
