import React from 'react';

import { createLogger } from '../../utils/logger';

const logger = createLogger('ErrorBoundary');

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
    logger.warn(error, info);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail in content script to avoid breaking host page
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
