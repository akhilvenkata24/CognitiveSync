import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert, Plane, Eye } from 'lucide-react';

const tcasStyles = `
@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
`;

export default function AlertPanel({ 
  alerts, 
  operatorState, 
  onAcknowledgeAlert, 
  industry, 
  attentionLevel = 0,
  gazeX = 0,
  gazeY = 0,
  visorGazeLock = false,
  setVisorGazeLock
}) {
  // Find active alerts
  const criticalAlerts = alerts.filter(a => a.status === 'active');
  
  // Sort by priority: critical (3) > high (2) > low (1)
  const sortedAlerts = [...criticalAlerts].sort((a, b) => {
    const priorityWeight = { critical: 3, high: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const topAlert = sortedAlerts[0];

  // Progressive Adaptation Levels:
  // Level 3: Blur background and overlay warnings
  // Level 4: Fullscreen emergency warning takeover
  const showAdaptiveOverlay = attentionLevel === 3;
  const showEmergencyOverlay = attentionLevel === 4;

  const getIndustryWarningInstruction = () => {
    if (topAlert) return topAlert.action || topAlert.message;
    return "PULL UP & HOLD";
  };

  const currentWarning = getIndustryWarningInstruction();
  const warningTitle = topAlert ? topAlert.message : "GPWS TERRAIN WARNING";
  const warningText = topAlert ? topAlert.description : "Pull up immediately. Active radar indicates low obstacle clearance.";
  const warningAction = topAlert ? topAlert.action : "PULL UP & HOLD";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tcasStyles }} />

      {/* Dynamic Alerts Stack */}
      {sortedAlerts.length === 0 ? (
        <div className="panel-card" style={{ flex: '0 0 auto' }}>
          <div className="panel-title" style={{ color: 'var(--color-focused)', borderBottomColor: 'rgba(0, 230, 118, 0.15)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--color-focused)' }} /> System Status Deck
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.25rem 0' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--color-focused)', filter: 'drop-shadow(var(--glow-focused))' }} />
            <div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                ALL AVIONICS SYSTEMS OPTIMAL
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                COGNITIVE PILOT FEED ACTIVE // ZERO FAULTS DETECTED
              </span>
            </div>
          </div>
        </div>
      ) : visorGazeLock ? (
        <div className="panel-card" style={{ flex: '0 0 auto', border: '1px dashed var(--hud-accent)', background: 'rgba(0, 240, 255, 0.02)', padding: '1rem' }}>
          <div className="panel-title" style={{ color: 'var(--hud-accent)', textShadow: 'var(--hud-accent-glow)', borderBottomColor: 'rgba(0, 240, 255, 0.15)' }}>
            <Eye size={14} /> Helmet Visor HUD Active
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.2rem 0' }}>
            <div style={{ position: 'relative', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--hud-accent)', animation: 'ping 1.5s infinite' }} />
              <Eye size={12} style={{ color: 'var(--hud-accent)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                PROJECTED TO VISOR HMD
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                Warnings following pilot look vector {gazeX > 0 ? `+${gazeX}°` : `${gazeX}°`} / {gazeY > 0 ? `+${gazeY}°` : `${gazeY}°`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setVisorGazeLock(false)}
            style={{
              marginTop: '0.5rem',
              padding: '0.3rem 0.6rem',
              fontSize: '0.65rem',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--hud-accent)',
              border: '1px solid var(--hud-accent)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-hud)',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              alignSelf: 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hud-accent)';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = 'var(--hud-accent)';
            }}
          >
            DISENGAGE VISOR HUD
          </button>
        </div>
      ) : (
        sortedAlerts.map(alert => {
          const isCritical = alert.priority === 'critical';
          const isHigh = alert.priority === 'high';
          const themeColor = isCritical 
            ? 'var(--color-distracted)' 
            : (isHigh ? 'var(--color-normal)' : 'var(--hud-accent)');
          const glowGlow = isCritical 
            ? 'var(--glow-distracted)' 
            : (isHigh ? 'var(--glow-normal)' : 'var(--hud-accent-glow)');

          return (
            <div 
              key={alert.id}
              className={`panel-card priority-${alert.priority}`}
              style={{
                flex: '0 0 auto',
                borderColor: themeColor,
                boxShadow: `0 8px 30px rgba(0, 0, 0, 0.55), ${glowGlow}`,
                borderLeft: `5px solid ${themeColor}`,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.4rem', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-hud)', fontSize: '0.72rem', fontWeight: 'bold', color: themeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {isCritical ? (
                    <AlertOctagon size={13} style={{ animation: 'blink 0.8s infinite' }} />
                  ) : (
                    <AlertTriangle size={13} />
                  )}
                  <span>{alert.priority} FLIGHT WARNING</span>
                </div>
                <button
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.55rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-hud)',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = themeColor;
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  ACK FAULT
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.3rem' }}>
                {alert.message.includes("TCAS") && (
                  <div style={{
                    position: 'relative', width: '70px', height: '70px', borderRadius: '50%',
                    border: '1px solid rgba(0, 240, 255, 0.25)', flexShrink: 0, background: '#02040c',
                    overflow: 'hidden', boxShadow: '0 0 10px rgba(0, 240, 255, 0.1) inset'
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.2) 0deg, transparent 120deg)',
                      animation: 'radar-spin 2.5s linear infinite', borderRadius: '50%'
                    }} />
                    <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', borderRadius: '50%', border: '1px dashed rgba(0, 240, 255, 0.12)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--hud-accent)' }}>
                      <Plane size={12} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <div style={{
                      position: 'absolute', top: '15%', left: '35%', width: '6px', height: '6px',
                      borderRadius: '50%', background: '#ff1744', boxShadow: '0 0 8px #ff1744',
                      animation: 'blink 0.8s infinite'
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '20%', left: '20%', width: '5px', height: '5px',
                      borderRadius: '50%', background: '#ffc107', boxShadow: '0 0 6px #ffc107'
                    }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: '900', fontFamily: 'var(--font-hud)', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>
                    {alert.message}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3' }}>
                    {alert.description}
                  </p>
                  <div style={{ 
                    marginTop: '0.2rem', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '0.3rem 0.5rem', 
                    borderRadius: '4px', 
                    border: `1px dashed ${themeColor}`,
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-hud)',
                    color: themeColor
                  }}>
                    <strong style={{ color: '#fff', marginRight: '0.2rem' }}>DIRECTIVE:</strong> {alert.action || 'MONITOR AVIONICS BUS'}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Floating HMD Visor HUD Overlay */}
      {visorGazeLock && sortedAlerts.length > 0 && (
        <div style={{
          position: 'fixed',
          right: '2.5rem',
          top: '9rem',
          width: '380px',
          zIndex: 9995,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          pointerEvents: 'none'
        }}>
          {sortedAlerts.map((alert, index) => {
            const isCritical = alert.priority === 'critical';
            const isHigh = alert.priority === 'high';
            const themeColor = isCritical 
              ? 'var(--color-distracted)' 
              : (isHigh ? 'var(--color-normal)' : 'var(--hud-accent)');
            const glowGlow = isCritical 
              ? 'var(--glow-distracted)' 
              : (isHigh ? 'var(--glow-normal)' : 'var(--hud-accent-glow)');

            // Map gaze positions (-30 to +30) to smooth offsets
            // Limit offsets so they don't drift completely off-screen
            const maxOffset = 220;
            const targetOffsetX = Math.max(-maxOffset, Math.min(maxOffset, (gazeX || 0) * 12));
            const targetOffsetY = Math.max(-maxOffset, Math.min(maxOffset, -(gazeY || 0) * 10));

            return (
              <div 
                key={alert.id}
                className={`panel-card priority-${alert.priority}`}
                style={{
                  pointerEvents: 'auto',
                  borderColor: themeColor,
                  borderLeft: `5px solid ${themeColor}`,
                  boxShadow: `0 12px 40px rgba(0, 0, 0, 0.7), ${glowGlow}`,
                  transform: `translate3d(${targetOffsetX}px, ${targetOffsetY}px, 0px) rotateY(${(gazeX || 0) * 0.35}deg) rotateX(${-(gazeY || 0) * 0.35}deg)`,
                  transition: 'transform 0.22s cubic-bezier(0.1, 0.8, 0.25, 1)',
                  padding: '1rem',
                  background: 'rgba(5, 8, 20, 0.92)',
                  backdropFilter: 'blur(15px)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.4rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-hud)', fontSize: '0.72rem', fontWeight: 'bold', color: themeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isCritical ? (
                      <AlertOctagon size={13} style={{ animation: 'blink 0.8s infinite' }} />
                    ) : (
                      <AlertTriangle size={13} />
                    )}
                    <span>{alert.priority} VISOR HUD WARNING</span>
                  </div>
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.55rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-hud)',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = themeColor;
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = '#fff';
                    }}
                  >
                    ACK FAULT
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.3rem' }}>
                  {alert.message.includes("TCAS") && (
                    <div style={{
                      position: 'relative', width: '70px', height: '70px', borderRadius: '50%',
                      border: '1px solid rgba(0, 240, 255, 0.25)', flexShrink: 0, background: '#02040c',
                      overflow: 'hidden', boxShadow: '0 0 10px rgba(0, 240, 255, 0.1) inset'
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.2) 0deg, transparent 120deg)',
                        animation: 'radar-spin 2.5s linear infinite', borderRadius: '50%'
                      }} />
                      <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', borderRadius: '50%', border: '1px dashed rgba(0, 240, 255, 0.12)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--hud-accent)' }}>
                        <Plane size={12} style={{ transform: 'rotate(-45deg)' }} />
                      </div>
                      <div style={{
                        position: 'absolute', top: '15%', left: '35%', width: '6px', height: '6px',
                        borderRadius: '50%', background: '#ff1744', boxShadow: '0 0 8px #ff1744',
                        animation: 'blink 0.8s infinite'
                      }} />
                      <div style={{
                        position: 'absolute', bottom: '20%', left: '20%', width: '5px', height: '5px',
                        borderRadius: '50%', background: '#ffc107', boxShadow: '0 0 6px #ffc107'
                      }} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: '900', fontFamily: 'var(--font-hud)', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>
                      {alert.message}
                    </h3>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3' }}>
                      {alert.description}
                    </p>
                    <div style={{ 
                      marginTop: '0.2rem', 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '0.3rem 0.5rem', 
                      borderRadius: '4px', 
                      border: `1px dashed ${themeColor}`,
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-hud)',
                      color: themeColor
                    }}>
                      <strong style={{ color: '#fff', marginRight: '0.2rem' }}>DIRECTIVE:</strong> {alert.action || 'MONITOR AVIONICS BUS'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEVEL 3 ADAPTIVE OVERLAY */}
      <div className={`adaptive-modal-overlay ${showAdaptiveOverlay ? 'active' : ''}`}>
        <div className="adaptive-alert-card" style={{ border: '2px solid var(--color-distracted)', boxShadow: 'var(--glow-distracted)' }}>
          <div className="alert-pulse-icon" style={{ background: 'rgba(255, 23, 68, 0.1)', color: 'var(--color-distracted)' }}>
            <AlertOctagon size={32} className="animate-pulse" />
          </div>
          
          <div>
            <span style={{
              fontFamily: 'var(--font-hud)', fontSize: '0.65rem', color: 'var(--color-distracted)',
              letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold'
            }}>
              WARNING LEVEL 3: TACTICAL INTERVENTION OVERLAY
            </span>
            <h2 className="adaptive-alert-instruction">
              {warningAction}
            </h2>
            <p style={{
              fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-distracted)', margin: '0.4rem 0 0.8rem 0', textTransform: 'uppercase', fontFamily: 'var(--font-hud)'
            }}>
              [{warningTitle}]
            </p>
            <p className="adaptive-alert-subtext">
              {warningText}
            </p>
          </div>

          <button 
            className="ack-button"
            style={{ background: 'var(--color-distracted)' }}
            onClick={() => {
              if (topAlert) {
                onAcknowledgeAlert(topAlert.id);
              } else {
                onAcknowledgeAlert(null);
              }
            }}
          >
            Acknowledge & Sync HUD
          </button>

          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
            COGNITIVE LOAD SHIELD ACTIVE // DE-CLUTTER MODE ENGAGED
          </span>
        </div>
      </div>

      {/* LEVEL 4 EMERGENCY OVERLAY */}
      {showEmergencyOverlay && (
        <div className="level4-emergency-overlay">
          <div className="level4-card">
            <div className="level4-siren-icon" style={{ animation: 'siren-ping 0.8s infinite' }}>
              <AlertOctagon size={44} />
            </div>
            
            <div>
              <span style={{
                fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--color-distracted)',
                letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'
              }}>
                CRITICAL WARNING LEVEL 4: SYSTEM FAIL-SAFE CONTROL
              </span>
              <h2 className="adaptive-alert-instruction" style={{ color: 'var(--color-distracted)', fontSize: '1.7rem', textShadow: '0 0 15px rgba(255,23,68,0.5)' }}>
                COGNITIVE DISRUPT // AWAKE REQUIRED
              </h2>
              <p style={{
                fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-fatigued)', margin: '0.4rem 0 0.8rem 0', textTransform: 'uppercase', fontFamily: 'var(--font-hud)'
              }}>
                [AUTOPILOT COGNITIVE INTERCEPT]
              </p>
              <p className="adaptive-alert-subtext" style={{ fontSize: '0.85rem' }}>
                Complete operator attention loss detected. Safety autopilot fallback active. Perform sensory verification or clear master warning below.
              </p>
            </div>

            <button 
              className="ack-button"
              style={{ background: 'var(--color-distracted)', boxShadow: '0 0 25px rgba(255, 23, 68, 0.6)' }}
              onClick={() => onAcknowledgeAlert(null)}
            >
              RESTORE PILOT CONTROL
            </button>
            
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
              WARNING: SYSTEM WILL ENGAGE SAFE STAGING IN 10 SECONDS
            </span>
          </div>
        </div>
      )}
    </>
  );
}
