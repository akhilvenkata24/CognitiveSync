import { useSimulationLoop } from '../../hooks/useSimulationLoop'
import { Header } from './Header'
import { LeftPanel } from './LeftPanel'
import { MainViewport } from './MainViewport'
import { RightPanel } from './RightPanel'
import { BottomTimeline } from './BottomTimeline'
import { PhaseTransitionOverlay } from '../mission/MissionTimeline'

export function AeroShell() {
  // Execute simulation tick loop in the background
  useSimulationLoop()

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 text-slate-300 font-sans">
      {/* ── HEADER ── */}
      <Header />

      {/* ── CORE VIEWPORT AREA (Panels + Main) ── */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Drawer Panel */}
        <LeftPanel />

        {/* Central Viewport */}
        <MainViewport />

        {/* Right Drawer Panel */}
        <RightPanel />
      </div>

      {/* ── BOTTOM DECK TIMELINE ── */}
      <BottomTimeline />

      {/* Full-screen Flight Phase Transition Overlay */}
      <PhaseTransitionOverlay />
    </div>
  )
}
