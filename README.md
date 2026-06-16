# CognitiveSync: Adaptive Cockpit Intelligence System

CognitiveSync is an Edge AI-powered cockpit interface that monitors pilot/operator biometrics in real-time (using standard webcams and in-browser MediaPipe landmark estimation) and dynamically adapts the dashboard layout to mitigate cognitive overload and situational awareness gaps.

---

## 🚀 Quick Start & Camera Activation Guide

### 1. Start the Application
To run the front-end application locally, navigate to the project root and start the development server:
```bash
# Start Vite front-end dev server
npm run dev
```
Open your browser and navigate to: `http://localhost:5173/`

### 2. How to Turn On the Camera
1. Navigate to the **Tactical HUD** tab (the main dashboard page at `http://localhost:5173/`).
2. Locate the **Operator Tracking HUD** container in the left-hand column.
3. Click the cyan **Start Stream** button.
4. If prompted by your browser, grant camera access permission.
5. The tracking HUD will transition to a live camera view with a biometric visor overlay (mesh grids, horizontal tracking lines, and iris locked indicators).
6. **Webcam vs. Simulator Override:** If you interact with the sliders on the simulator panel, the dashboard will switch to simulator override. To resume live camera tracking, simply click **Start Stream** again.
7. To stop the webcam, click the red **Disable Stream** text button at the bottom-right corner of the Operator Tracking HUD panel.

---

## 🛠️ Codebase Architecture

CognitiveSync is split into a React client and a FastAPI backend server.

### Frontend Anatomy (`src/`)
* **[App.jsx](file:///src/App.jsx):** Main entry point managing global state, routing, database sync handlers, alarm sound triggers, and cross-tab synchronizations.
* **[index.css](file:///src/index.css):** Design system definition, neon glowing effects, CRT scanline grids, and adaptive screen styles (blurs, dimmers, foveated zooms).
* **[audio.js](file:///src/audio.js):** Browser Web Audio API synthesizer generating dynamic beep alarms based on cognitive distraction or fatigue levels.
* **`components/`**
  * **[WebcamTracker.jsx](file:///src/components/WebcamTracker.jsx):** Handles webcam frames, initializes MediaPipe Face Mesh, estimates head pose/blink ratios/gaze directions, and draws a visual targeting visor on a canvas overlay.
  * **[SimulatorPanel.jsx](file:///src/components/SimulatorPanel.jsx):** Manual sliders (Attention Score, Eye Gaze X/Y) and scenario triggers (Wind Shear, Hypoxia, Engine Flameout) to test UI adaptations without a camera.
  * **[AlertPanel.jsx](file:///src/components/AlertPanel.jsx):** Renders safety-critical warnings with acknowledgement buttons, sorting them dynamically by priority.
  * **[InstructorControl.jsx](file:///src/components/InstructorControl.jsx):** Renders at `/control`. Broadcasts manual biometric controls and hazard simulations to the main screen tab using HTML5 LocalStorage IPC.
  * **[DigitalTwinDashboard.jsx](file:///src/components/DigitalTwinDashboard.jsx):** Renders at `/twin`. Queries session history, logs, and analytics from the backend database.
* **`components/industry/`**
  * **[AerospaceCockpit.jsx](file:///src/components/industry/AerospaceCockpit.jsx):** A 4-screen glass cockpit consisting of:
    1. *Screen 1 (PFD):* Primary Flight HUD with horizon indicator, airspeed/altitude tapes, and eye-gaze heatmap.
    2. *Screen 2 (ND):* Radar sweep checking for proximity traffic (TCAS) and weather cells.
    3. *Screen 3 (EICAS):* Propulsion dials and active ARINC 429 decoded logs.
    4. *Screen 4 (BMS):* Biometric capacity gauges, blink index, head rotation angles, and situational awareness metrics.

### Backend Anatomy (`backend/`)
* **[main.py](file:///backend/main.py):** FastAPI REST application exposing operator session lifecycles, telemetry ingestion endpoints, and database connections.
* **[understanding_engine.py](file:///backend/understanding_engine.py):** Cognitive processing pipeline that computes attention allocation vectors across cockpit zones and estimates operator situational awareness (Endsley Level 1, 2, 3) and mental gap sizes.
* **[agentic_prioritizer.py](file:///backend/agentic_prioritizer.py):** A LangGraph-based state machine that parses attention metrics and active warnings to compute ui-adaptation instructions (dimming background screens, highlighting emergency widgets).
* **[models.py](file:///backend/models.py):** SQLAlchemy database definitions creating sessions, operators, attention metrics, and alert logs in SQL database.
