import React from 'react';
import ErrorDisplay from './ErrorDisplay';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message || 'Something went wrong.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="container">
            <h1>Oops! Something went wrong</h1>
            <ErrorDisplay
              error={this.state.error}
              onRetry={this.handleReset}
            />
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                className="btn-error btn-retry"
              >
                Reload Page
              </button>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

