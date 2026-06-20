from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

# ==========================================
# Operator Schemas
# ==========================================
class OperatorBase(BaseModel):
    name: str
    industry: str

class OperatorCreate(OperatorBase):
    pass

class OperatorResponse(OperatorBase):
    id: str
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Session Schemas
# ==========================================
class SessionCreate(BaseModel):
    operator_id: str
    initial_industry: str

class SessionResponse(BaseModel):
    id: str
    operator_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    initial_industry: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Attention Log Schemas
# ==========================================
class AttentionLogCreate(BaseModel):
    score: float
    state: str
    yaw: float
    pitch: float
    roll: float
    ear: float
    gaze_x: float
    gaze_y: float
    is_blinking: bool
    flight_phase: Optional[str] = "Cruise"
    transcript: Optional[str] = ""
    airspeed: Optional[float] = None
    altitude: Optional[float] = None
    timestamp: Optional[datetime] = None

class AttentionLogResponse(AttentionLogCreate):
    id: int
    session_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Alert Schemas
# ==========================================
class AlertCreate(BaseModel):
    alert_id: str
    code: str
    message: str
    original_priority: str
    final_urgency: float

class AlertResponse(BaseModel):
    id: str
    session_id: str
    timestamp: datetime
    alert_id: str
    code: str
    message: str
    original_priority: str
    final_urgency: float
    status: str
    acknowledged_at: Optional[datetime] = None
    response_time_sec: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Overload Event Schemas
# ==========================================
class OverloadEventResponse(BaseModel):
    id: str
    session_id: str
    start_time: datetime
    end_time: datetime
    duration_sec: float
    max_overload_level: int
    average_attention_score: float

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Performance Metric Schemas
# ==========================================
class PerformanceMetricResponse(BaseModel):
    id: str
    session_id: str
    calculated_at: datetime
    total_duration_sec: float
    avg_attention_score: float
    focus_ratio: float
    avg_alert_response_time: Optional[float] = None
    overall_risk_level: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Understanding Log Schemas
# ==========================================
class UnderstandingLogCreate(BaseModel):
    situational_awareness: float
    cognitive_load: float
    understanding_gap: float
    risk_escalation: float
    attention_pfd: float
    attention_tcas: float
    attention_eicas: float
    attention_alerts: float
    attention_secondary: float

class UnderstandingLogResponse(UnderstandingLogCreate):
    id: int
    session_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Combined Analytics Report Schemas
# ==========================================
class SessionHistoryPoint(BaseModel):
    timestamp: str
    score: float
    state: str
    risk_ema: float

class DigitalTwinReport(BaseModel):
    session_id: str
    operator_name: str
    industry: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_sec: float
    metrics: Optional[PerformanceMetricResponse] = None
    overload_events: List[OverloadEventResponse] = []
    alert_timeline: List[AlertResponse] = []
    attention_timeline: List[SessionHistoryPoint] = []
    understanding_timeline: List[UnderstandingLogResponse] = []
