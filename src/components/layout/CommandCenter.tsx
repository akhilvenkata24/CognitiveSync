import { useUIStore } from '../../store/useUIStore'
import { AircraftStatusPanel } from '../dashboard/aircraft/AircraftStatusPanel'
import { PilotStatusPanel } from '../dashboard/pilot/PilotStatusPanel'
import { MissionTimeline } from '../mission/MissionTimeline'
import { SceneCanvas } from '../viewport/SceneCanvas'
import { TopBar } from './TopBar'
import { StatusStrip } from './StatusStrip'
import { PhaseTransitionOverlay } from '../mission/MissionTimeline'
import { useSimulationLoop } from '../../hooks/useSimulationLoop'
import { RadarMini } from '../shared/RadarMini'
import { ThreatMatrix } from '../shared/ThreatMatrix'
import { motion } from 'framer-motion'

function PanelTab({
  label,
  active,
  onClick,
  id,
}: {
  label: string
  active: boolean
  onClick: () => void
  id: string
}) {
  return (
    <button
      id={id}
      className={`aero-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{ background: 'none', border: 'none' }}
    >
      {label}
    </button>
  )
}

/** Animated panel border edge line */
function EdgeAccent({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10%',
        bottom: '10%',
        [side]: 0,
        width: '1px',
        background:
          'linear-gradient(180deg, transparent 0%, var(--dt-cyan-edge) 30%, var(--dt-cyan-edge) 70%, transparent 100%)',
        animation: 'edge-breathe 3s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}

export function CommandCenter() {
  useSimulationLoop()
  const { leftPanelTab, rightPanelTab, setLeftTab, setRightTab } = useUIStore()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateAreas: `
        "topbar topbar topbar"
        "left   center right"
        "strip  strip  strip"
      `,
        gridTemplateRows: '64px 1fr 32px',
        gridTemplateColumns: '300px 1fr 300px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--dt-void)',
      }}
    >
      {/* ── TOP BAR ── */}
      <TopBar />

      {/* ── LEFT PANEL ── */}
      <div
        style={{
          gridArea: 'left',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--dt-border)',
          background: 'linear-gradient(180deg, rgba(5,15,30,0.98) 0%, rgba(1,8,16,0.99) 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <EdgeAccent side="right" />

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--dt-border)',
            background: 'rgba(10,24,48,0.9)',
            flexShrink: 0,
          }}
        >
          <PanelTab
            id="tab-aircraft"
            label="AIRCRAFT"
            active={leftPanelTab === 'aircraft'}
            onClick={() => setLeftTab('aircraft')}
          />
          <PanelTab
            id="tab-timeline"
            label="MISSION"
            active={leftPanelTab === 'timeline'}
            onClick={() => setLeftTab('timeline')}
          />
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', overflowX: 'hidden' }}>
          <motion.div
            key={leftPanelTab}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {leftPanelTab === 'aircraft' ? <AircraftStatusPanel /> : <MissionTimeline />}
          </motion.div>
        </div>

        {/* Mini radar at bottom */}
        <div
          style={{
            borderTop: '1px solid var(--dt-border)',
            padding: '10px',
            display: 'flex',
            justifyContent: 'center',
            background: 'rgba(1,8,16,0.98)',
            flexShrink: 0,
          }}
        >
          <RadarMini />
        </div>
      </div>

      {/* ── CENTER VIEWPORT ── */}
      <div
        style={{
          gridArea: 'center',
          position: 'relative',
          background: 'var(--dt-void)',
          overflow: 'hidden',
        }}
      >
        {/* Grid crosshatch background */}
        <div
          className="grid-crosshatch"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <SceneCanvas />

        {/* Corner decorations */}
        <div className="vp-corner tl" />
        <div className="vp-corner tr" />
        <div className="vp-corner bl" />
        <div className="vp-corner br" />

        {/* Side edge lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '1px',
            background:
              'linear-gradient(180deg, transparent, var(--dt-cyan-edge) 20%, var(--dt-cyan-edge) 80%, transparent)',
            pointerEvents: 'none',
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '1px',
            background:
              'linear-gradient(180deg, transparent, var(--dt-cyan-edge) 20%, var(--dt-cyan-edge) 80%, transparent)',
            pointerEvents: 'none',
            opacity: 0.4,
          }}
        />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          gridArea: 'right',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--dt-border)',
          background: 'linear-gradient(180deg, rgba(5,15,30,0.98) 0%, rgba(1,8,16,0.99) 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <EdgeAccent side="left" />

        {/* Threat matrix header */}
        <div style={{ padding: '10px 10px 0', flexShrink: 0 }}>
          <ThreatMatrix />
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--dt-border)',
            background: 'rgba(10,24,48,0.9)',
            flexShrink: 0,
          }}
        >
          <PanelTab
            id="tab-pilot"
            label="PILOT"
            active={rightPanelTab === 'pilot'}
            onClick={() => setRightTab('pilot')}
          />
          <PanelTab
            id="tab-alerts"
            label="ALERTS"
            active={rightPanelTab === 'alerts'}
            onClick={() => setRightTab('alerts')}
          />
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', overflowX: 'hidden' }}>
          <motion.div
            key={rightPanelTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <PilotStatusPanel />
          </motion.div>
        </div>
      </div>

      {/* ── BOTTOM STATUS STRIP ── */}
      <StatusStrip />

      {/* Phase transition overlay */}
      <PhaseTransitionOverlay />
    </div>
  )
}
