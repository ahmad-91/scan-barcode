import React, { useState } from 'react';
import './ProductDisplay.css';

const ProductDisplay = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Handle different possible response structures from the API
  const productName =
    product.name ||
    product.product_name ||
    product.title ||
    product.description ||
    'Product Name Not Available';

  const productImage =
    product.image ||
    product.product_image ||
    product.images?.[0] ||
    product.image_url ||
    null;

  const gtin = product.gtin || product.gtin13 || product.gtin14 || product.upc || 'N/A';
  const brand = product.brand || product.manufacturer || 'N/A';
  const description = product.description || product.product_description || null;
  const price = product.price || product.price_amount || null;
  const category = product.category || product.product_category || null;
  
  // Check for incomplete data
  const missingFields = product.missingFields || [];
  const hasIncompleteData = product.hasIncompleteData || false;

  return (
    <div className="product-display">
      <h2>Product Information</h2>
      
      {hasIncompleteData && missingFields.length > 0 && (
        <div className="data-warning" role="alert">
          <div className="warning-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>بيانات ناقصة</span>
          </div>
          <p className="warning-text">
            البيانات التالية غير متوفرة لهذا المنتج:
          </p>
          <ul className="missing-fields-list">
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="product-content">
        {productImage && !imageError ? (
          <div className="product-image-container">
            {imageLoading && (
              <div className="image-loading">
                <div className="spinner-small"></div>
              </div>
            )}
            <img
              src={productImage}
              alt={productName}
              className={`product-image ${imageLoading ? 'loading' : ''}`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="product-image-container">
            <div className="image-placeholder" role="img" aria-label="No product image available">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p>No Image Available</p>
            </div>
          </div>
        )}

        <div className="product-details">
          <h3 className="product-name">{productName}</h3>

          <div className="product-info">
            <div className="info-item">
              <span className="info-label">GTIN/UPC:</span>
              <span className="info-value">{gtin}</span>
            </div>

            {brand !== 'N/A' && (
              <div className="info-item">
                <span className="info-label">Brand:</span>
                <span className="info-value">{brand}</span>
              </div>
            )}

            {price && (
              <div className="info-item">
                <span className="info-label">Price:</span>
                <span className="info-value">{price}</span>
              </div>
            )}

            {category && (
              <div className="info-item">
                <span className="info-label">Category:</span>
                <span className="info-value">{category}</span>
              </div>
            )}

            {description && (
              <div className="info-item full-width">
                <span className="info-label">Description:</span>
                <span className="info-value">{description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplay;

