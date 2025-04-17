import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px'
        }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>
            <summary>Show Error Details</summary>
            <p style={{ color: '#d32f2f' }}>{this.state.error?.toString()}</p>
            <p style={{ color: '#666' }}>Component Stack:</p>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              overflow: 'auto', 
              maxHeight: '300px' 
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 