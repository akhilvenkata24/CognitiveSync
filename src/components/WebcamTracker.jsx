import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, AlertTriangle, RefreshCw } from 'lucide-react';

export default function WebcamTracker({ onTelemetryUpdate, isSimulating, activeState }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const faceMeshInstanceRef = useRef(null);
  
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const closedEyesStartRef = useRef(null);

  // Stop tracking and clean up on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = async () => {
    setErrorMsg(null);
    setIsModelLoading(true);
    closedEyesStartRef.current = null;

    try {
      // 1. Ensure MediaPipe script loaded
      if (!window.FaceMesh || !window.Camera) {
        throw new Error("MediaPipe SDK scripts not loaded yet. Check internet connection.");
      }

      // 2. Initialize FaceMesh
      if (!faceMeshInstanceRef.current) {
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        faceMesh.onResults(handleResults);
        faceMeshInstanceRef.current = faceMesh;
      }

      // 3. Request webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          
          // 4. Start MediaPipe Camera
          if (videoRef.current) {
            const camera = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && faceMeshInstanceRef.current && !isSimulating) {
                  await faceMeshInstanceRef.current.send({ image: videoRef.current });
                }
              },
              width: 640,
              height: 480
            });
            camera.start();
            cameraInstanceRef.current = camera;
            setTrackingActive(true);
            setIsModelLoading(false);
          }
        };
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to access webcam or initialize tracking.");
      setIsModelLoading(false);
      setTrackingActive(false);
    }
  };

  const stopTracking = () => {
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setTrackingActive(false);
    closedEyesStartRef.current = null;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Processing results from MediaPipe
  const handleResults = (results) => {
    if (isSimulating || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = videoRef.current.videoWidth;
    const height = canvas.height = videoRef.current.videoHeight;

    ctx.clearRect(0, 0, width, height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // Draw "No Operator Detected" HUD Warning on canvas
      ctx.fillStyle = "rgba(255, 23, 68, 0.15)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 20px Orbitron";
      ctx.textAlign = "center";
      ctx.fillText("OPERATOR LOSS DETECTED", width / 2, height / 2);
      ctx.font = "12px Inter";
      ctx.fillText("Please position yourself in front of the camera", width / 2, height / 2 + 25);
      
      // Update parent with distraction score
      onTelemetryUpdate({
        detected: false,
        attentionScore: 0,
        state: 'distracted',
        yaw: 0,
        pitch: 0,
        roll: 0,
        ear: 0,
        gazeX: 0,
        gazeY: 0,
        isBlinking: false
      });
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // ==========================================
    // 1. Math Computations for Head Pose
    // ==========================================
    const nose = landmarks[1];
    const eyeL = landmarks[33];   // Right side of image, left side of face
    const eyeR = landmarks[263];  // Left side of image, right side of face
    const mouthL = landmarks[61];
    const mouthR = landmarks[291];
    const chin = landmarks[152];

    // Estimate Yaw (Horizontal look angle)
    const distNoseToEyeL = Math.hypot(nose.x - eyeL.x, nose.y - eyeL.y);
    const distNoseToEyeR = Math.hypot(nose.x - eyeR.x, nose.y - eyeR.y);
    const yaw = (distNoseToEyeL / distNoseToEyeR - 1.0) * 120; // Deg approximation

    // Estimate Pitch (Vertical tilt angle)
    const eyeMidpoint = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };
    const mouthMidpoint = { x: (mouthL.x + mouthR.x) / 2, y: (mouthL.y + mouthR.y) / 2 };
    const distNoseToEyes = Math.hypot(nose.x - eyeMidpoint.x, nose.y - eyeMidpoint.y);
    const distNoseToMouth = Math.hypot(nose.x - mouthMidpoint.x, nose.y - mouthMidpoint.y);
    const expectedRatio = 0.85; // Calibrated ratio when looking straight
    const pitch = (distNoseToEyes / distNoseToMouth - expectedRatio) * 180;

    // Estimate Roll (Side rotation)
    const roll = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * (180 / Math.PI);

    // ==========================================
    // 2. Math Computations for Eye Aspect Ratio (EAR)
    // ==========================================
    // Right Eye vertical distances: 159-145, 158-144. Width: 33-133
    const earRight = (
      Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y) +
      Math.hypot(landmarks[158].x - landmarks[144].x, landmarks[158].y - landmarks[144].y)
    ) / (2.0 * Math.hypot(landmarks[33].x - landmarks[133].x, landmarks[33].y - landmarks[133].y));

    // Left Eye vertical distances: 386-374, 385-373. Width: 362-263
    const earLeft = (
      Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y) +
      Math.hypot(landmarks[385].x - landmarks[373].x, landmarks[385].y - landmarks[373].y)
    ) / (2.0 * Math.hypot(landmarks[362].x - landmarks[263].x, landmarks[362].y - landmarks[263].y));

    const ear = (earLeft + earRight) / 2;
    const isBlinking = ear < 0.18;

    // ==========================================
    // 3. Eye Gaze Deviation
    // ==========================================
    // Iris landmarks: Left 468 (Center), Right 473 (Center)
    const irisL = landmarks[468];
    const irisR = landmarks[473];

    // Compute eyes midpoints
    const eyeLOuter = landmarks[362];
    const eyeLInner = landmarks[263];
    const eyeROuter = landmarks[33];
    const eyeRInner = landmarks[133];

    const leftCenter = { x: (eyeLOuter.x + eyeLInner.x) / 2, y: (eyeLOuter.y + eyeLInner.y) / 2 };
    const rightCenter = { x: (eyeROuter.x + eyeRInner.x) / 2, y: (eyeROuter.y + eyeRInner.y) / 2 };

    // Shift offsets (relative gaze)
    const gazeXL = (irisL.x - leftCenter.x) * 450;
    const gazeYL = (irisL.y - leftCenter.y) * 450;
    const gazeXR = (irisR.x - rightCenter.x) * 450;
    const gazeYR = (irisR.y - rightCenter.y) * 450;

    const gazeX = (gazeXL + gazeXR) / 2;
    const gazeY = (gazeYL + gazeYR) / 2;

    // ==========================================
    // 4. State Decision & Attention Score Math
    // ==========================================
    // Calculate penalties
    const yawPenalty = Math.min(35, Math.abs(yaw) * 1.5);
    const pitchPenalty = Math.min(30, Math.abs(pitch) * 1.3);
    
    // Gaze offset from center penalty (normal variance is within -12 to +12)
    const gazeDev = Math.hypot(gazeX, gazeY);
    const gazePenalty = gazeDev > 10 ? Math.min(30, (gazeDev - 10) * 1.8) : 0;

    let score = Math.max(0, 100 - (yawPenalty + pitchPenalty + gazePenalty));

    // Handle Fatigue / Eyes Closed (Micro-sleep) timer
    let fatigueState = false;
    if (isBlinking) {
      if (!closedEyesStartRef.current) {
        closedEyesStartRef.current = Date.now();
      } else {
        const closedDuration = (Date.now() - closedEyesStartRef.current) / 1000;
        if (closedDuration > 1.3) {
          fatigueState = true;
          score = 5; // Force drop attention score
        }
      }
    } else {
      closedEyesStartRef.current = null;
    }

    // Classify operator cognitive state based on score
    let state = 'focused';
    if (fatigueState) {
      state = 'fatigued';
    } else if (score < 42) {
      state = 'distracted';
    } else if (score < 72) {
      state = 'normal';
    }

    // Call parent updater
    onTelemetryUpdate({
      detected: true,
      attentionScore: Math.round(score),
      state,
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
      ear: parseFloat(ear.toFixed(3)),
      gazeX: parseFloat(gazeX.toFixed(2)),
      gazeY: parseFloat(gazeY.toFixed(2)),
      isBlinking
    });

    // ==========================================
    // 5. Canvas Drawing (Futuristic Cyber Wireframe)
    // ==========================================
    ctx.strokeStyle = activeState === 'distracted' ? '#ff1744' : (activeState === 'fatigued' ? '#d500f9' : '#00e5ff');
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;

    // Draw Face Mesh lines (Subset for performance & aesthetics)
    // Connect face outline landmarks
    const faceOutlineIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 
      400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 
      54, 103, 67, 109
    ];
    
    ctx.beginPath();
    ctx.moveTo(landmarks[faceOutlineIndices[0]].x * width, landmarks[faceOutlineIndices[0]].y * height);
    for (let i = 1; i < faceOutlineIndices.length; i++) {
      ctx.lineTo(landmarks[faceOutlineIndices[i]].x * width, landmarks[faceOutlineIndices[i]].y * height);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw Eyes Contours & Iris Indicators
    const drawContour = (indices) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[indices[0]].x * width, landmarks[indices[0]].y * height);
      for (let i = 1; i < indices.length; i++) {
        ctx.lineTo(landmarks[indices[i]].x * width, landmarks[indices[i]].y * height);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const rightEyeIndices = [33, 160, 158, 133, 153, 144];
    const leftEyeIndices = [362, 385, 387, 263, 373, 380];
    drawContour(rightEyeIndices);
    drawContour(leftEyeIndices);

    // Draw Pupils (Iris)
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(irisL.x * width, irisL.y * height, 2.5, 0, 2 * Math.PI);
    ctx.arc(irisR.x * width, irisR.y * height, 2.5, 0, 2 * Math.PI);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Gaze Vector Projection Line
    const centerEyeX = (irisL.x + irisR.x) / 2 * width;
    const centerEyeY = (irisL.y + irisR.y) / 2 * height;
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerEyeX, centerEyeY);
    // Project vector based on gaze deviation
    ctx.lineTo(centerEyeX + gazeX * 5, centerEyeY + gazeY * 5);
    ctx.stroke();

    // Draw nose & mouth crosshairs (sleek military/HUD look)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(nose.x * width, nose.y * height, 8, 0, 2 * Math.PI);
    ctx.moveTo(nose.x * width - 12, nose.y * height);
    ctx.lineTo(nose.x * width + 12, nose.y * height);
    ctx.moveTo(nose.x * width, nose.y * height - 12);
    ctx.lineTo(nose.x * width, nose.y * height + 12);
    ctx.stroke();
  };

  return (
    <div className="panel-card" style={{ flex: '1 1 350px' }}>
      <div className="panel-title">
        <CameraIcon size={16} /> Operator Tracking HUD
      </div>
      
      <div className="webcam-wrapper">
        <video 
          ref={videoRef} 
          className="webcam-video" 
          muted 
          playsInline
          style={{ display: trackingActive ? 'block' : 'none' }}
        />
        <canvas 
          ref={canvasRef} 
          className="webcam-canvas" 
          style={{ display: trackingActive ? 'block' : 'none' }}
        />

        {!trackingActive && !errorMsg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 7, 15, 0.9)', gap: '1rem', padding: '1rem', textAlign: 'center'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', background: 'var(--hud-bg-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hud-accent)',
              border: '1px solid var(--hud-accent)', boxShadow: 'var(--hud-accent-glow)'
            }}>
              <CameraIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Camera Stream Off</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Initialize computer vision tracking stream</p>
            </div>
            <button 
              className="ack-button" 
              onClick={startTracking}
              style={{ background: 'var(--hud-accent)', color: '#000', fontSize: '0.75rem', padding: '0.5rem 1.5rem', boxShadow: 'none' }}
            >
              Start Sensor Stream
            </button>
          </div>
        )}

        {isModelLoading && trackingActive && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 7, 15, 0.85)', gap: '0.75rem'
          }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--hud-accent)' }} />
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: 'var(--hud-accent)' }}>Calibrating Eye Tracking...</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 7, 15, 0.95)', gap: '1rem', padding: '2rem', textAlign: 'center'
          }}>
            <div style={{ color: 'var(--color-distracted)' }}>
              <AlertTriangle size={36} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'var(--font-hud)', marginBottom: '0.25rem' }}>Hardware Stream Failure</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-distracted)', lineHeight: '1.4' }}>{errorMsg}</p>
            </div>
            <button 
              onClick={startTracking}
              style={{
                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--color-distracted)',
                fontSize: '0.75rem', padding: '0.4rem 1.2rem', cursor: 'pointer', borderRadius: '4px'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Hardware: Standard Webcam</span>
        {trackingActive && (
          <button 
            onClick={stopTracking}
            style={{ background: 'none', border: 'none', color: 'var(--color-distracted)', cursor: 'pointer', fontFamily: 'var(--font-hud)', fontSize: '0.7rem' }}
          >
            Disable Stream
          </button>
        )}
      </div>
    </div>
  );
}
