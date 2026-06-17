import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title?: string
  className?: string
  threatLevel?: 'nominal' | 'caution' | 'warning' | 'emergency'
  style?: React.CSSProperties
}

const THREAT_STYLES = {
  nominal: { borderColor: 'var(--dt-cyan-edge)', glowColor: 'rgba(0,245,255,0.06)' },
  caution: { borderColor: 'rgba(255,229,0,0.30)', glowColor: 'rgba(255,229,0,0.04)' },
  warning: { borderColor: 'rgba(255,107,0,0.30)', glowColor: 'rgba(255,107,0,0.06)' },
  emergency: { borderColor: 'rgba(255,26,60,0.45)', glowColor: 'rgba(255,26,60,0.08)' },
}

export function TacticalCard({
  children,
  title,
  className = '',
  threatLevel = 'nominal',
  style,
}: Props) {
  const ts = THREAT_STYLES[threatLevel]

  return (
    <div
      className={`tactical-card ${className}`}
      style={{
        borderColor: ts.borderColor,
        boxShadow: `0 0 20px ${ts.glowColor}, inset 0 1px 0 rgba(255,255,255,0.03)`,
        padding: '12px',
        ...style,
      }}
    >
      {/* Top shine */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${ts.borderColor}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Corner notches */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10px',
          height: '10px',
          borderTop: `1.5px solid ${ts.borderColor}`,
          borderLeft: `1.5px solid ${ts.borderColor}`,
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '10px',
          height: '10px',
          borderTop: `1.5px solid ${ts.borderColor}`,
          borderRight: `1.5px solid ${ts.borderColor}`,
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '10px',
          height: '10px',
          borderBottom: `1.5px solid ${ts.borderColor}`,
          borderLeft: `1.5px solid ${ts.borderColor}`,
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '10px',
          height: '10px',
          borderBottom: `1.5px solid ${ts.borderColor}`,
          borderRight: `1.5px solid ${ts.borderColor}`,
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {title && (
        <div className="section-header" style={{ marginBottom: '10px' }}>
          {title}
        </div>
      )}

      {children}
    </div>
  )
}
