import { useTelemetryStore } from '../../store/useTelemetryStore'
import { AnimatedNumber } from './AnimatedNumber'

export function ThreatMatrix() {
  const t = useTelemetryStore(s => s.data)
  const risk = t.riskScore ?? 0

  const threatLevel =
    risk > 75 ? 'CRITICAL' : risk > 50 ? 'ELEVATED' : risk > 25 ? 'GUARDED' : 'NOMINAL'

  const threatColor =
    risk > 75
      ? 'var(--dt-red)'
      : risk > 50
        ? 'var(--dt-orange)'
        : risk > 25
          ? 'var(--dt-yellow)'
          : 'var(--dt-green)'

  const integrity = Math.max(0, 100 - risk * 0.6)

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(1,8,16,0.98), rgba(5,15,30,0.96))',
        border: `1px solid ${threatColor}33`,
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '8px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top edge glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${threatColor}88, transparent)`,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--dt-text-dim)',
          }}
        >
          THREAT MATRIX
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '10px',
            color: threatColor,
            textShadow: `0 0 8px ${threatColor}`,
            letterSpacing: '0.12em',
          }}
        >
          {threatLevel}
        </div>
      </div>

      {/* Threat bar */}
      <div style={{ marginBottom: '6px' }}>
        <div className="threat-bar-track" style={{ height: '5px', marginBottom: '3px' }}>
          <div
            className="threat-bar-fill"
            style={{
              width: `${risk}%`,
              background: `linear-gradient(90deg, var(--dt-green), ${threatColor})`,
              boxShadow: `0 0 8px ${threatColor}88`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'var(--dt-text-dim)',
            }}
          >
            RISK
          </span>
          <span
            style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '10px', color: threatColor }}
          >
            <AnimatedNumber value={risk} decimals={0} suffix="%" />
          </span>
        </div>
      </div>

      {/* System integrity */}
      <div>
        <div className="threat-bar-track" style={{ height: '3px', marginBottom: '3px' }}>
          <div
            className="threat-bar-fill"
            style={{
              width: `${integrity}%`,
              background: 'linear-gradient(90deg, var(--dt-green), rgba(0,255,136,0.6))',
              boxShadow: '0 0 6px var(--dt-green)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'var(--dt-text-dim)',
            }}
          >
            INTEGRITY
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'var(--dt-green)',
            }}
          >
            <AnimatedNumber value={integrity} decimals={0} suffix="%" />
          </span>
        </div>
      </div>
    </div>
  )
}
