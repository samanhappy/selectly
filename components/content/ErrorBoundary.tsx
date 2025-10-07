import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.warn('[Selectly][ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail in content script to avoid breaking host page
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
