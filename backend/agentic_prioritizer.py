"""
CognitiveSync Agentic AI Prioritizer
====================================
This module implements a LangGraph-based state machine that:
1. Evaluates operator cognitive bandwidth from attention scores.
2. Re-ranks active alerts based on contextual urgency.
3. Formulates layout instructions (dimming, highlights, overlays).
4. Produces a detailed reasoning log for every layout decision.
"""

from typing import TypedDict, List, Dict, Any
import math
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    attention_score: float                  # Current attention score (0-100)
    detected: bool                         # Face sensor lock status
    raw_alerts: List[Dict[str, Any]]        # Active warnings (code, message, priority)
    prioritized_alerts: List[Dict[str, Any]] # Output: Alerts with recalculated weights
    ui_layout_instructions: Dict[str, Any]  # Output: Layout schema dict
    reasoning_chain: List[str]             # Output: Chain of reasoning log strings

# ==========================================
# 1. Graph Nodes Implementation
# ==========================================

def evaluate_cognitive_bandwidth(state: AgentState) -> AgentState:
    """
    Node 1: Evaluates operator cognitive availability based on attention telemetry.
    Sets the bandwidth coefficient (0.0 to 1.0) defining information capacity.
    """
    score = state["attention_score"]
    detected = state["detected"]
    reasoning = []

    reasoning.append(f"[Cognitive Bandwidth Node] Analyzing telemetry: Attention Score={score}%, Face Lock={detected}.")

    if not detected:
        bandwidth = 0.0
        reasoning.append("Operator absent. Bandwidth capacity set to 0.0. Forcing emergency protocol.")
    elif score < 30:
        bandwidth = 0.1
        reasoning.append(f"Attention score ({score}%) suggests critical fatigue/micro-sleep. Bandwidth capacity capped at 10%.")
    elif score < 45:
        bandwidth = 0.3
        reasoning.append(f"Attention score ({score}%) suggests high distraction. Bandwidth capacity capped at 30%.")
    elif score < 60:
        bandwidth = 0.6
        reasoning.append(f"Attention score ({score}%) suggests moderate distraction. Bandwidth capacity capped at 60%.")
    elif score < 75:
        bandwidth = 0.8
        reasoning.append(f"Attention score ({score}%) suggests mild distraction. Bandwidth capacity set to 80%.")
    else:
        bandwidth = 1.0
        reasoning.append(f"Attention score ({score}%) is optimal. Operator bandwidth set to 100% (Full Capacity).")

    # Save calculated bandwidth in temp state or write to reasoning chain
    state["reasoning_chain"] = reasoning
    state["ui_layout_instructions"] = {"bandwidth_coefficient": bandwidth}
    return state


def assess_alert_importance(state: AgentState) -> AgentState:
    """
    Node 2: Re-ranks active alerts based on operator attention level.
    Boosts safety-critical alerts (TCAS/Proximity) when distracted.
    Suppresses diagnostic/low-priority items under high load.
    """
    score = state["attention_score"]
    detected = state["detected"]
    raw_alerts = state.get("raw_alerts", [])
    prioritized = []
    reasoning = state["reasoning_chain"]

    reasoning.append("[Alert Assessment Node] Re-evaluating active warnings against bandwidth limits.")
    
    # Attention loss factor (reverses score to represent level of distraction)
    distraction_factor = (100.0 - score) / 100.0 if detected else 1.0

    for alert in raw_alerts:
        code = alert.get("code", "UNKNOWN")
        msg = alert.get("message", "")
        priority = alert.get("priority", "low")
        
        # Base weight based on priority
        base_weights = {"critical": 80.0, "high": 50.0, "low": 20.0}
        base_weight = base_weights.get(priority, 10.0)

        # Contextual modifiers
        is_safety_critical = priority == "critical" or "tcas" in code.lower() or "proximity" in code.lower() or "signal" in code.lower()
        is_diagnostic = priority == "low" or "filter" in code.lower() or "diag" in code.lower() or "perf" in code.lower()

        if is_safety_critical:
            # Urgency climbs rapidly when operator is distracted
            dynamic_weight = base_weight + (distraction_factor * 35.0)
            reasoning.append(
                f" - Alert '{msg}' is SAFETY CRITICAL. Boosted base weight {base_weight} to {dynamic_weight:.1f} "
                f"(Distraction multiplier active: +{distraction_factor*35.0:.1f} urgency)."
            )
        elif is_diagnostic:
            # Diagnostics are suppressed under distraction/fatigued states to protect operator bandwidth
            suppression = distraction_factor * 15.0
            dynamic_weight = max(5.0, base_weight - suppression)
            reasoning.append(
                f" - Alert '{msg}' is DIAGNOSTIC. Reduced base weight {base_weight} to {dynamic_weight:.1f} "
                f"(Suppression active: -{suppression:.1f} weight to prevent cognitive overload)."
            )
        else:
            # Standard moderate alert
            dynamic_weight = base_weight
            reasoning.append(f" - Alert '{msg}' is STANDARD. Retaining base weight of {base_weight}.")

        prioritized.append({
            **alert,
            "original_priority": priority,
            "calculated_urgency": round(dynamic_weight, 1),
            "status": "suppressed" if (is_diagnostic and distraction_factor > 0.4) else "active"
        })

    # Sort alerts by newly calculated urgency
    prioritized.sort(key=lambda x: x["calculated_urgency"], reverse=True)
    state["prioritized_alerts"] = prioritized
    state["reasoning_chain"] = reasoning
    return state


