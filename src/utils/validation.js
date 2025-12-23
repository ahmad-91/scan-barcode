/**
 * Validation utilities
 */

import { BARCODE_MIN_LENGTH, BARCODE_MAX_LENGTH } from './constants';

/**
 * Validate barcode format
 */
export const validateBarcode = (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    return { valid: false, error: 'Barcode is required.' };
  }

  const trimmed = barcode.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Barcode cannot be empty.' };
  }

  if (trimmed.length < BARCODE_MIN_LENGTH || trimmed.length > BARCODE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Barcode must be between ${BARCODE_MIN_LENGTH} and ${BARCODE_MAX_LENGTH} digits.`,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Barcode must contain only numbers.' };
  }

  return { valid: true, error: null, value: trimmed };
};

/**
 * Format barcode for display
 */
export const formatBarcode = (barcode) => {
  if (!barcode) return '';
  return barcode.trim().replace(/\s/g, '');
};



