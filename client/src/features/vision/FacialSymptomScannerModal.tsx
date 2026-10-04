import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Eye,
  Scan,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  Upload,
  Activity,
  Zap,
  Leaf,
  AlertOctagon,
  ArrowRight,
  Info,
  Check,
  SwitchCamera,
  Image as ImageIcon,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { VisualInspectionResult, FacialVisualSymptom, LanguageCode } from '@shared/types';
import { api } from '../../services/api';
import { CLINICAL_ARCHETYPE_SVGS } from './archetypeSvgs';

interface FacialSymptomScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId?: string;
  language?: LanguageCode;
  existingResult?: VisualInspectionResult | null;
  onInspectionComplete?: (result: VisualInspectionResult) => void;
}

type CameraStatus = 'idle' | 'starting' | 'active' | 'error';

export const FacialSymptomScannerModal: React.FC<FacialSymptomScannerModalProps> = ({
  isOpen,
  onClose,
  consultationId,
  language = 'en',
  existingResult,
  onInspectionComplete,
}) => {
  const isHi = language === 'hi';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deviceCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<VisualInspectionResult | null>(null);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [showLandmarkOverlays, setShowLandmarkOverlays] = useState(true);
  const [activePreset, setActivePreset] = useState<
    'JAUNDICE' | 'ANEMIA_PALLOR' | 'STROKE_DROOP' | 'CYANOSIS' | 'NORMAL' | null
  >(null);

  // Play subtle synthetic camera shutter sound
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio feedback is purely non-blocking enhancement
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[Camera] Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        // Safe nulling
      }
    }
    setCameraStatus('idle');
  }, []);

  // Ref callback to immediately bind stream when the video element mounts in DOM
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.setAttribute('playsinline', 'true');
      node.setAttribute('webkit-playsinline', 'true');
      node.play().catch((err) => {
        console.warn('[Camera] Node attach play error:', err);
      });
    }
  }, []);

  // Start camera with progressive fallback constraints
  const startCamera = useCallback(
    async (mode: 'user' | 'environment' = facingMode) => {
      stopCamera();
      setCameraStatus('starting');
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('error');
        setCameraError(
          isHi
            ? 'इस ब्राउज़र में वेबकैम समर्थित नहीं है या सुरक्षित कनेक्शन (HTTPS/localhost) आवश्यक है।'
            : 'Webcam not supported in this browser or context is insecure (HTTPS or localhost required).'
        );
        return;
      }

      let mediaStream: MediaStream | null = null;
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');

      // Progressive constraint strategy: avoid facingMode overconstraint on macOS/desktop
      const attempts = isMobileDevice
        ? [
            {
              video: {
                facingMode: mode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            },
            {
              video: { facingMode: mode },
              audio: false,
            },
            {
              video: true,
              audio: false,
            },
          ]
        : [
            {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            },
            {
              video: true,
              audio: false,
            },
          ];

      let lastError: any = null;

      for (const constraints of attempts) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (mediaStream) break;
        } catch (err: any) {
          lastError = err;
          // If permission was explicitly denied, do not keep retrying constraints
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (!mediaStream) {
        console.warn('[Camera] All getUserMedia attempts failed:', lastError);
        setCameraStatus('error');

        if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
          setCameraError(
            isHi
              ? 'कैमरा अनुमति अस्वीकृत है। कृपया ब्राउज़र URL बार में कैमरा आइकन पर क्लिक कर अनुमति दें, या नीचे से फोटो अपलोड करें।'
              : 'Camera access denied. Please click the lock/camera icon in your address bar to allow permissions, or upload a photo below.'
          );
        } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
          setCameraError(
            isHi
              ? 'कोई वेबकैम नहीं मिला। कृपया फोटो अपलोड करें या नीचे दिए गए 1-क्लिक टेस्ट प्रीसेट चुनें।'
              : 'No camera hardware found. Please upload a photo or select a clinical preset below.'
          );
        } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
          setCameraError(
            isHi
              ? 'कैमरा किसी अन्य ऐप (जैसे Zoom, FaceTime) द्वारा उपयोग में है। कृपया उसे बंद कर पुनः प्रयास करें।'
              : 'Camera is currently in use by another application (Zoom, FaceTime, etc.). Please close it and retry.'
          );
        } else {
          setCameraError(
            lastError?.message ||
              (isHi
                ? 'कैमरा चालू नहीं हो सका। कृपया फोटो अपलोड करें।'
                : 'Unable to start camera. Please upload a photo or use diagnostic presets.')
          );
        }
        return;
      }

      // Stream successfully acquired! Immediately mark active
      streamRef.current = mediaStream;
      setCameraStatus('active');
      setCameraError(null);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((playErr) => {
            console.warn('[Camera] Autoplay initial catch:', playErr);
          });
        }
      }
    },
    [facingMode, isHi, stopCamera]
  );

  // Toggle between front and back camera (especially on mobile/tablets)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Lifecycle: open/close handling
  useEffect(() => {
    if (isOpen) {
      if (existingResult) {
        setInspectionResult(existingResult);
        setCapturedImage(existingResult.imageUrl || null);
        setActivePreset(null);
      } else {
        setInspectionResult(null);
        setCapturedImage(null);
        setActivePreset(null);
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, existingResult, startCamera, stopCamera]);

  // Synchronize stream with videoRef when mounted or changed
  useEffect(() => {
    if (isOpen && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, cameraStatus]);

  // Capture video frame to high-resolution base64 JPEG with quality & luminance validation
  const captureFrameFromCamera = (): { dataUrl: string | null; error?: string } => {
    const video = videoRef.current;
    if (!video) {
      return { dataUrl: null, error: isHi ? 'कैमरा उपलब्ध नहीं है' : 'Camera video feed not found' };
    }

    if (video.videoWidth === 0 && video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return {
        dataUrl: null,
        error: isHi
          ? 'कैमरा फ़ीड अभी तैयार नहीं है। कृपया 1 सेकंड प्रतीक्षा करें।'
          : 'Camera feed is warming up. Please wait 1 second and retry.',
      };
    }

    const width = video.videoWidth > 0 ? video.videoWidth : video.clientWidth || 640;
    const height = video.videoHeight > 0 ? video.videoHeight : video.clientHeight || 480;

    if (width === 0 || height === 0) {
      return {
        dataUrl: null,
        error: isHi ? 'कैमरा फ्रेम लोड नहीं हुआ' : 'Camera frame could not be read',
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { dataUrl: null, error: 'Canvas context unavailable' };
    }

    try {
      // Mirror-flip horizontally for front-facing camera to match natural mirror preview
      if (facingMode === 'user') {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, width, height);
      }

      // Check real pixel luminance to reject pitch-black / uninitialized frames
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        let totalLuminance = 0;
        const step = Math.max(1, Math.floor(pixels.length / 4000));
        let samples = 0;
        for (let i = 0; i < pixels.length; i += step * 4) {
          totalLuminance += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          samples++;
        }
        const avgBrightness = samples > 0 ? totalLuminance / samples : 0;
        if (avgBrightness < 3) {
          return {
            dataUrl: null,
            error: isHi
              ? 'कैमरा फ्रेम पूरी तरह से काला या अस्पष्ट है। कृपया सुनिश्चित करें कि कैमरा ढका नहीं है और चेहरे पर रोशनी है।'
              : 'Captured frame is completely dark or covered. Please ensure your webcam is uncovered and well-lit.',
          };
        }
      } catch (pixErr) {
        console.warn('[Camera] Luminance check bypassed:', pixErr);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      if (!dataUrl || dataUrl.length < 500) {
        return {
          dataUrl: null,
          error: isHi ? 'छवि कैप्चर करने में त्रुटि' : 'Failed to generate image data',
        };
      }
      return { dataUrl };
    } catch (err: any) {
      console.error('[Camera] Canvas drawImage failed:', err);
      return { dataUrl: null, error: err?.message || 'Capture failed' };
    }
  };

  // Run visual AI / heuristic analysis
  const runVisualAnalysis = async (imgData?: string | null, preset?: any) => {
    setIsAnalyzing(true);
    setCameraError(null);
    setAnalysisStep(
      isHi ? 'चेहरे व आंखों के पिक्सेल का विश्लेषण हो रहा है...' : 'Scanning facial & ocular landmarks...'
    );

    const stepTimer1 = setTimeout(() => {
      setAnalysisStep(
        isHi
          ? 'श्वेतपटल व कंजंक्टाइवा रंग अनुपात माप रहे हैं...'
          : 'Analyzing scleral & conjunctival chromaticity...'
      );
    }, 450);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep(
        isHi
          ? 'चेहरे की तंत्रिका समरूपता (Symmetry) माप रहे हैं...'
          : 'Calculating bilateral craniofacial symmetry index...'
      );
    }, 900);

    try {
      // Execute API query alongside biometric animation
      const apiCall = (async () => {
        if (consultationId) {
          return await api.analyzeVisualSymptoms(consultationId, {
            imageBase64: imgData || undefined,
            presetType: preset,
            language,
          });
        } else {
          return await api.analyzeStandaloneFace({
            imageBase64: imgData || undefined,
            presetType: preset,
            language,
          });
        }
      })();

      const [res] = await Promise.all([
        apiCall,
        new Promise((resolve) => setTimeout(resolve, 1100)),
      ]);

      if (!res.success && (res as any).error) {
        throw new Error((res as any).error);
      }

      const rawData = res.data as any;
      const data: VisualInspectionResult = rawData?.visualInspection || rawData;
      if (data) {
        if (!data.imageUrl && (imgData || capturedImage)) {
          data.imageUrl = imgData || capturedImage || undefined;
        }
        if (data.imageUrl && !capturedImage) {
          setCapturedImage(data.imageUrl);
        }
        setInspectionResult(data);
        if (onInspectionComplete) {
          onInspectionComplete(data);
        }
      } else {
        throw new Error(isHi ? 'विश्लेषण परिणाम प्राप्त नहीं हुआ।' : 'No analysis result received.');
      }
    } catch (err: any) {
      console.error('Failed to run visual inspection:', err);
      setCameraError(
        err.message ||
          (isHi
            ? 'दृश्य लक्षण विश्लेषण में समस्या आई। कृपया पुनः प्रयास करें।'
            : 'Visual analysis encountered an issue. Please try again.')
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Handle Primary Action Button Click
  const handleCaptureAndScan = () => {
    // 1. If photo is currently captured, clicking acts as "Retake Photo"
    if (capturedImage) {
      setCapturedImage(null);
      setInspectionResult(null);
      setActivePreset(null);
      if (cameraStatus !== 'active') {
        startCamera();
      }
      return;
    }

    // 2. If camera is not active or in error: clicking explicitly turns on the camera!
    if (cameraStatus !== 'active') {
      startCamera();
      return;
    }

    // 3. If camera is live and active: capture frame immediately
    const { dataUrl, error } = captureFrameFromCamera();
    if (dataUrl) {
      playShutterSound();
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 180);

      setCapturedImage(dataUrl);
      setActivePreset(null);
      setCameraError(null);
      runVisualAnalysis(dataUrl);
    } else if (error) {
      setCameraError(error);
    }
  };

  // Preset selector with Archetype visual representations
  const handleSelectPreset = (
    preset: 'JAUNDICE' | 'ANEMIA_PALLOR' | 'STROKE_DROOP' | 'CYANOSIS' | 'NORMAL'
  ) => {
    setActivePreset(preset);
    const archetypeSvg = CLINICAL_ARCHETYPE_SVGS[preset];
    setCapturedImage(archetypeSvg);
    setCameraError(null);
    runVisualAnalysis(archetypeSvg, preset);
  };

  // File upload reader (handles both device camera and gallery file picker)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      playShutterSound();
      setCapturedImage(base64);
      setActivePreset(null);
      setCameraError(null);
      runVisualAnalysis(base64);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        playShutterSound();
        setCapturedImage(base64);
        setActivePreset(null);
        setCameraError(null);
        runVisualAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const hasRedFlags = (inspectionResult?.detectedRedFlags || []).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[95vh] flex flex-col overflow-hidden transition-colors">
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Hidden Device Camera Input for Direct Native Hardware Camera (Mobile/Tablet/Webview) */}
        <input
          ref={deviceCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {isHi ? 'दृष्टि लक्षण परीक्षण (नेत्र एवं आकृति परीक्षा)' : 'Visual Symptom Recognition & Face/Eye Scan'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-mono">
                  Netra AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHi
                  ? 'आंखों के कंजंक्टाइवा (पीलिया/एनीमिया), चेहरे की समरूपता (स्ट्रोक) एवं होंठों का दृश्य नैदानिक परीक्षण'
                  : 'Screen ocular sclera (jaundice/pallor), facial symmetry (stroke droop), and lip perfusion'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 overflow-y-auto pr-1">
          {/* Left Column: Camera Viewport & Controls */}
          <div className="lg:col-span-7 space-y-4">
            {/* Viewport Frame with HUD & Drag-Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border shadow-inner flex items-center justify-center transition-all ${
                isDraggingOver
                  ? 'border-cyan-400 ring-4 ring-cyan-500/20 bg-slate-900'
                  : 'border-slate-800'
              }`}
            >
              {/* 1. Video element: ALWAYS preserved in DOM and visible when stream is active */}
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                  facingMode === 'user' ? 'transform -scale-x-100' : ''
                } ${capturedImage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              />

              {/* 2. Display captured image when user takes photo or uploads */}
              {capturedImage && (
                <div
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="absolute inset-0 z-10 animate-fade-in group cursor-pointer"
                  title={isHi ? 'बड़ी फोटो देखने के लिए क्लिक करें' : 'Click to inspect captured photo in full resolution'}
                >
                  <img
                    src={capturedImage}
                    alt="Captured face for clinical analysis"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Subtle hover overlay prompt */}
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold border border-cyan-400/60 shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span>{isHi ? '🔍 पूरी स्क्रीन पर फोटो देखें' : '🔍 Click to Enlarge Photo'}</span>
                    </span>
                  </div>
                  {/* Corner Maximize Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPhotoLightboxOpen(true);
                    }}
                    className="absolute top-12 right-3 p-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-md transition-all pointer-events-auto"
                    title={isHi ? 'फुलस्क्रीन देखें' : 'Fullscreen Preview'}
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              )}

              {/* 3. Starting State Overlay: When browser is acquiring webcam or awaiting permission */}
              {cameraStatus === 'starting' && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 bg-slate-950/90 animate-fade-in">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                      <Camera className="w-7 h-7 animate-pulse" />
                    </div>
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin absolute -top-1 -right-1" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      {isHi ? 'वेबकैम शुरू हो रहा है...' : 'Starting Camera...'}
                    </p>
                    <p className="text-xs text-slate-300 max-w-xs mx-auto">
                      {isHi
                        ? 'यदि ब्राउज़र अनुमति मांगता है, तो कृपया "Allow" पर क्लिक करें।'
                        : 'Please click "Allow" if your browser prompts for camera access.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => deviceCameraInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isHi ? '📱 डिवाइस कैमरा खोलें' : '📱 Open Device Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Idle State Overlay: Camera not yet started */}
              {cameraStatus === 'idle' && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 bg-slate-950/90 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      {isHi ? 'वेबकैम बंद है' : 'Webcam is Not Active'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {isHi
                        ? 'लाइव चेहरे व आंखों की जांच के लिए वेबकैम चालू करें या डिवाइस कैमरे से फोटो लें।'
                        : 'Turn on your webcam for live face & eye inspection, or use your device camera.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isHi ? '📹 वेबकैम चालू करें' : '📹 Start Webcam'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deviceCameraInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isHi ? '📱 डिवाइस कैमरा' : '📱 Device Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5. Error Fallback Overlay: Camera blocked, in use, or unsupported */}
              {cameraStatus === 'error' && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-400 z-10 bg-slate-950/95">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
                    <AlertTriangle className="w-7 h-7 opacity-90" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">
                      {isHi ? 'कैमरा कनेक्ट नहीं हुआ' : 'Webcam Access Issue'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {cameraError ||
                        (isHi
                          ? 'कृपया कैमरा अनुमति दें, मोबाइल/डिवाइस कैमरा खोलें, या नीचे से टेस्ट प्रीसेट चुनें।'
                          : 'Please allow camera permission, open device camera, or test with a 1-click archetype below.')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isHi ? 'पुनः प्रयास करें' : 'Retry Webcam'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deviceCameraInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isHi ? '📱 डिवाइस कैमरा' : '📱 Device Camera'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isHi ? 'फोटो अपलोड' : 'Upload'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Shutter flash animation overlay */}
              {shutterFlash && (
                <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
              )}

              {/* Medical Diagnostic HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
                {/* Top Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        capturedImage
                          ? 'bg-emerald-400'
                          : cameraStatus === 'active'
                          ? 'bg-emerald-400 animate-pulse'
                          : cameraStatus === 'starting'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {capturedImage
                        ? 'PHOTO CAPTURED 📸'
                        : cameraStatus === 'active'
                        ? 'OPTICAL FEED LIVE'
                        : cameraStatus === 'starting'
                        ? 'CONNECTING TO CAMERA...'
                        : 'CAMERA INACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle camera button if camera active */}
                    {cameraStatus === 'active' && !capturedImage && (
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="pointer-events-auto p-1.5 rounded-lg bg-slate-900/85 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Flip Camera (Front / Rear)"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-300">
                      Netra & Akriti Pariksha
                    </span>
                  </div>
                </div>

                {/* Central Targeting Reticle Guides (visible during live camera) */}
                {cameraStatus === 'active' && !capturedImage && (
                  <div className="relative w-full h-full flex items-center justify-center my-auto">
                    {/* Face Oval Guide */}
                    <div className="w-48 sm:w-56 h-60 sm:h-72 rounded-[46%] border-2 border-dashed border-cyan-400/50 relative flex flex-col items-center justify-between p-4 transition-all">
                      {/* Corner Reticle Markers */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                      {/* Eye Target Boxes */}
                      <div className="w-full flex items-center justify-around mt-8">
                        <div className="w-14 h-8 rounded-lg border border-cyan-400/80 bg-cyan-500/15 flex items-center justify-center text-[9px] font-mono text-cyan-200 shadow-sm">
                          <Eye className="w-3.5 h-3.5 mr-0.5 opacity-90" /> R Eye
                        </div>
                        <div className="w-14 h-8 rounded-lg border border-cyan-400/80 bg-cyan-500/15 flex items-center justify-center text-[9px] font-mono text-cyan-200 shadow-sm">
                          <Eye className="w-3.5 h-3.5 mr-0.5 opacity-90" /> L Eye
                        </div>
                      </div>

                      {/* Lips/Mouth Guide */}
                      <div className="w-20 h-7 rounded-lg border border-cyan-400/70 bg-cyan-500/15 flex items-center justify-center text-[9px] font-mono text-cyan-200 mb-6 shadow-sm">
                        Oshtha (Lips)
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Guide Text */}
                <div className="text-center text-[10px] text-slate-300 bg-slate-950/85 backdrop-blur-sm py-1 px-3 rounded-xl mx-auto border border-slate-800 shadow-sm">
                  {capturedImage
                    ? isHi
                      ? 'फोटो कैप्चर हो गई है। क्लिनिकल निष्कर्ष दाईं ओर देखें।'
                      : 'Photo captured! Biometric findings displayed on the right.'
                    : cameraStatus === 'active'
                    ? isHi
                      ? 'कृपया चेहरे को केंद्र में रखें और "फोटो खींचें व जांचें" बटन दबाएं'
                      : 'Position face in frame & click "Capture Photo & Analyze"'
                    : cameraStatus === 'starting'
                    ? isHi
                      ? 'वेबकैम शुरू हो रहा है, कृपया प्रतीक्षा करें...'
                      : 'Starting webcam, please wait...'
                    : isHi
                    ? 'वेबकैम चालू करें, डिवाइस कैमरा खोलें या नीचे से 1-क्लिक टेस्ट चुनें'
                    : 'Start webcam, open device camera, or choose an archetype below'}
                </div>
              </div>

              {/* Analyzing Loading Veil */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                  <div className="relative">
                    <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                    <Scan className="w-5 h-5 text-emerald-400 absolute top-2.5 left-2.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {isHi ? 'क्लिनिकल एआई परीक्षण सक्रिय है...' : 'Clinical Biometric Analysis Active...'}
                    </h4>
                    <p className="text-xs text-cyan-300 font-mono mt-1 animate-pulse">{analysisStep}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error / Troubleshooting Notice */}
            {cameraError && !capturedImage && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{cameraError}</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {isHi
                      ? 'सुझाव: आप "डिवाइस कैमरा" से फोटो ले सकते हैं, गैलरी से फोटो अपलोड कर सकते हैं, या नीचे दिए गए क्लिनिकल प्रीसेट से तुरंत परीक्षण कर सकते हैं।'
                      : 'Tip: You can click "Device Camera" to snap a photo, upload an image from disk, or test instantly with a 1-click archetype below.'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons: Capture / Start Webcam / Device Camera / Retake / Upload */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCaptureAndScan}
                disabled={isAnalyzing}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
              >
                {capturedImage ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{isHi ? '🔄 नई फोटो खींचें (Retake Photo)' : '🔄 Retake Photo'}</span>
                  </>
                ) : cameraStatus === 'active' ? (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>{isHi ? '📸 फोटो खींचें व जांचें (Capture Image)' : '📸 Capture Photo & Analyze'}</span>
                  </>
                ) : cameraStatus === 'starting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isHi ? '⏳ कैमरा शुरू हो रहा है...' : '⏳ Connecting Camera...'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>{isHi ? '📹 वेबकैम चालू करें (Start Webcam)' : '📹 Start Webcam'}</span>
                  </>
                )}
              </button>

              {capturedImage ? (
                <button
                  type="button"
                  onClick={() => runVisualAnalysis(capturedImage)}
                  disabled={isAnalyzing}
                  className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Re-run AI analysis on current photo"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isHi ? 'पुनः जांचें' : 'Re-Analyze'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => deviceCameraInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="py-3 px-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold text-xs border border-cyan-300 dark:border-cyan-800 flex items-center gap-1.5 transition-all"
                  title="Open device native camera hardware (Mobile / Tablet)"
                >
                  <Camera className="w-4 h-4 text-cyan-500" />
                  <span>{isHi ? '📱 डिवाइस कैमरा' : '📱 Device Camera'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 dark:bg-obsidian-850 hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all"
                title="Upload face photo from disk"
              >
                <Upload className="w-4 h-4 text-cyan-500" />
                <span>{isHi ? 'अपलोड' : 'Upload'}</span>
              </button>
            </div>

            {/* Quick Clinical Simulation Archetype Presets */}
            <div className="p-3 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                <span>🎯 {isHi ? 'त्वरित नैदानिक टेस्ट प्रीसेट्स (Instant 1-Click Tests):' : 'Clinical Diagnostic Test Archetypes:'}</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">1-Click Scan</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('JAUNDICE')}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    activePreset === 'JAUNDICE'
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-400 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-400/40'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[11px]">
                    <span>🟡</span> Jaundice (पीलिया)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Scleral Icterus • Kamala</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('ANEMIA_PALLOR')}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    activePreset === 'ANEMIA_PALLOR'
                      ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 text-sky-900 dark:text-sky-200 font-bold ring-2 ring-sky-400/40'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 hover:border-sky-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[11px]">
                    <span>⚪</span> Anemia (पाण्डु)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Conjunctival Pallor • Low Hb</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('STROKE_DROOP')}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    activePreset === 'STROKE_DROOP'
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-400/40'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
                    <span>🚨</span> Stroke Droop
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Facial Asymmetry • FAST</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('CYANOSIS')}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    activePreset === 'CYANOSIS'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-400/40'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                    <span>🔵</span> Cyanosis (नीलिमा)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Blue Lips • Hypoxia Alert</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('NORMAL')}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    activePreset === 'NORMAL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-400/40'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span>🟢</span> Normal (प्राकृत)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Clear Eyes • Symmetric</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Findings & Biometrics */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {inspectionResult ? (
              <div className="space-y-4 animate-fade-in">
                {/* 📸 Captured Clinical Photo & Facial Landmarks Card */}
                {(capturedImage || inspectionResult.imageUrl) && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 text-white space-y-2.5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-100">
                          {isHi ? '📸 कैप्चर की गई फोटो व नैदानिक फ्रेम' : '📸 Captured Clinical Photo & Facial Landmarks'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        VERIFIED FRAME
                      </span>
                    </div>

                    {/* Photo preview container */}
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setIsPhotoLightboxOpen(true)}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-cyan-400/60 shadow-md shrink-0 cursor-pointer group bg-slate-950"
                        title={isHi ? 'बड़ा देखने के लिए क्लिक करें' : 'Click to inspect in full resolution'}
                      >
                        <img
                          src={capturedImage || inspectionResult.imageUrl}
                          alt="Captured face thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-cyan-300" />
                        </div>
                      </div>

                      {/* Diagnostic Target Landmark Badges */}
                      <div className="flex-1 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{new Date(inspectionResult.capturedAt).toLocaleTimeString()}</span>
                          <button
                            type="button"
                            onClick={() => setIsPhotoLightboxOpen(true)}
                            className="text-cyan-400 hover:text-cyan-300 underline font-sans font-semibold flex items-center gap-0.5"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>{isHi ? 'बड़ा देखें' : 'Enlarge Photo'}</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>Ocular Sclera</span>
                            </span>
                            <span className="font-bold font-mono text-cyan-300">
                              {inspectionResult.eyeInspection.scleralIcterus
                                ? '🟡 Icterus'
                                : inspectionResult.eyeInspection.conjunctivalPallor
                                ? '⚪ Pallor'
                                : '🟢 Clear'}
                            </span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Activity className="w-3 h-3 text-emerald-400" />
                              <span>Symmetry Axis</span>
                            </span>
                            <span className="font-bold font-mono text-emerald-300">
                              {inspectionResult.facialSymmetry.symmetryScorePercent}%
                            </span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-[10px]">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-400" />
                              <span>Lip Perfusion</span>
                            </span>
                            <span className="font-bold font-mono text-rose-300">
                              {inspectionResult.lipsInspection.cyanosisDetected
                                ? '🚨 Cyanotic'
                                : 'Normal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Emergency Alert Banner if Red Flag */}
                {hasRedFlags && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300">
                      <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
                      <span>{isHi ? 'आपातकालीन दृश्य चेतावनी (Visual Red Flag)' : 'EMERGENCY CLINICAL WARNING'}</span>
                    </div>
                    <ul className="text-xs space-y-1 font-semibold list-disc list-inside">
                      {inspectionResult.detectedRedFlags.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Diagnostic Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isHi ? 'एआई नैदानिक अवलोकन' : 'AI Clinical Observation'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(inspectionResult.capturedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                    {inspectionResult.overallObservation}
                  </p>
                </div>

                {/* Organ Inspection Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Eye Inspection Card */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                      <Eye className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Netra (Eyes)</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {inspectionResult.eyeInspection.scleralIcterus ? (
                        <span className="text-amber-600 dark:text-amber-400">🟡 Scleral Icterus</span>
                      ) : inspectionResult.eyeInspection.conjunctivalPallor ? (
                        <span className="text-sky-600 dark:text-sky-400">⚪ Conjunctival Pallor</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">🟢 Clear Sclera</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2">
                      {inspectionResult.eyeInspection.notes}
                    </p>
                  </div>

                  {/* Facial Symmetry Card */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Akriti (Symmetry)</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between">
                      <span
                        className={
                          inspectionResult.facialSymmetry.droopDetected
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {inspectionResult.facialSymmetry.droopDetected ? '🚨 Asymmetric Droop' : 'Symmetric'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {inspectionResult.facialSymmetry.symmetryScorePercent}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2">
                      {inspectionResult.facialSymmetry.notes}
                    </p>
                  </div>
                </div>

                {/* Detected Symptoms List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Biometric Clinical Findings ({inspectionResult.findings.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {inspectionResult.findings.map((f, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                          f.isRedFlag
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-obsidian-850 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {f.isRedFlag && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                            {f.sign}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                            {f.confidence}% Conf.
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{f.clinicalSignificance}</p>
                        {f.ayushCorrelation && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium pt-0.5">
                            <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{f.ayushCorrelation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty / Waiting state */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 my-auto">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-obsidian-900 shadow-xs text-cyan-500">
                  <Scan className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-200">Awaiting Facial Inspection</h5>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Click "Capture Photo & Analyze" or choose an archetype preset to scan for jaundice, anemia pallor, stroke droop, and cyanosis.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>

              {inspectionResult && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHi ? 'परामर्श में लागू करें' : 'Apply to Consultation'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {isPhotoLightboxOpen && (capturedImage || inspectionResult?.imageUrl) && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setIsPhotoLightboxOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {isHi ? '📸 क्लिनिकल फोटो एवं बायोमेट्रिक मैपिंग' : '📸 Captured Face Photo & Biometric Inspection'}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    {inspectionResult
                      ? `Timestamp: ${new Date(inspectionResult.capturedAt).toLocaleString()}`
                      : 'Netra AI Optical Frame'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLandmarkOverlays(!showLandmarkOverlays)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    showLandmarkOverlays
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showLandmarkOverlays
                    ? isHi
                      ? 'मार्कर छिपाएं'
                      : 'Hide Landmarks'
                    : isHi
                    ? 'मार्कर दिखाएं'
                    : 'Show Landmarks'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Image Frame */}
            <div className="relative aspect-4/3 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={capturedImage || inspectionResult?.imageUrl || ''}
                alt="Captured face clinical high-resolution inspection"
                className="w-full h-full object-contain"
              />

              {/* Optional Landmark Overlays */}
              {showLandmarkOverlays && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/85 border border-cyan-500/40 text-cyan-300">
                      Resolution: Verified Optical Frame
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/85 border border-emerald-500/40 text-emerald-300">
                      Biometrics: Analyzed
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-56 h-72 rounded-[46%] border-2 border-dashed border-cyan-400/60 relative flex flex-col items-center justify-between p-4">
                      <div className="w-full flex items-center justify-around mt-8">
                        <div className="px-2 py-1 rounded border border-cyan-400 bg-cyan-500/20 text-[9px] font-mono text-cyan-200">
                          R Eye Landmark
                        </div>
                        <div className="px-2 py-1 rounded border border-cyan-400 bg-cyan-500/20 text-[9px] font-mono text-cyan-200">
                          L Eye Landmark
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded border border-cyan-400 bg-cyan-500/20 text-[9px] font-mono text-cyan-200 mb-6">
                        Oral Commissure & Lips
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-300 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700">
                      Diagnostic Zones: Ocular Sclera • Bilateral Facial Axis • Lip Perfusion
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {isHi
                  ? 'चेहरे की यह फोटो केवल परामर्श विश्लेषण के लिए सुरक्षित रखी गई है।'
                  : 'Photo is securely stored for clinical telehealth consultation verification.'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoLightboxOpen(false);
                    handleCaptureAndScan();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isHi ? 'नई फोटो लें' : 'Retake Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  {isHi ? 'ठीक है' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


