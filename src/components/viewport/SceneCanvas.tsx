import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { HUDOverlay } from '../hud/HUDOverlay'
import { CameraSelector } from '../camera/CameraSelector'
import { WorldScene } from '../../scene/WorldScene'

export function SceneCanvas() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ fov: 48, near: 0.05, far: 80000, position: [0, 25, 55] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        style={{ background: '#030B18' }}
      >
        <WorldScene />
      </Canvas>

      {/* HUD overlay */}
      <HUDOverlay />

      {/* Camera selector */}
      <CameraSelector />
    </div>
  )
}
