import sys
import os
from datetime import datetime
from typing import List, Optional

# Guarantee local imports work regardless of working directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import analytics
from database import engine, get_db
from agentic_prioritizer import run_agentic_pipeline
from understanding_engine import understanding_engine

# 1. Initialize DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CognitiveSync Digital Twin API Server",
    description="Backend services for real-time telemetry prioritization and historical operator analysis.",
    version="1.0.0"
)

# 2. Add CORS Middleware for React local dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. DB Seeder: Initialize default operator if none exists
@app.on_event("startup")
def seed_default_operator():
    db = next(get_db())
    try:
        default_op = db.query(models.Operator).filter(models.Operator.id == "operator_01").first()
        if not default_op:
            op = models.Operator(
                id="operator_01",
                name="Akhil Kumar",
                industry="aerospace",
                registered_at=datetime.utcnow()
            )
            db.add(op)
            db.commit()
            print("[Info] Seeded default operator 'operator_01' in database.")
    except Exception as e:
        print(f"[Error] Failed to seed default operator: {e}")
    finally:
        db.close()


# ==========================================
# Operator & Session Routes
# ==========================================

@app.post("/api/operators", response_model=schemas.OperatorResponse, status_code=status.HTTP_201_CREATED)
def create_operator(operator: schemas.OperatorCreate, db: Session = Depends(get_db)):
    db_operator = models.Operator(
        name=operator.name,
        industry=operator.industry
    )
    db.add(db_operator)
    db.commit()
    db.refresh(db_operator)
    return db_operator


@app.get("/api/operators", response_model=List[schemas.OperatorResponse])
def get_operators(db: Session = Depends(get_db)):
    return db.query(models.Operator).all()


