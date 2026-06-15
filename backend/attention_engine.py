"""
CognitiveSync Attention Engine
==============================
This module implements a production-ready real-time operator attention calculator.
Inputs:
- Face mesh landmarks containing eyes, iris, and head coordinates.

Outputs:
- Focus Score (0-100)
- Focus State ("Focused", "Normal", "Distracted", "High Risk")

Performance Optimizations:
- Vectorized operations using NumPy.
- Exponential Moving Average (EMA) smoothing to reduce high-frequency frame jitter.
"""

import time
import numpy as np

class AttentionEngine:
    def __init__(
        self,
        ema_alpha: float = 0.15,       # Smoothing weight (higher = faster response, lower = smoother)
        max_yaw: float = 35.0,         # Maximum allowable yaw angle (degrees)
        max_pitch: float = 25.0,       # Maximum allowable pitch angle (degrees)
        max_roll: float = 30.0,        # Maximum allowable roll angle (degrees)
        max_gaze_offset: float = 0.12,  # Maximum expected pupil deflection
        ear_threshold: float = 0.18,   # Eye Aspect Ratio threshold for closed eyes
        fatigue_timeout: float = 1.3,  # Seconds of eye closure before marking High Risk
        face_loss_timeout: float = 2.0  # Seconds of face loss before marking High Risk
    ):
        self.ema_alpha = ema_alpha
        self.max_yaw = max_yaw
        self.max_pitch = max_pitch
        self.max_roll = max_roll
        self.max_gaze_offset = max_gaze_offset
        self.ear_threshold = ear_threshold
        self.fatigue_timeout = fatigue_timeout
        self.face_loss_timeout = face_loss_timeout

        # State Variables
        self.smoothed_score = 100.0
        self.last_state = "Focused"
        self.closed_eyes_start = None
        self.face_loss_start = None
        self.last_update_time = None

    def calculate_ear(self, landmarks) -> float:
        """
        Calculates Eye Aspect Ratio (EAR) using Euclidean distances.
        Formula: EAR = (||p_top1 - p_bottom1|| + ||p_top2 - p_bottom2||) / (2 * ||p_left - p_right||)
        """
        # Right Eye landmarks: Vertical (159, 145) and (158, 144). Horizontal (33, 133).
        p159 = np.array([landmarks[159].x, landmarks[159].y, landmarks[159].z])
        p145 = np.array([landmarks[145].x, landmarks[145].y, landmarks[145].z])
        p158 = np.array([landmarks[158].x, landmarks[158].y, landmarks[158].z])
        p144 = np.array([landmarks[144].x, landmarks[144].y, landmarks[144].z])
        p33 = np.array([landmarks[33].x, landmarks[33].y, landmarks[33].z])
        p133 = np.array([landmarks[133].x, landmarks[133].y, landmarks[133].z])

        ear_right = (
            np.linalg.norm(p159 - p145) + np.linalg.norm(p158 - p144)
        ) / (2.0 * np.linalg.norm(p33 - p133))

        # Left Eye landmarks: Vertical (386, 374) and (385, 373). Horizontal (362, 263).
        p386 = np.array([landmarks[386].x, landmarks[386].y, landmarks[386].z])
        p374 = np.array([landmarks[374].x, landmarks[374].y, landmarks[374].z])
        p385 = np.array([landmarks[385].x, landmarks[385].y, landmarks[385].z])
        p373 = np.array([landmarks[373].x, landmarks[373].y, landmarks[373].z])
        p362 = np.array([landmarks[362].x, landmarks[362].y, landmarks[362].z])
        p263 = np.array([landmarks[263].x, landmarks[263].y, landmarks[263].z])

        ear_left = (
            np.linalg.norm(p386 - p374) + np.linalg.norm(p385 - p373)
        ) / (2.0 * np.linalg.norm(p362 - p263))

        return float((ear_left + ear_right) / 2.0)

    def calculate_head_pose(self, landmarks):
        """
        Estimates Yaw, Pitch, and Roll angles based on face landmark proportions.
        Optimized to bypass SolvePnP for low-latency client/server communication.
        """
        nose = np.array([landmarks[1].x, landmarks[1].y, landmarks[1].z])
        eye_l = np.array([landmarks[33].x, landmarks[33].y, landmarks[33].z])
        eye_r = np.array([landmarks[263].x, landmarks[263].y, landmarks[263].z])
        mouth_l = np.array([landmarks[61].x, landmarks[61].y, landmarks[61].z])
        mouth_r = np.array([landmarks[291].x, landmarks[291].y, landmarks[291].z])

        # Yaw (horizontal look direction)
        dist_l = np.linalg.norm(nose - eye_l)
        dist_r = np.linalg.norm(nose - eye_r)
        yaw = (dist_l / dist_r - 1.0) * 120.0  # Normalized deviation multiplier

        # Pitch (vertical look direction)
        eye_mid = (eye_l + eye_r) / 2.0
        mouth_mid = (mouth_l + mouth_r) / 2.0
        dist_eyes = np.linalg.norm(nose - eye_mid)
        dist_mouth = np.linalg.norm(nose - mouth_mid)
        expected_ratio = 0.85
        pitch = (dist_eyes / dist_mouth - expected_ratio) * 180.0

        # Roll (head tilt side-to-side)
        delta_y = eye_r[1] - eye_l[1]
        delta_x = eye_r[0] - eye_l[0]
        roll = np.degrees(np.arctan2(delta_y, delta_x))

        return float(yaw), float(pitch), float(roll)

    def calculate_gaze_offset(self, landmarks):
        """
        Measures center deviation of left/right pupil relative to the eye bounding box.
        """
        iris_l = np.array([landmarks[468].x, landmarks[468].y])
        iris_r = np.array([landmarks[473].x, landmarks[473].y])

        eye_l_out = np.array([landmarks[362].x, landmarks[362].y])
        eye_l_in = np.array([landmarks[263].x, landmarks[263].y])
        eye_r_out = np.array([landmarks[33].x, landmarks[33].y])
        eye_r_in = np.array([landmarks[133].x, landmarks[133].y])

        left_center = (eye_l_out + eye_l_in) / 2.0
        right_center = (eye_r_out + eye_r_in) / 2.0

        # Calculate coordinate difference offset
        offset_l = iris_l - left_center
        offset_r = iris_r - right_center

        # Normalized coordinates relative to eye shape
        gaze_x = (offset_l[0] + offset_r[0]) / 2.0 * 450.0
        gaze_y = (offset_l[1] + offset_r[1]) / 2.0 * 450.0

        return float(gaze_x), float(gaze_y)

    def update(self, landmarks, current_time: float):
        """
        Primary update method when a face is detected.
        Calculates score and state using biometric measurements and EMA smoothing.
        """
        self.face_loss_start = None  # Reset face loss timer
        self.last_update_time = current_time

        # 1. Compute Biometrics
        yaw, pitch, roll = self.calculate_head_pose(landmarks)
        ear = self.calculate_ear(landmarks)
        gaze_x, gaze_y = self.calculate_gaze_offset(landmarks)

        # 2. Check Eye Closure (Fatigue/Micro-sleep)
        is_blinking = ear < self.ear_threshold
        fatigue_state = False
        
        if is_blinking:
            if self.closed_eyes_start is None:
                self.closed_eyes_start = current_time
            else:
                closed_duration = current_time - self.closed_eyes_start
                if closed_duration >= self.fatigue_timeout:
                    fatigue_state = True
        else:
            self.closed_eyes_start = None

        # 3. Compute Attention Penalties
        # Quadratic penalty increases faster at large angles
        yaw_penalty = min(35.0, (abs(yaw) / self.max_yaw) ** 2 * 35.0)
        pitch_penalty = min(30.0, (abs(pitch) / self.max_pitch) ** 2 * 30.0)
        
        # Gaze penalty: normal variance within center radius of 10 units
        gaze_dev = np.hypot(gaze_x, gaze_y)
        gaze_penalty = 0.0
        if gaze_dev > 10.0:
            gaze_penalty = min(35.0, ((gaze_dev - 10.0) / (self.max_gaze_offset * 100)) ** 2 * 35.0)

        # Raw score combination
        raw_score = max(0.0, 100.0 - (yaw_penalty + pitch_penalty + gaze_penalty))

        # Force score drop to 0 if micro-sleep detected
        if fatigue_state:
            raw_score = 0.0

        # 4. Temporal Smoothing (EMA)
        self.smoothed_score = (self.ema_alpha * raw_score) + ((1.0 - self.ema_alpha) * self.smoothed_score)

        # 5. Classify Focus State
        if fatigue_state:
            state = "High Risk"
        elif self.smoothed_score < 42.0:
            state = "Distracted"
        elif self.smoothed_score < 72.0:
            state = "Normal"
        else:
            state = "Focused"

        self.last_state = state

        return {
            "detected": True,
            "attention_score": round(self.smoothed_score, 1),
            "state": state,
            "biometrics": {
                "yaw": round(yaw, 1),
                "pitch": round(pitch, 1),
                "roll": round(roll, 1),
                "ear": round(ear, 3),
                "gaze_x": round(gaze_x, 2),
                "gaze_y": round(gaze_y, 2),
                "is_blinking": is_blinking
            }
        }

    def update_face_lost(self, current_time: float):
        """
        Update method when face tracking is lost.
        Decays score exponentially and raises warning after time limit.
        """
        self.closed_eyes_start = None  # Reset eyes closed timer
        self.last_update_time = current_time

        if self.face_loss_start is None:
            self.face_loss_start = current_time
            time_lost = 0.0
        else:
            time_lost = current_time - self.face_loss_start

        # Exponential decay of focus score: S(t) = S_last * e^(-1.5 * t)
        decay_factor = np.exp(-1.5 * time_lost)
        self.smoothed_score = max(0.0, self.smoothed_score * decay_factor)

        # Classify state
        if time_lost >= self.face_loss_timeout:
            state = "High Risk"
        else:
            state = "Distracted"

        self.last_state = state

        return {
            "detected": False,
            "attention_score": round(self.smoothed_score, 1),
            "state": state,
            "face_lost_duration": round(time_lost, 2)
        }
