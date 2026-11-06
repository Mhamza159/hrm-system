/**
 * @file ErrorBoundary.jsx
 * @description Application React Error Boundary.
 * Catches unhandled UI render crashes and renders an attributed ErrorState.
 */

import React from 'react';
import { ErrorState } from './ErrorState.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Unhandled React Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <ErrorState
            error={this.state.error}
            title="Component Rendering Interrupted"
            description="A client-side JavaScript error occurred while rendering this view."
            onRetry={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            onBack={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
