import { useUIStore } from '../../store/useUIStore'
import { SceneCanvas } from '../viewport/SceneCanvas'
import { MissionControlDashboard } from '../dashboard/MissionControlDashboard'
import { motion, AnimatePresence } from 'framer-motion'

export function MainViewport() {
  const { activeView } = useUIStore()

  return (
    <div className="flex-1 h-full relative overflow-hidden select-none bg-slate-950">
      {/* Grid crosshatch background */}
      <div className="grid-crosshatch absolute inset-0 pointer-events-none z-0" />

      {/* Decorative side lines */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[1px] pointer-events-none z-10 opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent, var(--dt-cyan-edge) 20%, var(--dt-cyan-edge) 80%, transparent)',
        }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-[1px] pointer-events-none z-10 opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent, var(--dt-cyan-edge) 20%, var(--dt-cyan-edge) 80%, transparent)',
        }}
      />

      {/* Active Screen Viewport */}
      <div className="w-full h-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.005 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {activeView === 'cockpit' ? <SceneCanvas /> : <MissionControlDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Corner decorations */}
      <div className="vp-corner tl z-20 pointer-events-none" />
      <div className="vp-corner tr z-20 pointer-events-none" />
      <div className="vp-corner bl z-20 pointer-events-none" />
      <div className="vp-corner br z-20 pointer-events-none" />
    </div>
  )
}
