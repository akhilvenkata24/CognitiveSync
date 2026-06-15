"""
CognitiveSync Camera Pipeline
=============================
This script runs a real-time OpenCV camera processing loop. It captures webcam
frames, extracts facial landmarks using MediaPipe FaceMesh, and feeds them into
the AttentionEngine to output attention states.

Features:
- Live video rendering with a futuristic operator HUD.
- Landmark drawing for face wireframe and iris vector projection.
- Live telemetry panel overlay on the feed.
- Processing latency monitor (milliseconds).

Usage:
    python backend/camera_pipeline.py
"""

import time
import cv2
import mediapipe as mp
import numpy as np
from attention_engine import AttentionEngine

def main():
    # 1. Initialize OpenCV webcam stream (0 is typically the default laptop webcam)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Error] Could not open webcam stream. Check camera permissions.")
        return

    # Set frame dimensions for fast real-time processing
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    # 2. Initialize MediaPipe Face Mesh
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,  # Critical: Enriches face mesh with Iris landmarks
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    # 3. Initialize Attention Engine
    engine = AttentionEngine(
        ema_alpha=0.18,       # Balanced smoothing rate
        ear_threshold=0.18,   # Threshold below which eyes are marked closed
        fatigue_timeout=1.3   # Threshold (s) for micro-sleep trigger
    )

    print("=========================================")
    print("CognitiveSync Attention Pipeline Active")
    print("Press 'q' in the window to terminate.")
    print("=========================================")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[Warning] Blank frame received from webcam.")
            continue

        # Mirror the image horizontally for natural look-and-feel
        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape

        # Measure starting time for latency monitor
        start_time = time.time()

        # Convert BGR to RGB (MediaPipe requirement)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Run FaceMesh inference
        results = face_mesh.process(rgb_frame)
        current_time = time.time()

        # 4. Feed biometrics into Attention Engine
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            metrics = engine.update(landmarks, current_time)
            detected = True
        else:
            metrics = engine.update_face_lost(current_time)
            detected = False

        # Calculate processing latency (inference + score math)
        latency_ms = (time.time() - start_time) * 1000

        # ==========================================
        # 5. Visual Rendering: Futuristic HUD
        # ==========================================
        # Extract results
        score = metrics["attention_score"]
        state = metrics["state"]

        # Establish state specific color mapping
        if state == "High Risk":
            color = (249, 0, 213)  # Magenta BGR
            alert_text = "CRITICAL: SLEEP / ABSENCE DETECTED"
        elif state == "Distracted":
            color = (68, 23, 255)  # Red BGR
            alert_text = "WARNING: OPERATOR DISTRACTED"
        elif state == "Normal":
            color = (0, 145, 255)  # Orange BGR
            alert_text = "STATE: NORMAL ATTENTION"
        else:
            color = (118, 230, 0)  # Green BGR
            alert_text = "STATE: OPTIMAL FOCUS"

        # A. Draw HUD Outer Border Warning if Distracted or Fatigued
        if state in ["Distracted", "High Risk"]:
            border_thickness = 8 if state == "High Risk" else 4
            # Flashing border effect using time module
            if int(current_time * 5) % 2 == 0:
                cv2.rectangle(frame, (0, 0), (w, h), color, border_thickness)

        # B. Draw face landmarks wireframe (Aesthetic subset)
        if detected and results.multi_face_landmarks:
            landmarks_list = results.multi_face_landmarks[0].landmark
            
            # Sub-mesh indices to draw outline, eyes, nose, and lips
            draw_lines_between_points(frame, landmarks_list, [
                10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
                400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
                54, 103, 67, 109, 10
            ], color, 1)

            # Draw Eyes
            right_eye_indices = [33, 160, 158, 133, 153, 144, 33]
            left_eye_indices = [362, 385, 387, 263, 373, 380, 362]
            draw_lines_between_points(frame, landmarks_list, right_eye_indices, color, 1)
            draw_lines_between_points(frame, landmarks_list, left_eye_indices, color, 1)

            # Draw pupils (Iris points)
            iris_l = landmarks_list[468]
            iris_r = landmarks_list[473]
            cv2.circle(frame, (int(iris_l.x * w), int(iris_l.y * h)), 2, (0, 230, 118), -1)
            cv2.circle(frame, (int(iris_r.x * w), int(iris_r.y * h)), 2, (0, 230, 118), -1)

            # Draw gaze vector line projecting from center eye point
            center_x = int((iris_l.x + iris_r.x) / 2.0 * w)
            center_y = int((iris_l.y + iris_r.y) / 2.0 * h)
            g_x = metrics["biometrics"]["gaze_x"]
            g_y = metrics["biometrics"]["gaze_y"]
            cv2.line(frame, (center_x, center_y), (center_x + int(g_x * 5), center_y + int(g_y * 5)), (0, 230, 118), 2)

        # C. Draw Telemetry Dashboard Box overlay (semi-transparent)
        hud_overlay = frame.copy()
        cv2.rectangle(hud_overlay, (10, 10), (320, 220), (20, 15, 10), -1)
        cv2.addWeighted(hud_overlay, 0.65, frame, 0.35, 0, frame)

        # Print stats in details inside Telemetry HUD Box
        cv2.putText(frame, "COGNITIVE SYNC // ATTN ENGINE", (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.line(frame, (20, 42), (310, 42), (255, 255, 255), 1)

        cv2.putText(frame, f"SCORE: {score:.1f}", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)
        cv2.putText(frame, f"STATE: {state.upper()}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

        if detected:
            bio = metrics["biometrics"]
            cv2.putText(frame, f"Yaw: {bio['yaw']:.1f}  Pitch: {bio['pitch']:.1f}  Roll: {bio['roll']:.1f}", (20, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(frame, f"EAR: {bio['ear']:.3f} (Eyes Closed: {bio['is_blinking']})", (20, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(frame, f"Gaze Offset: {bio['gaze_x']:.2f}, {bio['gaze_y']:.2f}", (20, 162), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)
        else:
            cv2.putText(frame, "FACE TRACKING LOSS", (20, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (68, 23, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, f"Time Away: {metrics['face_lost_duration']:.2f}s", (20, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (68, 23, 255), 1, cv2.LINE_AA)

        cv2.putText(frame, f"Latency: {latency_ms:.1f}ms", (20, 195), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 240, 255), 1, cv2.LINE_AA)

        # Draw Attention Score Bar
        cv2.rectangle(frame, (20, 205), (310, 212), (50, 50, 50), -1)
        bar_w = int((score / 100.0) * 290)
        cv2.rectangle(frame, (20, 205), (20 + bar_w, 212), color, -1)

        # D. Render Alert Message Text if distracted
        if state in ["Distracted", "High Risk"]:
            cv2.putText(frame, alert_text, (20, h - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2, cv2.LINE_AA)

        # 6. Render the frame
        cv2.imshow("CognitiveSync - Attention Engine", frame)

        # Listen for terminate key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    face_mesh.close()
    print("Camera pipeline stopped.")

def draw_lines_between_points(frame, landmarks, indices, color, thickness):
    """
    Helper function to draw lines connecting a list of mesh landmark indices.
    """
    h, w, c = frame.shape
    for i in range(len(indices) - 1):
        pt1 = landmarks[indices[i]]
        pt2 = landmarks[indices[i+1]]
        pos1 = (int(pt1.x * w), int(pt1.y * h))
        pos2 = (int(pt2.x * w), int(pt2.y * h))
        cv2.line(frame, pos1, pos2, color, thickness)

if __name__ == "__main__":
    main()
