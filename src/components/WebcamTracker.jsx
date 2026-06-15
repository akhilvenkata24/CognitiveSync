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
    const earRight = (
      Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y) +
      Math.hypot(landmarks[158].x - landmarks[144].x, landmarks[158].y - landmarks[144].y)
    ) / (2.0 * Math.hypot(landmarks[33].x - landmarks[133].x, landmarks[33].y - landmarks[133].y));

    const earLeft = (
      Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y) +
      Math.hypot(landmarks[385].x - landmarks[373].x, landmarks[385].y - landmarks[373].y)
    ) / (2.0 * Math.hypot(landmarks[362].x - landmarks[263].x, landmarks[362].y - landmarks[263].y));

    const ear = (earLeft + earRight) / 2;
    const isBlinking = ear < 0.18;

    // ==========================================
    // 3. Eye Gaze Deviation
    // ==========================================
    const irisL = landmarks[468];
    const irisR = landmarks[473];

    const eyeLOuter = landmarks[362];
    const eyeLInner = landmarks[263];
    const eyeROuter = landmarks[33];
    const eyeRInner = landmarks[133];

    const leftCenter = { x: (eyeLOuter.x + eyeLInner.x) / 2, y: (eyeLOuter.y + eyeLInner.y) / 2 };
    const rightCenter = { x: (eyeROuter.x + eyeRInner.x) / 2, y: (eyeROuter.y + eyeRInner.y) / 2 };

    const gazeXL = (irisL.x - leftCenter.x) * 450;
    const gazeYL = (irisL.y - leftCenter.y) * 450;
    const gazeXR = (irisR.x - rightCenter.x) * 450;
    const gazeYR = (irisR.y - rightCenter.y) * 450;

    const gazeX = (gazeXL + gazeXR) / 2;
    const gazeY = (gazeYL + gazeYR) / 2;

    // ==========================================
    // 4. State Decision & Attention Score Math
    // ==========================================
    const yawPenalty = Math.min(35, Math.abs(yaw) * 1.5);
    const pitchPenalty = Math.min(30, Math.abs(pitch) * 1.3);
    
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
          score = 5;
        }
      }
    } else {
      closedEyesStartRef.current = null;
    }

    let state = 'focused';
    if (fatigueState) {
      state = 'fatigued';
    } else if (score < 42) {
      state = 'distracted';
    } else if (score < 72) {
      state = 'normal';
    }

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
    // 5. Canvas Drawing (Futuristic Biometric Targeting Visor)
    // ==========================================
    const primaryColor = activeState === 'distracted' ? 'var(--color-distracted)' : (activeState === 'fatigued' ? 'var(--color-fatigued)' : 'var(--color-focused)');
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;

    // Draw high-tech HUD crosshairs
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 10, 0, 2 * Math.PI);
    ctx.moveTo(10, height / 2);
    ctx.lineTo(width - 10, height / 2);
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();

    // Draw horizontal scanning sweep line
    const sweepY = (height / 2) + Math.sin(Date.now() / 250) * (height / 2 - 15);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, sweepY);
    ctx.lineTo(width - 15, sweepY);
    ctx.stroke();

    // Draw a target box bracket around the nose (representing facial center)
    const nx = nose.x * width;
    const ny = nose.y * height;
    const boxSize = 100;
    
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.8;
    const bracketSize = 16;
    
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(nx - boxSize/2, ny - boxSize/2 + bracketSize);
    ctx.lineTo(nx - boxSize/2, ny - boxSize/2);
    ctx.lineTo(nx - boxSize/2 + bracketSize, ny - boxSize/2);
    ctx.stroke();
    
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(nx + boxSize/2 - bracketSize, ny - boxSize/2);
    ctx.lineTo(nx + boxSize/2, ny - boxSize/2);
    ctx.lineTo(nx + boxSize/2, ny - boxSize/2 + bracketSize);
    ctx.stroke();
    
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(nx - boxSize/2, ny + boxSize/2 - bracketSize);
    ctx.lineTo(nx - boxSize/2, ny + boxSize/2);
    ctx.lineTo(nx - boxSize/2 + bracketSize, ny + boxSize/2);
    ctx.stroke();
    
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(nx + boxSize/2 - bracketSize, ny + boxSize/2);
    ctx.lineTo(nx + boxSize/2, ny + boxSize/2);
    ctx.lineTo(nx + boxSize/2, ny + boxSize/2 - bracketSize);
    ctx.stroke();

    // Draw Pupil Lock Indicators
    ctx.fillStyle = 'var(--hud-accent)';
    ctx.shadowColor = 'var(--hud-accent)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(irisL.x * width, irisL.y * height, 3, 0, 2 * Math.PI);
    ctx.arc(irisR.x * width, irisR.y * height, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Gaze Vector Projection Line (Focal Line)
    const centerEyeX = ((irisL.x + irisR.x) / 2) * width;
    const centerEyeY = ((irisL.y + irisR.y) / 2) * height;
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(centerEyeX, centerEyeY);
    ctx.lineTo(centerEyeX + gazeX * 5.5, centerEyeY + gazeY * 5.5);
    ctx.stroke();

    // Draw HUD Digital Overlays on target lock
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 9px Share Tech Mono';
    ctx.textAlign = 'left';
    ctx.fillText("SYS: BIOMETRIC LOCK", nx - boxSize/2, ny - boxSize/2 - 12);
    ctx.fillText(`EAR: ${ear.toFixed(3)}`, nx - boxSize/2, ny + boxSize/2 + 15);
    ctx.textAlign = 'right';
    ctx.fillText(`STATE: ${activeState.toUpperCase()}`, nx + boxSize/2, ny - boxSize/2 - 12);
    ctx.fillText(`GAZE DEV: ${gazeDev.toFixed(1)}`, nx + boxSize/2, ny + boxSize/2 + 15);
  };

  return (
    <div className="panel-card" style={{ flex: '1 1 350px' }}>
      <div className="panel-title">
        <CameraIcon size={16} /> Operator Tracking HUD
      </div>
      
      {/* Centered Circular HUD Scanner Wrapper */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0.5rem 0' }}>
        <div style={{ 
          position: 'relative', 
          width: '180px', 
          height: '180px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          border: '2px solid var(--hud-accent)', 
          boxShadow: 'var(--hud-accent-glow)',
          background: '#010206'
        }}>
          <video 
            ref={videoRef} 
            className="webcam-video" 
            muted 
            playsInline
            style={{ display: trackingActive ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', transform: 'scaleX(-1)' }}
          />
          <canvas 
            ref={canvasRef} 
            className="webcam-canvas" 
            style={{ display: trackingActive ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, borderRadius: '50%', transform: 'scaleX(-1)' }}
          />

          {!trackingActive && !errorMsg && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5, 7, 15, 0.9)', gap: '0.5rem', padding: '0.8rem', textAlign: 'center'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--hud-bg-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hud-accent)',
                border: '1px solid var(--hud-accent)'
              }}>
                <CameraIcon size={18} />
              </div>
              <button 
                className="ack-button" 
                onClick={startTracking}
                style={{ background: 'var(--hud-accent)', color: '#000', fontSize: '0.65rem', padding: '0.3rem 0.8rem', boxShadow: 'none' }}
              >
                Start Stream
              </button>
            </div>
          )}

          {isModelLoading && trackingActive && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5, 7, 15, 0.85)', gap: '0.5rem'
            }}>
              <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--hud-accent)' }} />
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'var(--hud-accent)' }}>Calibrating...</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5, 7, 15, 0.95)', gap: '0.5rem', padding: '0.8rem', textAlign: 'center'
            }}>
              <div style={{ color: 'var(--color-distracted)' }}>
                <AlertTriangle size={24} />
              </div>
              <p style={{ fontSize: '0.55rem', color: 'var(--color-distracted)', lineHeight: '1.3' }}>Webcam Lock / In Use</p>
              <button 
                onClick={startTracking}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--color-distracted)',
                  fontSize: '0.6rem', padding: '0.2rem 0.6rem', cursor: 'pointer', borderRadius: '4px'
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        <span>Hardware: Standard Webcam</span>
        {trackingActive && (
          <button 
            onClick={stopTracking}
            style={{ background: 'none', border: 'none', color: 'var(--color-distracted)', cursor: 'pointer', fontFamily: 'var(--font-hud)', fontSize: '0.65rem' }}
          >
            Disable Stream
          </button>
        )}
      </div>
    </div>
  );
}
