import { useUIStore } from '../../store/useUIStore'
import { PilotStatusPanel } from '../dashboard/pilot/PilotStatusPanel'
import { ThreatMatrix } from '../shared/ThreatMatrix'
import { motion } from 'framer-motion'

export function RightPanel() {
  const { rightPanelTab, setRightTab, rightCollapsed, setRightCollapsed } = useUIStore()

  return (
    <div
      className="h-full flex relative select-none shrink-0 border-l border-slate-800 transition-all duration-300"
      style={{
        width: rightCollapsed ? '16px' : '320px',
        background: 'linear-gradient(180deg, rgba(5,15,30,0.98) 0%, rgba(1,8,16,0.99) 100%)',
      }}
    >
      {/* ── Collapsible Action Handle ── */}
      <button
        onClick={() => setRightCollapsed(!rightCollapsed)}
        className="absolute top-0 left-0 bottom-0 w-[16px] bg-slate-950/80 hover:bg-slate-900 border-r border-slate-800 flex items-center justify-center cursor-pointer transition-colors group z-20"
      >
        <span className="text-[9px] font-hud text-slate-500 group-hover:text-cyan-400 font-bold transition-all duration-200">
          {rightCollapsed ? '◀' : '▶'}
        </span>
      </button>

      {/* Edge Accent Breathing Line */}
      {!rightCollapsed && (
        <div
          className="absolute top-[10%] bottom-[10%] left-0 w-[1px] pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, var(--dt-cyan-edge) 30%, var(--dt-cyan-edge) 70%, transparent 100%)',
            animation: 'edge-breathe 3s ease-in-out infinite',
          }}
        />
      )}

      {/* ── Content Container ── */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
          rightCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100 pl-[16px]'
        }`}
      >
        {/* Tab Switcher */}
        <div className="flex bg-slate-950/90 border-b border-slate-800 select-none shrink-0">
          <button
            onClick={() => setRightTab('pilot')}
            className={`flex-1 font-data text-[10px] py-2.5 px-3 cursor-pointer text-center tracking-widest transition-all duration-150 ${
              rightPanelTab === 'pilot'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold bg-slate-900/40'
                : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
            }`}
          >
            PILOT TWIN
          </button>
          <button
            onClick={() => setRightTab('alerts')}
            className={`flex-1 font-data text-[10px] py-2.5 px-3 cursor-pointer text-center tracking-widest transition-all duration-150 ${
              rightPanelTab === 'alerts'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold bg-slate-900/40'
                : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
            }`}
          >
            THREAT MATRIX
          </button>
        </div>

        {/* Panel Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 overflow-x-hidden scrollbar-thin">
          <motion.div
            key={rightPanelTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            {rightPanelTab === 'pilot' ? <PilotStatusPanel /> : <ThreatMatrix />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
