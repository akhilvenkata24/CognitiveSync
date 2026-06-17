import { useFlightStore } from '../../store/useFlightStore'
import {
  FLIGHT_PHASE_ORDER,
  FLIGHT_PHASE_LABELS,
  FLIGHT_PHASE_ICONS,
  FlightPhase,
} from '../../types/flightPhase'
import { HexBadge } from '../shared/HexBadge'
import { motion, AnimatePresence } from 'framer-motion'

const PHASE_DESCRIPTIONS: Record<FlightPhase, string> = {
  [FlightPhase.PREFLIGHT]: 'Systems check · crew briefing · FMS load',
  [FlightPhase.STARTUP]: 'Engine start · APU · hydraulics',
  [FlightPhase.TAXI]: 'Ground movement · runway alignment',
  [FlightPhase.TAKEOFF]: 'V1 · VR · V2 · rotation · gear retract',
  [FlightPhase.CLIMB]: 'Climb to FL350 · VNAV · thrust reduction',
  [FlightPhase.CRUISE]: 'Steady-state · autopilot · fuel optimization',
  [FlightPhase.DESCENT]: 'TOD · approach profile · ILS capture',
  [FlightPhase.LANDING]: 'Flare · touchdown · reverse thrust · decel',
}

const PHASE_DURATIONS: Record<FlightPhase, string> = {
  [FlightPhase.PREFLIGHT]: '~12 min',
  [FlightPhase.STARTUP]: '~8 min',
  [FlightPhase.TAXI]: '~15 min',
  [FlightPhase.TAKEOFF]: '~3 min',
  [FlightPhase.CLIMB]: '~22 min',
  [FlightPhase.CRUISE]: '~95 min',
  [FlightPhase.DESCENT]: '~18 min',
  [FlightPhase.LANDING]: '~5 min',
}

export function MissionTimeline() {
  const { currentPhase, phaseProgress, advancePhase, isMissionComplete } = useFlightStore()
  const currentIndex = FLIGHT_PHASE_ORDER.indexOf(currentPhase)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <div className="section-header" style={{ marginBottom: 0 }}>
          MISSION TIMELINE
        </div>
        {!isMissionComplete && (
          <button
            id="next-phase-btn"
            className="aero-btn"
            onClick={advancePhase}
            style={{ fontSize: '9px', padding: '4px 10px', letterSpacing: '0.14em' }}
          >
            NEXT →
          </button>
        )}
      </div>

      {/* Vertical rail timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical connector rail */}
        <div
          style={{
            position: 'absolute',
            left: '16px',
            top: '16px',
            bottom: '16px',
            width: '1px',
            background:
              'linear-gradient(180deg, var(--dt-border-2), var(--dt-cyan-edge), var(--dt-border-2))',
            zIndex: 0,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {FLIGHT_PHASE_ORDER.map((phase, index) => {
            const isActive = phase === currentPhase
            const isCompleted = index < currentIndex
            const isFuture = index > currentIndex

            return (
              <motion.div
                key={phase}
                animate={{ opacity: isFuture ? 0.35 : 1, scale: isActive ? 1.01 : 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 8px 8px 4px',
                  borderRadius: '6px',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(0,245,255,0.07), rgba(0,245,255,0.03))'
                    : isCompleted
                      ? 'rgba(0,255,136,0.03)'
                      : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? 'rgba(0,245,255,0.25)'
                      : isCompleted
                        ? 'rgba(0,255,136,0.12)'
                        : 'transparent'
                  }`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Hex badge */}
                <HexBadge
                  size={34}
                  color="var(--dt-cyan)"
                  icon={FLIGHT_PHASE_ICONS[phase]}
                  active={isActive}
                  completed={isCompleted}
                  pulsing={isActive}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-hud"
                      style={{
                        fontSize: '10px',
                        letterSpacing: '0.12em',
                        color: isActive
                          ? 'var(--dt-cyan)'
                          : isCompleted
                            ? 'var(--dt-green)'
                            : 'var(--dt-text-dim)',
                        textShadow: isActive ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
                      }}
                    >
                      {FLIGHT_PHASE_LABELS[phase].toUpperCase()}
                    </span>
                    <span
                      className="font-data text-muted"
                      style={{ fontSize: '8px', letterSpacing: '0.08em' }}
                    >
                      {isActive ? `${(phaseProgress * 100).toFixed(0)}%` : PHASE_DURATIONS[phase]}
                    </span>
                  </div>

                  {/* Progress bar — active phase only */}
                  {isActive && (
                    <div
                      style={{
                        height: '2px',
                        background: 'var(--dt-border)',
                        borderRadius: '1px',
                        margin: '4px 0',
                      }}
                    >
                      <motion.div
                        animate={{ width: `${phaseProgress * 100}%` }}
                        transition={{ duration: 0.35 }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--dt-cyan), rgba(0,245,255,0.5))',
                          borderRadius: '1px',
                          boxShadow: '0 0 6px var(--dt-cyan)',
                        }}
                      />
                    </div>
                  )}

                  <div
                    className="font-mono text-muted"
                    style={{
                      fontSize: '8px',
                      marginTop: '1px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {PHASE_DESCRIPTIONS[phase]}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mission complete */}
      {isMissionComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '8px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.04))',
            border: '1px solid rgba(0,255,136,0.35)',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <div
            className="font-hud text-success glow-success"
            style={{ fontSize: '12px', letterSpacing: '0.25em' }}
          >
            ✓ MISSION COMPLETE
          </div>
          <div
            className="font-mono text-muted"
            style={{ fontSize: '9px', marginTop: '4px', letterSpacing: '0.1em' }}
          >
            DEL → BOM · FLIGHT CONCLUDED
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function PhaseTransitionOverlay() {
  const { isTransitioning, currentPhase } = useFlightStore()

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(1,8,16,0.90)',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        >
          {/* Corner scan lines */}
          {['tl', 'tr', 'bl', 'br'].map(c => (
            <div key={c} className={`vp-corner ${c}`} style={{ opacity: 0.5 }} />
          ))}

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{ textAlign: 'center' }}
          >
            {/* Hex badge large */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <HexBadge
                size={72}
                color="var(--dt-cyan)"
                icon={FLIGHT_PHASE_ICONS[currentPhase]}
                active
                pulsing
              />
            </div>

            <div
              className="font-hud text-primary glow-primary"
              style={{ fontSize: '36px', letterSpacing: '0.45em' }}
            >
              {FLIGHT_PHASE_LABELS[currentPhase].toUpperCase()}
            </div>

            <div
              className="font-data text-muted"
              style={{
                fontSize: '12px',
                marginTop: '8px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              {PHASE_DESCRIPTIONS[currentPhase]}
            </div>

            {/* Animated line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                height: '1px',
                width: '200px',
                margin: '16px auto 0',
                background: 'linear-gradient(90deg, transparent, var(--dt-cyan), transparent)',
                boxShadow: '0 0 10px var(--dt-cyan)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
