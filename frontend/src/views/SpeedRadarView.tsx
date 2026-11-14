import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeroBand } from '../components/HeroBand';
import { radarApi } from '../api/services';
import type { RadarCamera, RadarCitation, FrameOCRResult } from '../types';
import {
  Camera, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2,
  Receipt, Zap, Cpu, Scan, Play, Square, Video, Upload, Film
} from 'lucide-react';

export const SpeedRadarView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  // Cameras & Sensor State
  const [cameras, setCameras] = useState<RadarCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number>(1);
  const [loadingCameras, setLoadingCameras] = useState<boolean>(true);

  // Sensor Calibration
  const [calibratedDistance, setCalibratedDistance] = useState<number>(15.0); // meters
  const [gate1Pct, setGate1Pct] = useState<number>(30); // Entry gate % from top
  const [gate2Pct, setGate2Pct] = useState<number>(70); // Exit gate % from top

  // Video Feed & Hardware State
  // REAL_OVERHEAD is a genuine overhead/drone-angle highway clip (cars cross the frame top-to-bottom,
  // matching the fixed-camera gate-crossing assumption the speed math depends on).
  // REAL_CLOSEUP is genuine filmed footage of an Indian vehicle, used for plate OCR sampling only.
  // SYNTHETIC_CALIBRATED is an OpenCV-rendered clip used only to demonstrate the gate-crossing math on a known ground-truth speed.
  type FeedSourceMode = 'REAL_OVERHEAD' | 'REAL_CLOSEUP' | 'SYNTHETIC_CALIBRATED' | 'UPLOAD_FILE' | 'WEBCAM';
  const [feedMode, setFeedMode] = useState<FeedSourceMode>('REAL_OVERHEAD');
  const FEED_LABELS: Record<FeedSourceMode, string> = {
    REAL_OVERHEAD: 'Real Overhead Highway Traffic (Drone/CCTV Angle)',
    REAL_CLOSEUP: 'Real Indian Vehicle Close-up (Plate OCR Sample)',
    SYNTHETIC_CALIBRATED: 'Synthetic Calibration Clip (Known Ground-Truth Speed)',
    UPLOAD_FILE: 'Uploaded Custom Video File',
    WEBCAM: 'Live Webcam / USB Camera'
  };
  const [feedActive, setFeedActive] = useState<boolean>(false);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [webcamError, setWebcamError] = useState<string>('');
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number }>({ width: 640, height: 480 });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [batchAnalysisLoading, setBatchAnalysisLoading] = useState<boolean>(false);
  const [batchReport, setBatchReport] = useState<any | null>(null);

  // Kinematic Velocity Telemetry
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [deltaSec, setDeltaSec] = useState<number>(0.62);
  const [motionState, setMotionState] = useState<'IDLE' | 'GATE1_ACTIVE' | 'MEASURED'>('IDLE');
  const [activeCitation, setActiveCitation] = useState<RadarCitation | null>(null);
  const [citationsLog, setCitationsLog] = useState<RadarCitation[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Optical Plate OCR State
  const [currentPlate, setCurrentPlate] = useState<string>('MH02BE1001');
  const [ocrConfidence, setOcrConfidence] = useState<number>(97.5);
  const [ocrResult, setOcrResult] = useState<FrameOCRResult | null>(null);
  const [scanningPlate, setScanningPlate] = useState<boolean>(false);
  const [autoOcrOnTransit, setAutoOcrOnTransit] = useState<boolean>(true);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gate1TimestampRef = useRef<number | null>(null);
  const lastTransitTimestampRef = useRef<number>(0);
  const prevFrameDataRef = useRef<ImageData | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active camera details
  const activeCamera = cameras.find((c) => c.camera_id === selectedCameraId) || cameras[0] || {
    camera_id: 1,
    camera_code: 'CAM-SYS-001',
    road_name: 'BKC Express Highway',
    speed_limit_kmh: 60,
    zone_name: 'South Mumbai Central',
    calibrated_distance_meters: 15.0,
    status: 'ACTIVE'
  };

  const speedLimit = activeCamera.speed_limit_kmh || 60;

  // Load camera nodes from backend
  useEffect(() => {
    const fetchCameras = async () => {
      setLoadingCameras(true);
      try {
        const data = await radarApi.getCameras();
        if (data && data.length > 0) {
          setCameras(data);
          setSelectedCameraId(data[0].camera_id);
          if (data[0].calibrated_distance_meters) {
            setCalibratedDistance(data[0].calibrated_distance_meters);
          }
        }
      } catch (err) {
        console.error('Failed to load radar cameras:', err);
      } finally {
        setLoadingCameras(false);
      }
    };
    fetchCameras();
  }, []);

  // Enumerate Video Input Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devList.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch {
        // Fallback if permission not yet granted
      }
    };
    getDevices();
  }, [webcamActive, selectedDeviceId]);

  // Start Webcam Stream
  const startWebcam = useCallback(async () => {
    setWebcamError('');
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setStreamResolution({
              width: videoRef.current.videoWidth || 640,
              height: videoRef.current.videoHeight || 480
            });
          }
        };
      }
      setWebcamActive(true);
      setFeedActive(true);
    } catch (err: any) {
      console.error('Webcam error:', err);
      setWebcamError(err.message || 'Could not access camera. Please check browser permissions.');
      setWebcamActive(false);
      setFeedActive(false);
    }
  }, [selectedDeviceId]);

  // Start Feed (Webcam, Pre-bundled Demo Video, or Uploaded Clip)
  const startFeed = useCallback(async () => {
    setWebcamError('');
    if (feedMode === 'WEBCAM') {
      await startWebcam();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.srcObject) {
      const s = video.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }

    let videoSrc = '/videos/overhead_highway_traffic.mp4';
    if (feedMode === 'REAL_CLOSEUP') {
      videoSrc = '/videos/indian_traffic_real.mp4';
    } else if (feedMode === 'SYNTHETIC_CALIBRATED') {
      videoSrc = '/videos/traffic_highway_demo.mp4';
    } else if (feedMode === 'UPLOAD_FILE') {
      if (!uploadedVideoUrl) {
        fileInputRef.current?.click();
        return;
      }
      videoSrc = uploadedVideoUrl;
    }

    video.src = videoSrc;
    video.loop = true;
    video.muted = true;
    try {
      await video.play();
      setFeedActive(true);
      setWebcamActive(false);
    } catch (err: any) {
      console.error('Failed to play video feed:', err);
      setWebcamError('Failed to play video feed. Please try another video file.');
      setFeedActive(false);
    }
  }, [feedMode, startWebcam, uploadedVideoUrl]);

  // Stop Feed Stream
  const stopFeed = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
      video.pause();
    }
    setFeedActive(false);
    setWebcamActive(false);
    setMotionState('IDLE');
    gate1TimestampRef.current = null;
  }, []);

  // Capture current video/webcam frame as base64 JPEG
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !feedActive || video.readyState < 2) return null;

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [feedActive]);

  // Trigger Automatic Citation in Backend (ACID Transaction)
  const triggerSpeedCitation = useCallback(async (
    plate: string,
    speed: number,
    elapsedSec: number,
    snapshotB64?: string
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const citation = await radarApi.submitRadarEvent({
        camera_id: activeCamera.camera_id,
        license_plate: plate,
        observed_speed: speed,
        speed_limit: speedLimit,
        delta_meters: calibratedDistance,
        delta_time_sec: elapsedSec,
        fps: 30,
        ai_confidence: ocrConfidence,
        image_snapshot_b64: snapshotB64
      });

      setActiveCitation(citation);
      setCitationsLog((prev) => [citation, ...prev.slice(0, 19)]);
    } catch (err) {
      console.error('Failed to submit radar event:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [activeCamera.camera_id, calibratedDistance, isProcessing, ocrConfidence, speedLimit]);

  // Optical OCR Trigger via Video/Webcam Frame
  const runFrameOcr = useCallback(async () => {
    const frameB64 = captureFrame();
    if (!frameB64) {
      alert('Live video or camera feed not active. Please start feed first.');
      return;
    }

    setScanningPlate(true);
    try {
      const result = await radarApi.processFrameBase64(frameB64, activeCamera.camera_id);
      setOcrResult(result);
      if (result.plate_text) {
        setCurrentPlate(result.plate_text);
        setOcrConfidence(result.confidence);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      setScanningPlate(false);
    }
  }, [activeCamera.camera_id, captureFrame]);

  // Computer Vision Motion Detection & Speed Calculation on Live Feed (Webcam or Video)
  useEffect(() => {
    if (!feedActive) return;

    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Small analysis buffer for optical motion differencing
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = 160;
    diffCanvas.height = 120;
    const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });

    let activeLoop = true;

    const processMotionFrame = () => {
      if (!activeLoop) return;
      const video = videoRef.current;

      if (video && video.readyState >= 2 && diffCtx) {
        const w = overlayCanvas.width;
        const h = overlayCanvas.height;

        // Clear overlay
        ctx.clearRect(0, 0, w, h);

        // 1. Draw Gate 1 (Entry Line - Luminous Green)
        const line1Y = (h * gate1Pct) / 100;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(20, line1Y);
        ctx.lineTo(w - 20, line1Y);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`GATE 1 (ENTRY) — t₁ [${gate1Pct}%]`, 24, line1Y - 8);

        // 2. Draw Gate 2 (Exit Line - Coral Red)
        const line2Y = (h * gate2Pct) / 100;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, line2Y);
        ctx.lineTo(w - 20, line2Y);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillText(`GATE 2 (EXIT) — t₂ [${gate2Pct}%]`, 24, line2Y - 8);
        ctx.setLineDash([]); // Reset dash

        // Calibrated Zone Bracket
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 30, line1Y, 15, line2Y - line1Y);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`${calibratedDistance.toFixed(1)}m`, w - 75, (line1Y + line2Y) / 2);

        // Optical Differencing for Motion
        diffCtx.drawImage(video, 0, 0, diffCanvas.width, diffCanvas.height);
        const currFrame = diffCtx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);

        if (prevFrameDataRef.current) {
          const prev = prevFrameDataRef.current.data;
          const curr = currFrame.data;

          // Check motion intensity in Gate 1 band (scaled down)
          const g1Norm = (diffCanvas.height * gate1Pct) / 100;
          const g2Norm = (diffCanvas.height * gate2Pct) / 100;

          let g1Motion = 0;
          let g2Motion = 0;

          const bandRadius = 6;
          for (let y = 0; y < diffCanvas.height; y++) {
            for (let x = 0; x < diffCanvas.width; x += 4) {
              const idx = (y * diffCanvas.width + x) * 4;
              const diff = Math.abs(curr[idx] - prev[idx]) + Math.abs(curr[idx + 1] - prev[idx + 1]) + Math.abs(curr[idx + 2] - prev[idx + 2]);

              if (diff > 80) {
                if (Math.abs(y - g1Norm) < bandRadius) g1Motion++;
                if (Math.abs(y - g2Norm) < bandRadius) g2Motion++;
              }
            }
          }

          const nowMs = performance.now();

          // Gate 1 Crossed
          if (g1Motion > 20 && gate1TimestampRef.current === null) {
            gate1TimestampRef.current = nowMs;
            setMotionState('GATE1_ACTIVE');
          }

          // Gate 2 Crossed after Gate 1
          if (g2Motion > 20 && gate1TimestampRef.current !== null && nowMs - gate1TimestampRef.current > 150) {
            // Debounce cooldown so the same car doesn't trigger repeatedly
            if (nowMs - lastTransitTimestampRef.current > 2000) {
              lastTransitTimestampRef.current = nowMs;
              const elapsedSeconds = (nowMs - gate1TimestampRef.current) / 1000;
              gate1TimestampRef.current = null;
              setDeltaSec(elapsedSeconds);

              // Kinematic Speed Calculation: v = (d / t) * 3.6
              const speedMps = calibratedDistance / elapsedSeconds;
              const speedKmh = Math.min(180, Math.max(15, speedMps * 3.6));
              setCurrentSpeed(speedKmh);
              setMotionState('MEASURED');

              // Snapshot frame and execute OCR & ACID fining
              const frameSnap = captureFrame() || undefined;

              if (autoOcrOnTransit && frameSnap) {
                setScanningPlate(true);
                radarApi.processFrameBase64(frameSnap, activeCamera.camera_id)
                  .then((res) => {
                    setOcrResult(res);
                    const targetPlate = res.plate_text || currentPlate;
                    setCurrentPlate(targetPlate);
                    if (res.confidence) setOcrConfidence(res.confidence);
                    triggerSpeedCitation(targetPlate, speedKmh, elapsedSeconds, frameSnap);
                  })
                  .catch((err) => {
                    console.error('Auto OCR transit error:', err);
                    triggerSpeedCitation(currentPlate, speedKmh, elapsedSeconds, frameSnap);
                  })
                  .finally(() => {
                    setScanningPlate(false);
                  });
              } else {
                triggerSpeedCitation(currentPlate, speedKmh, elapsedSeconds, frameSnap);
              }
            }
          }
        }

        prevFrameDataRef.current = currFrame;
      }

      animFrameIdRef.current = requestAnimationFrame(processMotionFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processMotionFrame);

    return () => {
      activeLoop = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [feedActive, gate1Pct, gate2Pct, calibratedDistance, autoOcrOnTransit, captureFrame, currentPlate, triggerSpeedCitation, activeCamera.camera_id]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopFeed();
    };
  }, [stopFeed]);

  // Manual Trigger helper for physical desktop demonstration
  const handleManualTransitTrigger = (simulatedSpeedKm: number) => {
    setCurrentSpeed(simulatedSpeedKm);
    const calculatedSec = calibratedDistance / (simulatedSpeedKm / 3.6);
    setDeltaSec(calculatedSec);
    setMotionState('MEASURED');

    const snap = captureFrame() || undefined;
    if (autoOcrOnTransit && snap) {
      runFrameOcr();
    }
    triggerSpeedCitation(currentPlate, simulatedSpeedKm, calculatedSec, snap);
  };

  const isCurrentSpeeding = currentSpeed > speedLimit;
  const speedDelta = Math.max(0, currentSpeed - speedLimit);

  return (
    <div>
      <HeroBand
        badge="Live Optical Surveillance Telemetry"
        title="Webcam ANPR Speed Radar & Automated Citation Engine"
        subtitle="Real-time webcam video feed ingestion, dual-gate optical velocity tracking (v = Δd/Δt × 3.6), and instantaneous statutory fine generation."
      />

      {/* Hidden processing canvas */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* 1. Camera Node & Calibration Control Band */}
      <div className="filter-band">
        <div className="filter-band-header">
          <div className="filter-band-title">
            <Camera size={16} color="var(--colors-primary)" />
            <span>Surveillance Hardware & Dual-Gate Radar Calibration</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: feedActive ? '#059669' : '#d97706',
                background: feedActive ? '#ecfdf5' : '#fef3c7',
                padding: '4px 10px',
                borderRadius: '4px'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: feedActive ? '#10b981' : '#f59e0b',
                  animation: feedActive ? 'pulse 1.5s infinite' : 'none'
                }}
              />
              {feedActive
                ? (feedMode === 'WEBCAM' ? `Live Webcam (${streamResolution.width}x${streamResolution.height})` : 'Demo Video Active (30 FPS)')
                : 'Feed Standby'}
            </span>

            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                padding: '4px 12px',
                background: 'var(--colors-primary-deep)',
                color: '#ffffff',
                borderRadius: '4px'
              }}
            >
              Corridor Limit: {speedLimit} km/h
            </span>
          </div>
        </div>

        <div className="filter-fields-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {/* Surveillance Camera Node */}
          <div className="filter-field">
            <label className="filter-label">Associated Enforcement Node</label>
            <select
              className="filter-select"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(Number(e.target.value))}
              disabled={loadingCameras}
            >
              {cameras.map((c) => (
                <option key={c.camera_id} value={c.camera_id}>
                  {c.camera_code} — {c.road_name} ({c.speed_limit_kmh} km/h)
                </option>
              ))}
            </select>
          </div>

          {/* Feed Mode Selector */}
          <div className="filter-field">
            <label className="filter-label">Surveillance Feed Source</label>
            <select
              className="filter-select"
              value={feedMode}
              onChange={(e) => {
                const newMode = e.target.value as FeedSourceMode;
                if (feedActive) stopFeed();
                setFeedMode(newMode);
              }}
            >
              <option value="REAL_OVERHEAD">{FEED_LABELS.REAL_OVERHEAD}</option>
              <option value="REAL_CLOSEUP">{FEED_LABELS.REAL_CLOSEUP}</option>
              <option value="SYNTHETIC_CALIBRATED">{FEED_LABELS.SYNTHETIC_CALIBRATED}</option>
              <option value="UPLOAD_FILE">{FEED_LABELS.UPLOAD_FILE} (.mp4/.webm)</option>
              <option value="WEBCAM">{FEED_LABELS.WEBCAM}</option>
            </select>
          </div>

          {/* Conditional: Webcam Device OR File Upload */}
          {feedMode === 'WEBCAM' ? (
            <div className="filter-field">
              <label className="filter-label">Webcam / USB Camera Device</label>
              <select
                className="filter-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={webcamActive}
              >
                {devices.length > 0 ? (
                  devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera Device ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default System Webcam</option>
                )}
              </select>
            </div>
          ) : feedMode === 'UPLOAD_FILE' ? (
            <div className="filter-field">
              <label className="filter-label">Custom Video File</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="video/mp4,video/webm,video/avi"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadedFile(f);
                      setUploadedVideoUrl(URL.createObjectURL(f));
                      if (feedActive) stopFeed();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: '100%', height: '36px', fontSize: '12px', justifyContent: 'center' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} /> {uploadedFile ? uploadedFile.name.substring(0, 18) + '...' : 'Choose .mp4'}
                </button>
              </div>
            </div>
          ) : (
            <div className="filter-field">
              <label className="filter-label">Gate 1 to Gate 2 Distance (Δd)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="filter-select"
                  value={calibratedDistance}
                  step="0.5"
                  min="1"
                  max="100"
                  onChange={(e) => setCalibratedDistance(Number(e.target.value))}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--colors-ink-meta)' }}>M</span>
              </div>
            </div>
          )}

          {/* Gate Alignment Controls */}
          <div className="filter-field">
            <label className="filter-label">Gate Alignment (Entry / Exit %)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                className="filter-select"
                value={gate1Pct}
                min="10"
                max="50"
                onChange={(e) => setGate1Pct(Number(e.target.value))}
                title="Gate 1 (Entry) Position %"
              />
              <input
                type="number"
                className="filter-select"
                value={gate2Pct}
                min="55"
                max="90"
                onChange={(e) => setGate2Pct(Number(e.target.value))}
                title="Gate 2 (Exit) Position %"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Live Screen + Telemetry Math Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left: Video Screen */}
        <div className="kpi-card" style={{ padding: '16px', background: '#0b1120', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: feedActive ? '#10b981' : '#ef4444',
                  animation: feedActive ? 'pulse 1.5s infinite' : 'none'
                }}
              />
              <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                SURVEILLANCE FEED — {FEED_LABELS[feedMode].toUpperCase()} ({activeCamera.camera_code})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!feedActive ? (
                <button
                  className="btn-primary"
                  style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                  onClick={startFeed}
                >
                  <Play size={13} /> {feedMode === 'WEBCAM' ? 'Start Webcam' : 'Play Footage'}
                </button>
              ) : (
                <button
                  className="btn-outline"
                  style={{ height: '34px', padding: '0 12px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }}
                  onClick={stopFeed}
                >
                  <Square size={13} /> Stop Feed
                </button>
              )}

              <button
                className="btn-outline"
                style={{ height: '34px', padding: '0 12px', fontSize: '12px', color: '#ffffff', borderColor: '#334155' }}
                onClick={runFrameOcr}
                disabled={!feedActive || scanningPlate}
                title="Capture frame and run OpenCV OCR"
              >
                <Scan size={13} className={scanningPlate ? 'spin' : ''} />
                <span>{scanningPlate ? 'Scanning...' : 'OCR Plate'}</span>
              </button>

              <button
                className="btn-outline"
                style={{ height: '34px', padding: '0 12px', fontSize: '12px', color: '#38bdf8', borderColor: '#0284c7' }}
                onClick={async () => {
                  setBatchAnalysisLoading(true);
                  try {
                    let fileToUpload: File | null = uploadedFile;
                    if (!fileToUpload) {
                      const videoPath = feedMode === 'REAL_CLOSEUP'
                        ? '/videos/indian_traffic_real.mp4'
                        : (feedMode === 'SYNTHETIC_CALIBRATED' ? '/videos/traffic_highway_demo.mp4' : '/videos/overhead_highway_traffic.mp4');
                      const res = await fetch(videoPath);
                      const blob = await res.blob();
                      fileToUpload = new File([blob], 'demo_traffic.mp4', { type: 'video/mp4' });
                    }
                    const report = await radarApi.processVideoFile(fileToUpload, activeCamera.camera_id);
                    setBatchReport(report);
                    if (report?.citations && report.citations.length > 0) {
                      setCitationsLog((prev) => [...report.citations, ...prev]);
                      setActiveCitation(report.citations[0]);
                    }
                  } catch (err) {
                    console.error('Batch video analysis failed:', err);
                  } finally {
                    setBatchAnalysisLoading(false);
                  }
                }}
                disabled={batchAnalysisLoading}
                title="Execute server-side background subtraction & multi-vehicle tracking analysis"
              >
                <Film size={13} />
                <span>{batchAnalysisLoading ? 'Analyzing...' : 'Batch AI Report'}</span>
              </button>
            </div>
          </div>

          {/* Video Feed Box with Canvas HUD Overlay */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '440px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Real HTML5 Video (Webcam or Demo Loop) */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: feedActive ? 'block' : 'none'
              }}
              playsInline
              muted
            />

            {/* Real-time Canvas HUD Overlay (Gates & Motion Differencing) */}
            <canvas
              ref={overlayCanvasRef}
              width={640}
              height={440}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                display: feedActive ? 'block' : 'none'
              }}
            />

            {/* Standby Placeholder */}
            {!feedActive && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                <Video size={56} style={{ margin: '0 auto 16px', opacity: 0.5, color: '#38bdf8' }} />
                <h4 style={{ color: '#f8fafc', marginBottom: '8px' }}>
                  {feedMode === 'WEBCAM' ? 'Webcam Hardware Feed Offline' : 'Surveillance Demo Footage Ready'}
                </h4>
                <p style={{ fontSize: '13px', marginBottom: '18px', maxWidth: '420px', margin: '0 auto 18px', color: '#94a3b8' }}>
                  {feedMode === 'WEBCAM'
                    ? "Click below to activate your computer's webcam for live ANPR optical character recognition and speed measurement."
                    : "Real overhead/drone footage of highway traffic. Vehicles cross the frame top-to-bottom, matching the fixed dual-gate camera angle the velocity math assumes."}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={startFeed}>
                    <Play size={14} /> {feedMode === 'WEBCAM' ? 'Enable Live Camera Feed' : 'Start Feed'}
                  </button>
                  {feedMode !== 'SYNTHETIC_CALIBRATED' && (
                    <button
                      className="btn-outline"
                      style={{ color: '#38bdf8', borderColor: '#0284c7' }}
                      onClick={() => {
                        setFeedMode('SYNTHETIC_CALIBRATED');
                      }}
                    >
                      Switch to Calibration Demo
                    </button>
                  )}
                </div>
                {webcamError && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '12px' }}>
                    {webcamError}
                  </p>
                )}
              </div>
            )}

            {/* Live Velocity HUD Bar */}
            {feedActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.90)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Clocked Speed:
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: isCurrentSpeeding ? '#f87171' : '#34d399',
                      fontFamily: 'var(--font-family-mono)'
                    }}
                  >
                    {currentSpeed > 0 ? `${currentSpeed.toFixed(1)} km/h` : 'Waiting for Transit...'}
                  </span>
                  {currentSpeed > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCurrentSpeeding ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isCurrentSpeeding ? '#f87171' : '#34d399',
                        border: `1px solid ${isCurrentSpeeding ? '#ef4444' : '#10b981'}`
                      }}
                    >
                      {isCurrentSpeeding ? `+${speedDelta.toFixed(1)} km/h EXCEED` : 'COMPLIANT'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    PLATE: <strong style={{ color: '#38bdf8' }}>{currentPlate}</strong> ({ocrConfidence}%)
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: motionState === 'GATE1_ACTIVE' ? '#f59e0b' : '#334155',
                      color: '#ffffff'
                    }}
                  >
                    {motionState === 'GATE1_ACTIVE' ? 'GATE 1 IN TRANSIT' : motionState === 'MEASURED' ? 'MEASURED' : 'RADAR IDLE'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Demonstration Testing Action Strip */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoOcrOnTransit}
                  onChange={(e) => setAutoOcrOnTransit(e.target.checked)}
                />
                Auto OCR on Gate Transit
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Manual Velocity Trigger:</span>
              <button
                className="btn-outline"
                style={{ height: '30px', fontSize: '11px', padding: '0 10px', color: '#10b981', borderColor: '#10b981' }}
                onClick={() => handleManualTransitTrigger(54)}
              >
                Safe (54 km/h)
              </button>
              <button
                className="btn-primary"
                style={{ height: '30px', fontSize: '11px', padding: '0 12px', background: '#dc2626' }}
                onClick={() => handleManualTransitTrigger(88)}
              >
                🚨 Speeding (88 km/h)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Kinematic Math & Optical OCR Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Kinematic Mathematical Derivation Card */}
          <div className="kpi-card" style={{ borderLeft: `4px solid ${isCurrentSpeeding ? 'var(--colors-status-danger)' : 'var(--colors-status-success)'}` }}>
            <div className="kpi-card-header">
              <span className="kpi-label">Kinematic Velocity Mathematics</span>
              <div className="kpi-icon-wrapper">
                <Cpu size={16} color="var(--colors-primary)" />
              </div>
            </div>

            {/* Physics Equation Formula Box */}
            <div
              style={{
                background: 'var(--colors-chrome)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid var(--colors-border-subtle)',
                marginBottom: '12px',
                fontFamily: 'monospace',
                fontSize: '13px',
                color: 'var(--colors-ink)'
              }}
            >
              <div style={{ color: 'var(--colors-ink-meta)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Speed Physics Equation:
              </div>
              <div style={{ fontWeight: 700, color: 'var(--colors-primary)' }}>
                v = (Δd / Δt) × 3.6
              </div>
              <div style={{ marginTop: '4px', fontSize: '12px' }}>
                = ({calibratedDistance.toFixed(1)}m / {deltaSec.toFixed(3)}s) × 3.6
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '4px', color: isCurrentSpeeding ? '#dc2626' : '#16a34a' }}>
                = {currentSpeed > 0 ? `${currentSpeed.toFixed(1)} km/h` : 'Waiting for Gate 1 → Gate 2 transit...'}
              </div>
            </div>

            {/* Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '8px', background: 'var(--colors-canvas)', borderRadius: '4px', border: '1px solid var(--colors-hairline-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--colors-ink-meta)' }}>Gate Distance</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{calibratedDistance.toFixed(1)} m</div>
              </div>

              <div style={{ padding: '8px', background: 'var(--colors-canvas)', borderRadius: '4px', border: '1px solid var(--colors-hairline-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--colors-ink-meta)' }}>Transit Time (Δt)</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{deltaSec.toFixed(3)} s</div>
              </div>

              <div style={{ padding: '8px', background: 'var(--colors-canvas)', borderRadius: '4px', border: '1px solid var(--colors-hairline-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--colors-ink-meta)' }}>Corridor Limit</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--colors-primary)' }}>{speedLimit} km/h</div>
              </div>
            </div>
          </div>

          {/* Optical ANPR OCR Extraction Card */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Optical License Plate OCR</span>
              <div className="kpi-icon-wrapper">
                <Zap size={16} color="var(--colors-status-warning)" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              {/* License Plate Visual Box */}
              <div
                style={{
                  background: '#fef08a',
                  border: '2px solid #ca8a04',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#1e293b',
                  letterSpacing: '0.08em',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                IND • {currentPlate}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--colors-ink)' }}>
                  Optical Confidence: <span style={{ color: '#16a34a' }}>{ocrConfidence}%</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--colors-ink-meta)' }}>
                  {ocrResult?.vehicle_info ? `${ocrResult.vehicle_info.make} ${ocrResult.vehicle_info.model} • ${ocrResult.vehicle_info.owner_name}` : 'State: Maharashtra • Maruti Swift'}
                </div>
              </div>
            </div>

            {/* OpenCV Preprocessed OCR Binarized Preview (if scanned) */}
            {ocrResult?.preprocessed_b64 && (
              <div style={{ marginBottom: '10px', background: '#0f172a', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  OpenCV Binarized OCR Filter Output ({ocrResult.processing_time_ms} ms):
                </div>
                <img
                  src={`data:image/jpeg;base64,${ocrResult.preprocessed_b64}`}
                  alt="OpenCV Preprocessed Plate"
                  style={{ maxHeight: '42px', maxWidth: '100%', imageRendering: 'pixelated' }}
                />
              </div>
            )}

            <div style={{ fontSize: '12px', color: 'var(--colors-ink-body)', lineHeight: 1.5, background: 'var(--colors-chrome)', padding: '10px 12px', borderRadius: '6px' }}>
              <strong>ACID Database Match:</strong> Linked to Citizen Owner <em>{ocrResult?.vehicle_info?.owner_name || 'Manoj Reddy'}</em>. Driver License demerit score evaluated upon citation.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Citation Banner (When Over Speeding Occurs) */}
      {activeCitation && activeCitation.is_violation && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '5px solid #ef4444',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#dc2626" />
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', marginBottom: '2px' }}>
                🚨 OVERSPEEDING CITATION ISSUED (Violation #{activeCitation.violation_id} • Fine #{activeCitation.fine_id})
              </div>
              <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                Vehicle <strong>{activeCitation.license_plate}</strong> ({activeCitation.vehicle_make} {activeCitation.vehicle_model}) clocked at <strong>{activeCitation.observed_speed.toFixed(1)} km/h</strong> in a <strong>{activeCitation.speed_limit} km/h</strong> corridor (+{activeCitation.speed_delta.toFixed(1)} km/h excess). Statutory fine: <strong>₹{activeCitation.fine_amount?.toLocaleString()}</strong> levied.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-secondary"
              style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
              onClick={() => onNavigate?.('fines')}
            >
              <Receipt size={14} /> View in Fines Ledger
            </button>
            <button
              className="btn-primary"
              style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
              onClick={() => onNavigate?.('violations')}
            >
              Violations <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Batch Video AI Analysis Card (When server-side processing runs) */}
      {batchReport && (
        <div className="kpi-card" style={{ marginBottom: '24px', borderLeft: '4px solid #0284c7', background: '#0b1120' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={18} color="#38bdf8" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Server-Side OpenCV Video MOG2 Tracking Report
              </span>
            </div>
            <button
              className="btn-outline"
              style={{ height: '28px', fontSize: '11px', padding: '0 10px', color: '#94a3b8' }}
              onClick={() => setBatchReport(null)}
            >
              Close Report
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Processed Frames</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{batchReport.processed_frames} / {batchReport.total_frames}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Video Sampling Rate</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{batchReport.fps} FPS</div>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vehicles Tracked</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{batchReport.vehicles_tracked}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>ACID Citations Inserted</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{batchReport.citations?.length || 0}</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Dual-gate background subtraction (MOG2 history=300) tracked vehicle centroids crossing entry (y=35%) and exit (y=70%) over calibrated {batchReport.calibrated_distance_meters}m corridor.
          </div>
        </div>
      )}

      {/* 4. Real-time Session Radar Citations Log */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--colors-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--colors-ink)' }}>
              Real-Time Webcam Radar Citations & Ingestion Log ({citationsLog.length} Recorded)
            </span>
          </div>

          <button
            className="btn-outline"
            style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
            onClick={() => setCitationsLog([])}
          >
            Clear Log
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Vehicle Plate</th>
              <th>Clocked Speed</th>
              <th>Speed Limit</th>
              <th>Excess Delta</th>
              <th>Enforcement Status</th>
              <th>Fine Levied</th>
              <th>Corridor / Zone</th>
            </tr>
          </thead>
          <tbody>
            {citationsLog.length > 0 ? (
              citationsLog.map((c, idx) => (
                <tr key={idx}>
                  <td>{new Date(c.timestamp).toLocaleTimeString()}</td>
                  <td><strong>{c.license_plate}</strong></td>
                  <td style={{ fontWeight: 700, color: c.is_violation ? '#dc2626' : '#16a34a' }}>
                    {c.observed_speed.toFixed(1)} km/h
                  </td>
                  <td>{c.speed_limit} km/h</td>
                  <td>
                    {c.is_violation ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>+{c.speed_delta.toFixed(1)} km/h</span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>0.0 km/h</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${c.is_violation ? 'badge-danger' : 'badge-success'}`}>
                      {c.is_violation ? 'FINED (OVER_SPEED)' : 'COMPLIANT'}
                    </span>
                  </td>
                  <td>
                    {c.fine_amount ? (
                      <strong style={{ color: '#dc2626' }}>₹{c.fine_amount.toLocaleString()}</strong>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{c.road_name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="state-center" style={{ padding: '32px' }}>
                  <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '8px' }} />
                  <div>No speeding violations detected in current active session.</div>
                  <div style={{ fontSize: '12px', color: 'var(--colors-ink-meta)', marginTop: '4px' }}>
                    Start the live webcam and move an object across Gate 1 to Gate 2, or click "🚨 Speeding (88 km/h)" to trigger an event.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
