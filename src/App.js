import React, { useState, useCallback, useRef } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import ProductDisplay from './components/ProductDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import { fetchProductByBarcode } from './utils/api';
import { validateBarcode } from './utils/validation';
import './App.css';

function App() {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const lastBarcodeRef = useRef(null);

  const handleBarcodeScanned = useCallback(async (barcode) => {
    // Validate barcode format
    const validation = validateBarcode(barcode);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      setScanning(false);
      return;
    }

    // Store the barcode for retry functionality
    lastBarcodeRef.current = validation.value;

    setLoading(true);
    setError(null);
    setProductData(null);

    try {
      const data = await fetchProductByBarcode(validation.value);
      setProductData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch product data');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, []);

  const handleErrorDismiss = useCallback(() => {
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    // Retry with the last scanned barcode
    if (lastBarcodeRef.current) {
      handleBarcodeScanned(lastBarcodeRef.current);
    } else if (productData) {
      // Fallback: try to get barcode from product data
      const lastBarcode = productData.gtin || productData.gtin13 || productData.gtin14 || productData.upc;
      if (lastBarcode) {
        handleBarcodeScanned(lastBarcode.toString());
      }
    }
  }, [productData, handleBarcodeScanned]);

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Barcode Product Scanner</h1>
          <p>Scan a barcode to get product information</p>
        </header>

        <BarcodeScanner
          onScan={handleBarcodeScanned}
          scanning={scanning}
          setScanning={setScanning}
        />

        {loading && (
          <div className="loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>Loading product information...</p>
          </div>
        )}

        {error && (
          <ErrorDisplay
            error={error}
            onDismiss={handleErrorDismiss}
            onRetry={handleRetry}
          />
        )}

        {productData && <ProductDisplay product={productData} />}
      </div>
    </div>
  );
}

export default App;