def determine_dashboard_layout(state: AgentState) -> AgentState:
    """
    Node 3: Decides layout adjustments (e.g. dimming levels, card magnification)
    based on the top re-ranked alert urgencies.
    """
    attention_score = state["attention_score"]
    detected = state["detected"]
    prioritized = state["prioritized_alerts"]
    reasoning = state["reasoning_chain"]
    layout = state["ui_layout_instructions"]

    reasoning.append("[Layout Determination Node] Calculating dashboard style modifications.")

    if not detected or attention_score < 30:
        # Level 4: Complete emergency override
        layout["dim_non_critical"] = True
        layout["highlight_alerts"] = True
        layout["expand_critical"] = True
        layout["emergency_alarm"] = True
        layout["primary_focus_alert"] = prioritized[0] if prioritized else None
        reasoning.append(" - CRITICAL OVERLOAD: Triggering Level 4 Emergency Dashboard Takeover. Auditory buzzer and sirens active.")
    elif attention_score < 45:
        # Level 3: Blur background and overlay critical alert
        layout["dim_non_critical"] = True
        layout["highlight_alerts"] = True
        layout["expand_critical"] = True
        layout["emergency_alarm"] = False
        layout["primary_focus_alert"] = prioritized[0] if prioritized else None
        reasoning.append(
            f" - HIGH DISTRACTION: Top warning '{prioritized[0]['message'] if prioritized else 'NONE'}' urgency is high. "
            "Expanding warning details, dimming secondary components, and activating steady warning tone."
        )
    elif attention_score < 60:
        # Level 2: Dim low-priority panels
        layout["dim_non_critical"] = True
        layout["highlight_alerts"] = False
        layout["expand_critical"] = False
        layout["emergency_alarm"] = False
        layout["primary_focus_alert"] = None
        reasoning.append(" - MODERATE DISTRACTION: Dimming low-priority panels (Biometrics, secondary meters) to clear clutter.")
    elif attention_score < 75:
        # Level 1: Highlight critical widgets
        layout["dim_non_critical"] = False
        layout["highlight_alerts"] = True
        layout["expand_critical"] = False
        layout["emergency_alarm"] = False
        layout["primary_focus_alert"] = None
        reasoning.append(" - MILD DISTRACTION: Highlighting active critical elements in the warning list with glowing outlines.")
    else:
        # Level 0: Standard Full Display
        layout["dim_non_critical"] = False
        layout["highlight_alerts"] = False
        layout["expand_critical"] = False
        layout["emergency_alarm"] = False
        layout["primary_focus_alert"] = None
        reasoning.append(" - NORMAL OPERATIONS: Cockpit console rendering with full layout brightness.")

    state["ui_layout_instructions"] = layout
    state["reasoning_chain"] = reasoning
    return state


def generate_ui_schema(state: AgentState) -> AgentState:
    """
    Node 4: Assembles finalized layout parameters into the output schema dictionary.
    """
    reasoning = state["reasoning_chain"]
    reasoning.append("[Schema Generator Node] Dynamic cockpit layout instructions compiled successfully.")
    state["reasoning_chain"] = reasoning
    return state

# ==========================================
# 2. StateGraph Construction & Compilation
# ==========================================

# Initialize builder
builder = StateGraph(AgentState)

# Add Nodes
builder.add_node("evaluate_cognitive_bandwidth", evaluate_cognitive_bandwidth)
builder.add_node("assess_alert_importance", assess_alert_importance)
builder.add_node("determine_dashboard_layout", determine_dashboard_layout)
builder.add_node("generate_ui_schema", generate_ui_schema)

# Bind Edges
builder.set_entry_point("evaluate_cognitive_bandwidth")
builder.add_edge("evaluate_cognitive_bandwidth", "assess_alert_importance")
builder.add_edge("assess_alert_importance", "determine_dashboard_layout")
builder.add_edge("determine_dashboard_layout", "generate_ui_schema")
builder.add_edge("generate_ui_schema", END)

# Compile LangGraph Agent
prioritizer_agent = builder.compile()

# ==========================================
# 3. Execution Verification Wrapper
# ==========================================
def run_agentic_pipeline(score: float, detected: bool, active_alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Runs thecompiled StateGraph agentic flow synchronously.
    Convenient entry point for testing and backend server updates.
    """
    initial_state: AgentState = {
        "attention_score": score,
        "detected": detected,
        "raw_alerts": active_alerts,
        "prioritized_alerts": [],
        "ui_layout_instructions": {},
        "reasoning_chain": []
    }
    return prioritizer_agent.invoke(initial_state)

if __name__ == "__main__":
    # Test script verification run
    test_alerts = [
        {"code": "TCAS_COLLISION", "message": "TRAFFIC ENCOUNTER", "priority": "critical"},
        {"code": "FUEL_FILTER_CLOG", "message": "FUEL FILTER DETECT", "priority": "low"},
        {"code": "WEATHER_SHEAR", "message": "WIND SHEAR RADAR", "priority": "high"}
    ]
    
    print("\n--- TEST RUN 1: OPERATOR FOCUSED (90%) ---")
    res1 = run_agentic_pipeline(90.0, True, test_alerts)
    for step in res1["reasoning_chain"]:
        print(step)
        
    print("\n--- TEST RUN 2: OPERATOR DISTRACTED (38%) ---")
    res2 = run_agentic_pipeline(38.0, True, test_alerts)
    for step in res2["reasoning_chain"]:
        print(step)
