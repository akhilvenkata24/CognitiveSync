import { useCameraStore } from '../../store/useCameraStore'
import type { CameraId } from '../../types/camera'
import { CAMERA_PRESETS } from '../../types/camera'
import { motion } from 'framer-motion'

const CAMERAS: CameraId[] = ['pilot', 'observer_left', 'observer_right', 'command']

const CAM_LABELS: Record<CameraId, string> = {
  pilot: 'COCKPIT',
  observer_left: 'OBS-L',
  observer_right: 'OBS-R',
  command: 'CMD',
}

export function CameraSelector() {
  const { activeCamera, switchCamera, isTransitioning } = useCameraStore()

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        display: 'flex',
        gap: '5px',
        zIndex: 30,
      }}
    >
      {/* Label */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginRight: '4px',
        }}
      >
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '7px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: 'var(--dt-text-dim)',
            textTransform: 'uppercase',
            writingMode: 'vertical-lr',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
          }}
        >
          SENSOR POD
        </div>
      </div>

      {CAMERAS.map(camId => {
        const preset = CAMERA_PRESETS[camId]
        const isActive = activeCamera === camId

        return (
          <motion.button
            key={camId}
            id={`camera-btn-${camId}`}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => switchCamera(camId)}
            disabled={isTransitioning}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '7px 9px',
              background: isActive
                ? 'linear-gradient(135deg, rgba(0,245,255,0.16), rgba(0,245,255,0.08))'
                : 'rgba(1,8,16,0.88)',
              border: `1px solid ${isActive ? 'rgba(0,245,255,0.50)' : 'var(--dt-border-2)'}`,
              borderRadius: '5px',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: isActive
                ? '0 0 16px rgba(0,245,255,0.22), inset 0 1px 0 rgba(0,245,255,0.15)'
                : '0 2px 8px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top shine on active */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '1px',
                  background:
                    'linear-gradient(90deg, transparent, rgba(0,245,255,0.6), transparent)',
                }}
              />
            )}
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{preset.icon}</span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '7px',
                letterSpacing: '0.08em',
                color: isActive ? 'var(--dt-cyan)' : 'var(--dt-text-dim)',
                whiteSpace: 'nowrap',
                textShadow: isActive ? '0 0 8px rgba(0,245,255,0.7)' : 'none',
              }}
            >
              {CAM_LABELS[camId]}
            </span>
            {isActive && (
              <div
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: 'var(--dt-green)',
                  boxShadow: '0 0 4px var(--dt-green)',
                  animation: 'led-pulse-green 2s ease-in-out infinite',
                }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