@app.post("/api/sessions/start", response_model=schemas.SessionResponse)
def start_session(session_data: schemas.SessionCreate, db: Session = Depends(get_db)):
    # Verify operator exists
    operator = db.query(models.Operator).filter(models.Operator.id == session_data.operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    # End any previous ongoing sessions for this operator
    active_sessions = db.query(models.Session).filter(
        models.Session.operator_id == session_data.operator_id,
        models.Session.end_time == None
    ).all()
    for s in active_sessions:
        s.end_time = datetime.utcnow()
        analytics.detect_and_save_overload_events(db, s.id)
        analytics.compute_session_performance(db, s.id)
        
    db.commit()

    db_session = models.Session(
        operator_id=session_data.operator_id,
        initial_industry=session_data.initial_industry,
        start_time=datetime.utcnow()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@app.post("/api/sessions/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if db_session.end_time is None:
        db_session.end_time = datetime.utcnow()
        db.commit()
        
    # Trigger final analytics compile
    analytics.detect_and_save_overload_events(db, session_id)
    analytics.compute_session_performance(db, session_id)
    
    db.refresh(db_session)
    return db_session


# ==========================================
# Telemetry & Live Prioritizer Routes
# ==========================================

@app.post("/api/sessions/{session_id}/telemetry")
def log_telemetry(session_id: str, telemetry: schemas.AttentionLogCreate, db: Session = Depends(get_db)):
    """
    Receives frontend frame telemetry, saves it to the database, queries active alerts,
    runs the LangGraph agentic prioritizer loop, and returns UI adaptation commands.
    """
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Insert telemetry log
    log_time = telemetry.timestamp or datetime.utcnow()
    db_log = models.AttentionLog(
        session_id=session_id,
        timestamp=log_time,
        score=telemetry.score,
        state=telemetry.state,
        yaw=telemetry.yaw,
        pitch=telemetry.pitch,
        roll=telemetry.roll,
        ear=telemetry.ear,
        gaze_x=telemetry.gaze_x,
        gaze_y=telemetry.gaze_y,
        is_blinking=telemetry.is_blinking
    )
    db.add(db_log)
    
    # 2. Retrieve active alerts for LangGraph re-prioritization & Understanding Engine
    active_db_alerts = db.query(models.AlertHistory).filter(
        models.AlertHistory.session_id == session_id,
        models.AlertHistory.status == "active"
    ).all()

    raw_alerts = [
        {
            "code": a.code,
            "message": a.message,
            "priority": a.original_priority
        } for a in active_db_alerts
    ]

    # 3. Process Understanding Gap metrics
    detected = telemetry.state.lower() != "absent" and telemetry.score > 0.0
    u_metrics = understanding_engine.update(
        session_id=session_id,
        detected=detected,
        attention_score=telemetry.score,
        yaw=telemetry.yaw,
        pitch=telemetry.pitch,
        roll=telemetry.roll,
        ear=telemetry.ear,
        gaze_x=telemetry.gaze_x,
        gaze_y=telemetry.gaze_y,
        is_blinking=telemetry.is_blinking,
        active_alerts=raw_alerts
    )

    # 4. Insert Understanding metrics log row
    db_understanding = models.UnderstandingLog(
        session_id=session_id,
        timestamp=log_time,
        situational_awareness=u_metrics["situational_awareness"],
        cognitive_load=u_metrics["cognitive_load"],
        understanding_gap=u_metrics["understanding_gap"],
        risk_escalation=u_metrics["risk_escalation"],
        attention_pfd=u_metrics["attention_allocation"]["pfd"],
        attention_tcas=u_metrics["attention_allocation"]["tcas"],
        attention_eicas=u_metrics["attention_allocation"]["eicas"],
        attention_alerts=u_metrics["attention_allocation"]["alerts"],
        attention_secondary=u_metrics["attention_allocation"]["secondary"]
    )
    db.add(db_understanding)
    db.commit()

    # 5. Invoke LangGraph prioritizer node loop
    agent_output = run_agentic_pipeline(
        score=telemetry.score,
        detected=detected,
        active_alerts=raw_alerts
    )

    # 6. If the agent changed alert rankings, update final urgencies in database
    prioritized_alerts = agent_output.get("prioritized_alerts", [])
    for p_alert in prioritized_alerts:
        for db_alert in active_db_alerts:
            if db_alert.code == p_alert["code"]:
                db_alert.final_urgency = p_alert["calculated_urgency"]
    
    db.commit()

    return {
        "status": "success",
        "attention_score": telemetry.score,
        "state": telemetry.state,
        "ui_layout": agent_output.get("ui_layout_instructions", {}),
        "reasoning_chain": agent_output.get("reasoning_chain", []),
        "understanding": u_metrics
    }


# ==========================================
# Alert Tracking Routes
# ==========================================

@app.post("/api/sessions/{session_id}/alerts", response_model=schemas.AlertResponse)
def log_alert(session_id: str, alert: schemas.AlertCreate, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_alert = models.AlertHistory(
        session_id=session_id,
        timestamp=datetime.utcnow(),
        alert_id=alert.alert_id,
        code=alert.code,
        message=alert.message,
        original_priority=alert.original_priority,
        final_urgency=alert.final_urgency,
        status="active"
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@app.put("/api/sessions/{session_id}/alerts/{alert_id}/acknowledge", response_model=schemas.AlertResponse)
def acknowledge_alert(session_id: str, alert_id: str, db: Session = Depends(get_db)):
    """
    Marks an active alert as acknowledged. Calculates the operator response latency.
    """
    db_alert = db.query(models.AlertHistory).filter(
        models.AlertHistory.session_id == session_id,
        models.AlertHistory.alert_id == alert_id
    ).first()

    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found in history")

    if db_alert.status == "active":
        now = datetime.utcnow()
        db_alert.status = "acknowledged"
        db_alert.acknowledged_at = now
        # Delta time calculation
        delta_sec = (now - db_alert.timestamp).total_seconds()
        db_alert.response_time_sec = round(delta_sec, 2)
        db_alert.final_urgency = 0.0 # Clear urgency level upon ack
        db.commit()
        db.refresh(db_alert)
        
        # Trigger recalculation of performance summaries
        analytics.compute_session_performance(db, session_id)
        
    return db_alert


# ==========================================
# Digital Twin Analytics Routes
# ==========================================

@app.get("/api/digital-twin/sessions", response_model=List[schemas.SessionResponse])
def get_all_sessions(db: Session = Depends(get_db)):
    return db.query(models.Session).order_by(models.Session.start_time.desc()).all()


@app.get("/api/digital-twin/sessions/{session_id}/report", response_model=schemas.DigitalTwinReport)
def get_session_report(session_id: str, db: Session = Depends(get_db)):
    """
    Computes analytics and returns a comprehensive Digital Twin report
    including biometrics charts, alerts logs, and overload event windows.
    """
    # 1. Pull Session info
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2. Recalculate latest statistics
    analytics.detect_and_save_overload_events(db, session_id)
    metric = analytics.compute_session_performance(db, session_id)

    # 3. Pull details
    overload_events = db.query(models.OverloadEvent).filter(
        models.OverloadEvent.session_id == session_id
    ).order_by(models.OverloadEvent.start_time.asc()).all()

    alerts = db.query(models.AlertHistory).filter(
        models.AlertHistory.session_id == session_id
    ).order_by(models.AlertHistory.timestamp.asc()).all()

    logs = db.query(models.AttentionLog).filter(
        models.AttentionLog.session_id == session_id
    ).order_by(models.AttentionLog.timestamp.asc()).all()

    # Calculate risk trends
    risk_ema = analytics.calculate_risk_trends(logs)

    # 4. Downsample attention logs to maximum ~120 points for fast frontend SVG rendering
    attention_timeline = []
    total_logs = len(logs)
    
    if total_logs > 0:
        step = max(1, total_logs // 120)
        for idx in range(0, total_logs, step):
            log = logs[idx]
            attention_timeline.append(schemas.SessionHistoryPoint(
                timestamp=log.timestamp.strftime("%H:%M:%S"),
                score=log.score,
                state=log.state,
                risk_ema=risk_ema[idx]
            ))

    # 5. Downsample understanding logs for the cockpit twin
    u_logs = db.query(models.UnderstandingLog).filter(
        models.UnderstandingLog.session_id == session_id
    ).order_by(models.UnderstandingLog.timestamp.asc()).all()

    understanding_timeline = []
    total_u_logs = len(u_logs)
    if total_u_logs > 0:
        step_u = max(1, total_u_logs // 120)
        for idx in range(0, total_u_logs, step_u):
            ul = u_logs[idx]
            understanding_timeline.append(schemas.UnderstandingLogResponse(
                id=ul.id,
                session_id=ul.session_id,
                timestamp=ul.timestamp,
                situational_awareness=ul.situational_awareness,
                cognitive_load=ul.cognitive_load,
                understanding_gap=ul.understanding_gap,
                risk_escalation=ul.risk_escalation,
                attention_pfd=ul.attention_pfd,
                attention_tcas=ul.attention_tcas,
                attention_eicas=ul.attention_eicas,
                attention_alerts=ul.attention_alerts,
                attention_secondary=ul.attention_secondary
            ))

    # Calculate session duration
    end_t = session.end_time or datetime.utcnow()
    duration_sec = (end_t - session.start_time).total_seconds()

    return schemas.DigitalTwinReport(
        session_id=session.id,
        operator_name=session.operator.name,
        industry=session.initial_industry,
        start_time=session.start_time,
        end_time=session.end_time,
        duration_sec=round(duration_sec, 1),
        metrics=metric,
        overload_events=overload_events,
        alert_timeline=alerts,
        attention_timeline=attention_timeline,
        understanding_timeline=understanding_timeline
    )


@app.get("/api/digital-twin/summary")
def get_global_twin_summary(db: Session = Depends(get_db)):
    """
    Computes high-level aggregated digital twin reports across all logged sessions.
    """
    sessions = db.query(models.Session).all()
    operators = db.query(models.Operator).all()
    metrics = db.query(models.PerformanceMetric).all()
    overloads = db.query(models.OverloadEvent).all()
    
    total_sessions = len(sessions)
    total_operators = len(operators)
    
    total_duration = sum(m.total_duration_sec for m in metrics)
    avg_attention = sum(m.avg_attention_score for m in metrics) / len(metrics) if metrics else 100.0
    avg_focus_ratio = sum(m.focus_ratio for m in metrics) / len(metrics) if metrics else 1.0
    
    # Calculate response time
    valid_rts = [m.avg_alert_response_time for m in metrics if m.avg_alert_response_time is not None]
    avg_rt = sum(valid_rts) / len(valid_rts) if valid_rts else None

    # Overload frequencies
    critical_overloads = sum(1 for o in overloads if o.max_overload_level == 4)
    moderate_overloads = sum(1 for o in overloads if o.max_overload_level == 3)
    
    # Calculate risk counts
    risk_counts = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
    for m in metrics:
        lvl = m.overall_risk_level.lower()
        if lvl in risk_counts:
            risk_counts[lvl] += 1

    return {
        "total_operators": total_operators,
        "total_sessions": total_sessions,
        "total_hours_logged": round(total_duration / 3600.0, 3),
        "average_attention_score": round(avg_attention, 1),
        "average_focus_ratio": round(avg_focus_ratio, 3),
        "average_response_time_sec": round(avg_rt, 2) if avg_rt else None,
        "overload_events_count": {
            "total": len(overloads),
            "critical_level_4": critical_overloads,
            "moderate_level_3": moderate_overloads
        },
        "operator_risk_distribution": risk_counts
    }
