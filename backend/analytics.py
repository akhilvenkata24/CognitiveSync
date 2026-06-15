from sqlalchemy.orm import Session
from datetime import datetime
import models
from typing import Dict, Any, List

def detect_and_save_overload_events(db: Session, session_id: str) -> List[models.OverloadEvent]:
    """
    Analyzes raw attention logs chronologically to identify continuous periods of
    cognitive overload. Overload is defined as attention score falling below 45
    for 5 or more consecutive seconds.
    Clear existing logs and regenerates them to guarantee consistency.
    """
    # 1. Clear existing overload events for this session
    db.query(models.OverloadEvent).filter(models.OverloadEvent.session_id == session_id).delete()
    db.commit()

    # 2. Query logs in chronological order
    logs = db.query(models.AttentionLog).filter(
        models.AttentionLog.session_id == session_id
    ).order_by(models.AttentionLog.timestamp.asc()).all()

    if not logs:
        return []

    overload_events = []
    current_start = None
    active_logs = []

    for i, log in enumerate(logs):
        # Determine if frame is in an overloaded state (Distracted < 42, Fatigue/Sleep = 5, or general score < 45)
        is_overloaded = log.score < 45 or log.state in ["distracted", "fatigued", "High Risk"]

        if is_overloaded:
            if current_start is None:
                current_start = log.timestamp
            active_logs.append(log)
        else:
            if current_start is not None:
                # Period ended. Calculate duration.
                duration_sec = (log.timestamp - current_start).total_seconds()
                if duration_sec >= 5.0:
                    # Score averaging and level classification
                    avg_score = sum(l.score for l in active_logs) / len(active_logs)
                    min_score = min(l.score for l in active_logs)
                    max_lvl = 4 if min_score < 30 or any(l.state == "fatigued" for l in active_logs) else 3

                    event = models.OverloadEvent(
                        session_id=session_id,
                        start_time=current_start,
                        end_time=log.timestamp,
                        duration_sec=round(duration_sec, 1),
                        max_overload_level=max_lvl,
                        average_attention_score=round(avg_score, 1)
                    )
                    db.add(event)
                    overload_events.append(event)
                
                # Reset tracking
                current_start = None
                active_logs = []

    # Handle a trailing overload condition at the end of the session
    if current_start is not None and len(active_logs) > 1:
        end_time = active_logs[-1].timestamp
        duration_sec = (end_time - current_start).total_seconds()
        if duration_sec >= 5.0:
            avg_score = sum(l.score for l in active_logs) / len(active_logs)
            min_score = min(l.score for l in active_logs)
            max_lvl = 4 if min_score < 30 or any(l.state == "fatigued" for l in active_logs) else 3

            event = models.OverloadEvent(
                session_id=session_id,
                start_time=current_start,
                end_time=end_time,
                duration_sec=round(duration_sec, 1),
                max_overload_level=max_lvl,
                average_attention_score=round(avg_score, 1)
            )
            db.add(event)
            overload_events.append(event)

    db.commit()
    return overload_events


def compute_session_performance(db: Session, session_id: str) -> models.PerformanceMetric:
    """
    Summarizes operator focus ratio, average alert response speed, average attention scores,
    and assigns an overall session risk category.
    """
    # 1. Delete prior computed metrics for session
    db.query(models.PerformanceMetric).filter(models.PerformanceMetric.session_id == session_id).delete()
    db.commit()

    # 2. Get session & check time duration
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found.")

    end_time = session.end_time or datetime.utcnow()
    total_duration = (end_time - session.start_time).total_seconds()

    # 3. Pull attention logs
    logs = db.query(models.AttentionLog).filter(models.AttentionLog.session_id == session_id).all()
    if not logs:
        # Default empty log values
        metric = models.PerformanceMetric(
            session_id=session_id,
            total_duration_sec=round(total_duration, 1),
            avg_attention_score=100.0,
            focus_ratio=1.0,
            avg_alert_response_time=None,
            overall_risk_level="low"
        )
        db.add(metric)
        db.commit()
        return metric

    # Calculate average attention
    avg_attention = sum(log.score for log in logs) / len(logs)

    # Focus Ratio (focused & normal logs / total logs)
    focus_logs_count = sum(1 for log in logs if log.state.lower() in ["focused", "normal"])
    focus_ratio = focus_logs_count / len(logs)

    # 4. Pull Alert stats
    alerts = db.query(models.AlertHistory).filter(
        models.AlertHistory.session_id == session_id,
        models.AlertHistory.status == "acknowledged"
    ).all()

    avg_response_time = None
    if alerts:
        valid_response_times = [a.response_time_sec for a in alerts if a.response_time_sec is not None]
        if valid_response_times:
            avg_response_time = round(sum(valid_response_times) / len(valid_response_times), 2)

    # 5. Overload details
    overloads = db.query(models.OverloadEvent).filter(models.OverloadEvent.session_id == session_id).all()
    overload_duration = sum(o.duration_sec for o in overloads)

    # 6. Assign Overall Risk Level
    # Rules hierarchy: Critical -> High -> Moderate -> Low
    if focus_ratio < 0.40 or avg_attention < 40.0 or overload_duration > 45.0 or any(o.max_overload_level == 4 for o in overloads):
        risk_level = "critical"
    elif focus_ratio < 0.65 or avg_attention < 55.0 or overload_duration > 15.0:
        risk_level = "high"
    elif focus_ratio < 0.85 or avg_attention < 75.0 or len(overloads) > 0:
        risk_level = "moderate"
    else:
        risk_level = "low"

    metric = models.PerformanceMetric(
        session_id=session_id,
        total_duration_sec=round(total_duration, 1),
        avg_attention_score=round(avg_attention, 1),
        focus_ratio=round(focus_ratio, 3),
        avg_alert_response_time=avg_response_time,
        overall_risk_level=risk_level
    )
    
    db.add(metric)
    db.commit()
    return metric


def calculate_risk_trends(logs: List[models.AttentionLog], alpha: float = 0.08) -> List[float]:
    """
    Computes a smoothed moving Risk Score trend over a list of attention logs.
    Risk score is defined as: Risk = 100 - Attention_Score.
    Returns list of smoothed risk floats.
    """
    trends = []
    smoothed_risk = 0.0
    
    for i, log in enumerate(logs):
        raw_risk = 100.0 - log.score
        if i == 0:
            smoothed_risk = raw_risk
        else:
            # Exponential moving average filter
            smoothed_risk = (alpha * raw_risk) + ((1 - alpha) * smoothed_risk)
        trends.append(round(smoothed_risk, 1))
        
    return trends
