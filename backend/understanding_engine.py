import math
from typing import Dict, Any, List

class UnderstandingEngine:
  def __init__(self, decay_rate: float = 0.03):
    self.decay_rate = decay_rate
    
    # In-memory store for session mental models and smoothed attention allocation
    # Format: { session_id: { "pfd": float, "tcas": float, ... } }
    self.mental_models: Dict[str, Dict[str, float]] = {}
    self.attention_allocation: Dict[str, Dict[str, float]] = {}

  def _get_or_create_session_states(self, session_id: str):
    """
    Initializes session understanding vectors if not present in memory.
    """
    if session_id not in self.mental_models:
      self.mental_models[session_id] = {
        "pfd": 0.0,
        "tcas": 0.0,
        "eicas": 0.0,
        "alerts": 0.0,
        "secondary": 0.0
      }
      
    if session_id not in self.attention_allocation:
      self.attention_allocation[session_id] = {
        "pfd": 0.2,
        "tcas": 0.2,
        "eicas": 0.2,
        "alerts": 0.2,
        "secondary": 0.2
      }

  def calculate_gaze_zone(self, detected: bool, gaze_x: float, gaze_y: float) -> str:
    """
    Maps continuous pilot gaze coordinates to discrete cockpit visual fovea zones.
    """
    if not detected:
      return "secondary"

    # Normalize/check boundaries
    # Zone 1: Primary Flight HUD (PFD) - Center
    if 0.30 <= gaze_x <= 0.70 and 0.10 <= gaze_y <= 0.60:
      return "pfd"
      
    # Zone 2: TCAS Radar - Bottom Left
    if 0.00 <= gaze_x <= 0.45 and 0.60 <= gaze_y <= 1.00:
      return "tcas"
      
    # Zone 3: EICAS Engine Telemetry - Bottom Right
    if 0.45 <= gaze_x <= 0.90 and 0.60 <= gaze_y <= 1.00:
      return "eicas"
      
    # Zone 4: Active Warnings List - Top Right
    if 0.60 <= gaze_x <= 1.00 and 0.00 <= gaze_y <= 0.40:
      return "alerts"

    # Zone 5: Secondary controls / Margin
    return "secondary"

  def update(
    self, 
    session_id: str, 
    detected: bool,
    attention_score: float,
    yaw: float, 
    pitch: float, 
    roll: float, 
    ear: float, 
    gaze_x: float, 
    gaze_y: float,
    is_blinking: bool,
    active_alerts: List[Dict[str, Any]]
  ) -> Dict[str, Any]:
    """
    Primary update cycle. Computes frame cognitive metrics:
    1. Attention Allocation vector
    2. Actual Aircraft State deviations
    3. Pilot Mental Model assimilation
    4. Understanding Gap
    5. Situational Awareness (SA) Score
    6. Cognitive Load
    7. Risk Escalation
    """
    self._get_or_create_session_states(session_id)

    # 1. Update Pilot Attention Allocation Vector A(t)
    active_zone = self.calculate_gaze_zone(detected, gaze_x, gaze_y)
    
    # Smooth attention using EMA (alpha = 0.08) to filter gaze jitter
    alpha_attn = 0.08
    sess_attn = self.attention_allocation[session_id]
    
    for zone in sess_attn.keys():
      target = 1.0 if zone == active_zone else 0.0
      sess_attn[zone] = (alpha_attn * target) + ((1.0 - alpha_attn) * sess_attn[zone])

    # Normalize distribution just in case
    total_attn = sum(sess_attn.values())
    if total_attn > 0:
      for zone in sess_attn.keys():
        sess_attn[zone] /= total_attn

    # 2. Determine Actual Aircraft State Deviations Sa(t)
    # Pitch/roll deviations represent manual stick handling deviation
    pfd_dev = min(100.0, (abs(pitch) / 15.0)**2 * 40.0 + (abs(roll) / 20.0)**2 * 40.0)
    
    # TCAS warnings represent spatial threat deviations
    has_tcas_warning = any("tcas" in str(a.get("code", "")).lower() for a in active_alerts)
    tcas_dev = 85.0 if has_tcas_warning else 0.0
    
    # Engine spool values (EICAS)
    eicas_dev = 0.0
    # If standard flight plan drift occurs
    if abs(yaw) > 12:
      eicas_dev = min(60.0, abs(yaw) * 2.0)
      
    # Alerts deviation
    alert_dev = 0.0
    if active_alerts:
      critical_count = sum(1 for a in active_alerts if a.get("priority") == "critical")
      high_count = sum(1 for a in active_alerts if a.get("priority") == "high")
      if critical_count > 0:
        alert_dev = 90.0
      elif high_count > 0:
        alert_dev = 55.0
      else:
        alert_dev = 25.0

    actual_state = {
      "pfd": round(pfd_dev, 1),
      "tcas": round(tcas_dev, 1),
      "eicas": round(eicas_dev, 1),
      "alerts": round(alert_dev, 1),
      "secondary": 0.0
    }

    # 3. Pilot Mental Model Update (Information Assimilation Filter)
    # Pilot assimilates information based on how long they look at the corresponding zone.
    # If they look elsewhere, their mental model decays (they are unaware of real-time state drift).
    sess_model = self.mental_models[session_id]
    for param, actual_val in actual_state.items():
      attn_weight = sess_attn[param]
      
      # Forgetting/Assimilation math
      decay_factor = math.exp(-self.decay_rate)
      # pilot assimilates state based on attention lock
      sess_model[param] = (sess_model[param] * decay_factor) + ((1.0 - decay_factor) * actual_val * (attn_weight * 5.0))
      # Clamp mental model value between 0 and actual deviation (cannot understand more deviation than exists)
      sess_model[param] = max(0.0, min(actual_val, sess_model[param]))

    # 4. Calculate Understanding Gap Gu(t)
    # Weighted discrepancies between actual aircraft state and pilot mental model
    weights = {
      "pfd": 0.35,      # High criticality: flight horizon
      "tcas": 0.35,     # High criticality: collision radar
      "alerts": 0.20,   # Moderate criticality: warning list
      "eicas": 0.10,    # Low criticality: engine telemetry
      "secondary": 0.00
    }

    understanding_gap = 0.0
    for param in weights.keys():
      discrepancy = abs(actual_state[param] - sess_model[param])
      understanding_gap += weights[param] * discrepancy

    # 5. Calculate Situational Awareness Score SA(t)
    # Normalized SA: starts at 100%, drops as understanding gap expands
    situational_awareness = max(0.0, 100.0 - (understanding_gap * 1.5))
    
    # 6. Calculate Cognitive Load Score Lc(t)
    # Derived from biometric focus variables
    base_load = 22.0
    # Rapid gaze transitions increase load
    gaze_jitter = min(30.0, (abs(gaze_x) + abs(gaze_y)) * 1.5)
    # Head pose roll/yaw adjustments
    head_pose_load = min(20.0, (abs(yaw) + abs(pitch) + abs(roll)) * 0.6)
    # Eye closures / heavy fatigue load
    fatigue_load = 28.0 if ear < 0.18 or is_blinking else 0.0
    
    cognitive_load = min(100.0, base_load + gaze_jitter + head_pose_load + fatigue_load)

    # 7. Calculate Risk Escalation Re(t)
    # Risk climbs if aircraft state is in danger AND pilot SA is low
    max_aircraft_dev = max(actual_state.values())
    base_risk = max_aircraft_dev
    
    # Risk amplification factor: multiplies threat level based on lack of understanding
    amplification = 1.0 + (0.02 * (100.0 - situational_awareness))
    risk_escalation = min(100.0, base_risk * amplification)

    # If the operator is absent, force safety critical scores
    if not detected:
      situational_awareness = 0.0
      cognitive_load = 0.0
      risk_escalation = max(80.0, risk_escalation) # Force high risk
      understanding_gap = 100.0

    return {
      "situational_awareness": round(situational_awareness, 1),
      "cognitive_load": round(cognitive_load, 1),
      "understanding_gap": round(understanding_gap, 1),
      "risk_escalation": round(risk_escalation, 1),
      "attention_allocation": {
        "pfd": round(sess_attn["pfd"] * 100, 1),
        "tcas": round(sess_attn["tcas"] * 100, 1),
        "eicas": round(sess_attn["eicas"] * 100, 1),
        "alerts": round(sess_attn["alerts"] * 100, 1),
        "secondary": round(sess_attn["secondary"] * 100, 1)
      }
    }


# Initialize global engine instance
understanding_engine = UnderstandingEngine()
