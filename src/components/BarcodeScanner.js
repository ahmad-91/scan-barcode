import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ErrorDisplay from './ErrorDisplay';
import { CAMERA_CONFIG, ERROR_MESSAGES } from '../utils/constants';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, scanning, setScanning }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isScannerRunningRef = useRef(false);
  const scannerIdRef = useRef(`scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [manualInput, setManualInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup effect - runs on unmount
  useEffect(() => {
    return () => {
      // CRITICAL: Stop scanner synchronously before React unmounts
      if (html5QrCodeRef.current && isScannerRunningRef.current) {
        const scannerInstance = html5QrCodeRef.current;
        isScannerRunningRef.current = false;
        html5QrCodeRef.current = null;
        
        // Stop synchronously - don't wait for async operations
        try {
          // Check if we can stop it
          const stopPromise = scannerInstance.stop();
          // Fire and forget - don't wait
          stopPromise.catch(() => {});
          
          // Clear immediately after a microtask
          Promise.resolve().then(() => {
            try {
              scannerInstance.clear();
            } catch (e) {
              // Ignore
            }
          });
        } catch (err) {
          // Ignore all errors
        }
      }
      
      // Remove body class
      try {
        document.body.classList.remove('scanner-active');
      } catch (err) {
        // Ignore
      }
    };
  }, []);
  
  // Cleanup when scanning becomes false
  useEffect(() => {
    if (!scanning && html5QrCodeRef.current && isScannerRunningRef.current) {
      const scannerInstance = html5QrCodeRef.current;
      isScannerRunningRef.current = false;
      
      // Clean up after a delay to let stop() complete
      const timer = setTimeout(() => {
        try {
          if (scannerInstance) {
            scannerInstance.clear();
          }
        } catch (err) {
          // Ignore
        }
        html5QrCodeRef.current = null;
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [scanning]);

  const stopScanning = useCallback(async () => {
    // Mark as not running immediately to prevent new operations
    isScannerRunningRef.current = false;
    
    try {
      if (html5QrCodeRef.current) {
        const scannerInstance = html5QrCodeRef.current;
        
        try {
          await scannerInstance.stop();
        } catch (stopErr) {
          // Scanner might already be stopped, that's okay
        }
        
        // Don't clear immediately - let the effect handle it
        // This prevents React from trying to remove nodes the library manages
      }
      
      setScanning(false);
      document.body.classList.remove('scanner-active');
    } catch (err) {
      // Ensure state is reset even if there's an error
      setScanning(false);
      document.body.classList.remove('scanner-active');
    }
  }, [setScanning]);

  const handleScanSuccess = useCallback((barcode) => {
    document.body.classList.remove('scanner-active');
    stopScanning();
    onScan(barcode);
  }, [stopScanning, onScan]);

  const startScanning = useCallback(async () => {
    // Prevent starting if already running
    if (isScannerRunningRef.current) {
      return;
    }

    try {
      setScanning(true);
      
      // Prevent body scroll on mobile when scanner is active
      if (isMobile) {
        document.body.classList.add('scanner-active');
      }
      
      // Clean up any existing instance before creating a new one
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop().catch(() => {});
          html5QrCodeRef.current.clear();
        } catch (err) {
          // Ignore cleanup errors
        }
        html5QrCodeRef.current = null;
      }
      
      // Ensure scanner element exists
      if (!scannerRef.current) {
        throw new Error('Scanner element not found');
      }
      
      // Set the ID on the element if not already set
      const elementId = scannerRef.current.id || scannerIdRef.current;
      if (!scannerRef.current.id) {
        scannerRef.current.id = elementId;
      }
      
      html5QrCodeRef.current = new Html5Qrcode(elementId);

      // Calculate responsive qrbox size for mobile
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const qrboxSize = isMobile 
        ? Math.min(
            viewportWidth * CAMERA_CONFIG.qrbox.mobile.widthRatio,
            viewportHeight * CAMERA_CONFIG.qrbox.mobile.heightRatio,
            CAMERA_CONFIG.qrbox.mobile.maxSize
          )
        : CAMERA_CONFIG.qrbox.desktop.width;

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: CAMERA_CONFIG.fps,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: CAMERA_CONFIG.aspectRatio,
          disableFlip: false,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent and expected)
        }
      );
      
      // Mark scanner as running only after successful start
      isScannerRunningRef.current = true;
      setCameraError(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
      
      // Clean up any partial initialization
      isScannerRunningRef.current = false;
      setScanning(false);
      document.body.classList.remove('scanner-active');
      
      // Try to clean up the scanner instance if it was created
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
        } catch (clearErr) {
          // Ignore clear errors
        }
        html5QrCodeRef.current = null;
      }
      
      let errorMessage = ERROR_MESSAGES.CAMERA_ERROR;
      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        errorMessage = ERROR_MESSAGES.CAMERA_PERMISSION;
      } else if (err.name === 'NotFoundError' || err.message.includes('camera')) {
        errorMessage = 'Camera not found. Please ensure your device has a camera.';
      }
      
      setCameraError(errorMessage);
    }
  }, [isMobile, setScanning, handleScanSuccess]);

  // Auto-start camera on mobile devices
  useEffect(() => {
    if (isMobile && !scanning) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        startScanning();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMobile, scanning, startScanning]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="barcode-scanner">
      {cameraError && (
        <ErrorDisplay
          error={cameraError}
          onDismiss={() => setCameraError(null)}
          onRetry={startScanning}
        />
      )}
      
      <div className={`scanner-container ${scanning && isMobile ? 'mobile-active' : ''}`}>
        <div
          ref={scannerRef}
          className={`scanner-view ${scanning ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
          role="region"
          aria-label="Barcode scanner"
        >
          {/* Always render placeholder, use CSS to hide when scanning */}
          <div 
            className={`scanner-placeholder ${scanning ? 'hidden' : ''}`}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            <p>{isMobile ? 'Camera will open automatically...' : 'Camera scanner will appear here'}</p>
          </div>
        </div>

        <div className="scanner-controls">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="btn btn-primary"
              aria-label="Start camera scanner"
            >
              {isMobile ? 'Open Camera' : 'Start Camera Scanner'}
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="btn btn-secondary"
              aria-label="Stop camera scanner"
            >
              Stop Scanner
            </button>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="manual-input">
          <p className="divider">OR</p>
          <form onSubmit={handleManualSubmit} className="input-form">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter barcode manually (GTIN/UPC/EAN)"
              className="barcode-input"
              aria-label="Barcode input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              aria-label="Lookup product by barcode"
            >
              Lookup Product
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;

