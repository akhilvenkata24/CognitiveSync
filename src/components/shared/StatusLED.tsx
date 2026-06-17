interface StatusLEDProps {
  status: 'nominal' | 'caution' | 'warning' | 'emergency' | 'off'
  label?: string
}

export function StatusLED({ status, label }: StatusLEDProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span className={`status-led ${status}`} />
      {label && <span className="data-label">{label}</span>}
    </div>
  )
}
