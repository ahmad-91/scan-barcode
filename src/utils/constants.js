/**
 * Application constants
 */

export const BARCODE_FORMATS = {
  UPC: /^\d{12}$/,
  EAN: /^\d{13}$/,
  GTIN: /^\d{8,14}$/,
  ISBN: /^\d{10,13}$/,
};

export const BARCODE_MIN_LENGTH = 8;
export const BARCODE_MAX_LENGTH = 14;

export const CAMERA_CONFIG = {
  fps: 10,
  qrbox: {
    desktop: { width: 250, height: 250 },
    // Mobile: Use larger area for better barcode detection
    mobile: { widthRatio: 0.9, heightRatio: 0.7, maxSize: 400 },
  },
  aspectRatio: 1.0,
};

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'API key not configured. Please set REACT_APP_RAPIDAPI_KEY in environment variables.',
  INVALID_BARCODE: 'Invalid barcode format. Please enter a valid GTIN/UPC/EAN (8-14 digits).',
  PRODUCT_NOT_FOUND: 'Product not found. Please try another barcode.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT: 'Request timed out. The server is taking too long to respond. Please check your internet connection and try again.',
  CAMERA_PERMISSION: 'Camera permission denied. Please allow camera access in your browser settings.',
  CAMERA_ERROR: 'Failed to start camera. Please check your camera permissions and try again.',
};

