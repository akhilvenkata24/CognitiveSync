from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class Operator(Base):
    __tablename__ = "operators"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    industry = Column(String(50), nullable=False)  # aerospace, railways, mining, machinery
    registered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="operator", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operator_id = Column(String(36), ForeignKey("operators.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    initial_industry = Column(String(50), nullable=False)

    # Relationships
    operator = relationship("Operator", back_populates="sessions")
    attention_logs = relationship("AttentionLog", back_populates="session", cascade="all, delete-orphan")
    alerts = relationship("AlertHistory", back_populates="session", cascade="all, delete-orphan")
    overload_events = relationship("OverloadEvent", back_populates="session", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="session", cascade="all, delete-orphan")
    understanding_logs = relationship("UnderstandingLog", back_populates="session", cascade="all, delete-orphan")


class AttentionLog(Base):
    __tablename__ = "attention_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    score = Column(Float, nullable=False)
    state = Column(String(20), nullable=False)  # focused, normal, distracted, fatigued
    yaw = Column(Float, nullable=False)
    pitch = Column(Float, nullable=False)
    roll = Column(Float, nullable=False)
    ear = Column(Float, nullable=False)
    gaze_x = Column(Float, nullable=False)
    gaze_y = Column(Float, nullable=False)
    is_blinking = Column(Boolean, nullable=False)

    # Relationships
    session = relationship("Session", back_populates="attention_logs")


class AlertHistory(Base):
    __tablename__ = "alerts_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    alert_id = Column(String(100), nullable=False)  # Client-side generated alert ID
    code = Column(String(50), nullable=False)       # TCAS_COLLISION, FUEL_FILTER_CLOG, etc.
    message = Column(Text, nullable=False)
    original_priority = Column(String(20), nullable=False)  # low, high, critical
    final_urgency = Column(Float, nullable=False)           # recalculation after prioritizing
    status = Column(String(20), default="active")           # active, acknowledged
    acknowledged_at = Column(DateTime, nullable=True)
    response_time_sec = Column(Float, nullable=True)        # timestamp delta

    # Relationships
    session = relationship("Session", back_populates="alerts")


class OverloadEvent(Base):
    __tablename__ = "overload_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_sec = Column(Float, nullable=False)
    max_overload_level = Column(Integer, nullable=False)  # 0 to 4
    average_attention_score = Column(Float, nullable=False)

    # Relationships
    session = relationship("Session", back_populates="overload_events")


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    total_duration_sec = Column(Float, default=0.0)
    avg_attention_score = Column(Float, default=100.0)
    focus_ratio = Column(Float, default=1.0)                 # Ratio (0.0 to 1.0) of focused+normal time
    avg_alert_response_time = Column(Float, nullable=True)    # Average response speed
    overall_risk_level = Column(String(20), default="low")    # low, moderate, high, critical

    # Relationships
    session = relationship("Session", back_populates="performance_metrics")


class UnderstandingLog(Base):
    __tablename__ = "understanding_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    situational_awareness = Column(Float, nullable=False)
    cognitive_load = Column(Float, nullable=False)
    understanding_gap = Column(Float, nullable=False)
    risk_escalation = Column(Float, nullable=False)
    attention_pfd = Column(Float, nullable=False)
    attention_tcas = Column(Float, nullable=False)
    attention_eicas = Column(Float, nullable=False)
    attention_alerts = Column(Float, nullable=False)
    attention_secondary = Column(Float, nullable=False)

    # Relationships
    session = relationship("Session", back_populates="understanding_logs")
