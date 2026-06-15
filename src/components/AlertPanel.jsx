import React from 'react';
import { AlertOctagon, AlertTriangle, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AlertPanel({ alerts, operatorState, onAcknowledgeAlert, industry, attentionLevel = 0 }) {
  // Find active alerts
  const criticalAlerts = alerts.filter(a => a.status === 'active');
  
  // Sort by priority: critical > high > low
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

  // Specific industry action subtexts
  const getIndustryWarningInstruction = () => {
    if (topAlert) return topAlert.instruction || topAlert.message;

    switch (industry) {
      case 'aerospace':
        return {
          title: "GPWS TERRAIN WARNING",
          subtext: "Pull up immediately. Active radar indicates low obstacle clearance.",
          action: "PULL UP & HOLD"
        };
      case 'railways':
        return {
          title: "TRAIN CONTROL RESTRICTIVE ASPECT",
          subtext: "Cab signal shows absolute stop. Speed exceeds emergency braking limits.",
          action: "APPLY EMERGENCY BRAKES"
        };
      case 'mining':
        return {
          title: "COLLISION PROXIMITY ALERT",
          subtext: "Proximity sensor tracks personnel inside vehicle blindspot radius.",
          action: "HALT VEHICLE CORE"
        };
      case 'machinery':
      default:
        return {
          title: "HYDRAULIC PRESSURE OVERLOAD",
          subtext: "Internal lines exceed 94% threshold. Automated bypass failing.",
          action: "ACTIVATE EMERGENCY BYPASS"
        };
    }
  };

  const currentWarning = getIndustryWarningInstruction();
  const warningTitle = topAlert ? topAlert.message : currentWarning.title;
  const warningText = topAlert ? topAlert.description : currentWarning.subtext;
  const warningAction = topAlert ? topAlert.action : currentWarning.action;

  return (
    <>
      {/* 1. Main Warning Deck Widget */}
      <div className="panel-card" style={{ flex: '1 1 300px', minHeight: '220px' }}>
        <div className="panel-title">
          <ShieldAlert size={14} /> Active Threat Matrix ({criticalAlerts.length})
        </div>

        <div className="alert-list">
          {criticalAlerts.length === 0 ? (
            <div className="empty-panel-msg" style={{ height: '120px' }}>
              <CheckCircle2 size={30} style={{ color: 'var(--color-focused)', marginBottom: '0.4rem' }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)' }}>ALL SYSTEMS OPTIMAL // ZERO FAULTS</span>
            </div>
          ) : (
            sortedAlerts.map(alert => {
              const isLevel1Highlight = attentionLevel >= 1 && alert.priority === 'critical';
              return (
                <div 
                  key={alert.id} 
                  className={`alert-item priority-${alert.priority} ${isLevel1Highlight ? 'level1-highlight-alert' : ''}`}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: '4px solid currentColor'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {alert.priority === 'critical' ? (
                      <AlertOctagon size={16} className="text-red" style={{ animation: 'blink 0.8s infinite' }} />
                    ) : (
                      <AlertTriangle size={16} className={alert.priority === 'high' ? 'text-orange' : 'text-cyan'} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'var(--font-hud)' }}>{alert.message}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{alert.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="ack-button"
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.6rem',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                      clipPath: 'none',
                      boxShadow: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ACK
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. LEVEL 3 ADAPTIVE OVERLAY (Attention drops < 45) */}
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

      {/* 3. LEVEL 4 EMERGENCY OVERLAY (Attention drops < 30 / Absense) */}
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
