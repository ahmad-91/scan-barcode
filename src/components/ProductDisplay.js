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

  return (
    <div className="product-display">
      <h2>Product Information</h2>
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

