/*
 * Interactive QR Scanner Modal (Objective 5)
 * Utilizes "jsqr" for client-side QR code decoding.
 *
 * Capabilities:
 * - Live Camera Scanning via navigator.mediaDevices.getUserMedia
 * - Drag-and-Drop / File Upload fallback for environments without a webcam
 * - URL Parsing: supports both full verification URLs (/verify?id=PROD-1) and plain Product IDs
 * - Zero external API calls: runs strictly in browser memory
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  QrCode,
  FileImage,
} from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [detectedId, setDetectedId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Parse scanned string: extracts product ID whether it is a full URL or plain ID
   */
  const parseScannedData = useCallback((raw) => {
    if (!raw) return null;
    const clean = raw.trim();

    try {
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.includes('/verify') || clean.includes('/track')) {
        const urlObj = new URL(clean.startsWith('http') ? clean : `https://domain.local${clean}`);
        const idParam = urlObj.searchParams.get('id');
        if (idParam) return idParam.trim();

        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2 && (pathSegments[0] === 'track' || pathSegments[0] === 'verify' || pathSegments[0] === 'history')) {
          return decodeURIComponent(pathSegments[1]).trim();
        }
      }
    } catch {
      // not a valid URL structure, treat as plain ID
    }

    return clean;
  }, []);

  /**
   * Stop camera video tracks and animation loop
   */
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  /**
   * Start camera video stream and real-time canvas scan loop
   */
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or secure context (HTTPS/localhost required). Please use image upload.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        scanVideoFrame();
      }
    } catch (err) {
      console.warn('[QRScanner] Camera stream initialization failed:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or use the file upload option.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No video camera device detected on your system. Please use the QR file upload option.');
      } else {
        setCameraError(`Camera unavailable (${err.message}). Please use the QR image upload option.`);
      }
    }
  }, [stopCamera]);

  /**
   * Video frame processing loop
   */
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const prodId = parseScannedData(code.data);
        if (prodId) {
          setDetectedId(prodId);
          stopCamera();
          setTimeout(() => {
            onScan(prodId);
            onClose();
          }, 600);
          return;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  /**
   * Handle image file upload decoding
   */
  const handleFileUpload = (e) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const prodId = parseScannedData(code.data);
          if (prodId) {
            setDetectedId(prodId);
            setTimeout(() => {
              onScan(prodId);
              onClose();
            }, 600);
          } else {
            setUploadError('QR code detected, but unable to extract a valid Product ID.');
          }
        } else {
          setUploadError('No valid QR code found in this image. Please upload a clear QR code image.');
        }
      };
      img.onerror = () => setUploadError('Failed to read the uploaded image file.');
      img.src = event.target.result;
    };
    reader.onerror = () => setUploadError('Failed to load file.');
    reader.readAsDataURL(file);
  };

  // Manage camera lifecycle based on modal open state and active tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDetectedId(null);
      setCameraError(null);
      setUploadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }} onClick={onClose}>
      <div
        className="modal-content modern-card"
        style={{ maxWidth: '520px', width: '92%', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)' }}>
              <QrCode size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Scan Product QR Code</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Verify authenticity against Hyperledger Fabric
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close QR scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setActiveTab('camera')}
          >
            <Camera size={14} />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} />
            <span>Upload QR Image</span>
          </button>
        </div>

        {/* Successful Detection Feedback */}
        {detectedId && (
          <div
            className="alert alert-success"
            style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CheckCircle2 size={18} />
            <div>
              <strong>QR Code Recognized!</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>
                Extracted Product ID: <code>{detectedId}</code>
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Camera Scanner */}
        {activeTab === 'camera' && (
          <div>
            {cameraError ? (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Camera Notice</strong>
                  <p style={{ margin: '4px 0 0' }}>{cameraError}</p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  background: '#000000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Reticle targeting overlay */}
                <div
                  style={{
                    position: 'absolute',
                    width: '190px',
                    height: '190px',
                    border: '2px solid rgba(16, 185, 129, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '14px', height: '14px', borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
                    <div style={{ width: '14px', height: '14px', borderTop: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '14px', height: '14px', borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
                    <div style={{ width: '14px', height: '14px', borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  Align product QR code within square
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isScanning ? 'Camera active & scanning...' : 'Camera standby'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={startCamera}
                title="Restart Camera"
              >
                <RefreshCw size={12} style={{ marginRight: '4px' }} />
                <span>Restart</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Image File Upload */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '8px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-main)',
                transition: 'border-color 0.2s',
              }}
            >
              <FileImage size={36} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Upload Product QR Code</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Drag and drop a QR image, or click to browse files
              </p>
              <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supports PNG, JPEG, WEBP
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            {uploadError && (
              <div className="alert alert-error" style={{ marginTop: '14px' }}>
                <AlertCircle size={16} />
                <div style={{ fontSize: '0.85rem' }}>{uploadError}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Offline client-side decoder (jsQR)</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
