import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-display" role="alert">
      <div className="error-content">
        <svg
          className="error-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="error-message">{error}</p>
      </div>
      <div className="error-actions">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn-error btn-dismiss"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-error btn-retry"
            aria-label="Retry"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;



