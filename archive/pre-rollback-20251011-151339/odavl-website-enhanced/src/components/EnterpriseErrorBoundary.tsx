/**
 * ODAVL Enterprise Error Boundary System
 * Comprehensive error handling with user feedback and monitoring integration
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { config } from '@/lib/config';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  buildVersion: string;
  environment: string;
}

export class EnterpriseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState(prevState => ({
      ...prevState,
      errorInfo,
      errorId,
    }));

    // Log error details
    this.logError(error, errorInfo, errorId);
    
    // Report to external services
    this.reportError(error, errorInfo, errorId);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Auto-retry for non-critical errors
    if (this.props.level !== 'critical' && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.handleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      sessionId: this.getSessionId(),
      buildVersion: config.version,
      environment: config.environment,
    };

    if (config.isDevelopment) {
      console.group(`🚨 Error Boundary - ${errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Details:', errorDetails);
      console.groupEnd();
    }

    // Store error for debugging
    this.storeErrorLocally(errorId, errorDetails);
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    if (!config.isProduction) return;

    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      sessionId: this.getSessionId(),
      buildVersion: config.version,
      environment: config.environment,
    };

    // Report to Sentry if configured
    if (config.analytics.sentryDsn && typeof window !== 'undefined') {
      try {
        // Would integrate with @sentry/nextjs
        console.log('Reporting to Sentry:', { errorId, errorDetails });
      } catch (sentryError) {
        console.error('Failed to report to Sentry:', sentryError);
      }
    }

    // Report to custom analytics
    this.reportToAnalytics(errorId, errorDetails);
  }

  private reportToAnalytics(errorId: string, errorDetails: ErrorDetails) {
    if (typeof window === 'undefined') return;

    try {
      // Custom analytics reporting
      const analyticsEvent = {
        event: 'error_boundary_triggered',
        errorId,
        level: this.props.level || 'component',
        ...errorDetails,
      };

      // Would integrate with analytics provider
      console.log('Reporting to analytics:', analyticsEvent);
    } catch (analyticsError) {
      console.error('Failed to report to analytics:', analyticsError);
    }
  }

  private storeErrorLocally(errorId: string, errorDetails: ErrorDetails) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `odavl_error_${errorId}`;
      const errorData = {
        ...errorDetails,
        retryCount: this.state.retryCount,
        level: this.props.level || 'component',
      };

      localStorage.setItem(storageKey, JSON.stringify(errorData));
      
      // Cleanup old errors (keep last 10)
      this.cleanupOldErrors();
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  }

  private cleanupOldErrors() {
    if (typeof window === 'undefined') return;

    try {
      const errorKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('odavl_error_'))
        .sort()
        .reverse();

      // Remove all but the 10 most recent
      errorKeys.slice(10).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup old errors:', cleanupError);
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    let sessionId = localStorage.getItem('odavl_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('odavl_session_id', sessionId);
    }
    return sessionId;
  }

  private scheduleRetry() {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, retryDelay);
  }

  private handleReset = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private handleRetry = () => {
    this.handleReset();
  };

  private handleReport = () => {
    if (this.state.error && this.state.errorInfo && this.state.errorId) {
      // Force re-report
      this.reportError(this.state.error, this.state.errorInfo, this.state.errorId);
      
      // Show user feedback
      if (typeof window !== 'undefined') {
        alert('Error report submitted. Thank you for helping us improve!');
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error, errorId, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    const errorStyles: React.CSSProperties = {
      padding: '2rem',
      margin: '1rem',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
    };

    const buttonStyles: React.CSSProperties = {
      padding: '0.5rem 1rem',
      margin: '0.25rem',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#dc2626',
      color: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
    };

    const criticalErrorStyles: React.CSSProperties = {
      ...errorStyles,
      border: '2px solid #dc2626',
      backgroundColor: '#fef2f2',
      textAlign: 'center',
    };

    if (level === 'critical') {
      return (
        <div style={criticalErrorStyles}>
          <h1 style={{ margin: '0 0 1rem 0' }}>🚨 Critical System Error</h1>
          <p>A critical error has occurred that prevents the application from functioning properly.</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Error ID: {errorId}
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button style={buttonStyles} onClick={() => window.location.reload()}>
              Reload Application
            </button>
            <button style={buttonStyles} onClick={this.handleReport}>
              Report Error
            </button>
          </div>
        </div>
      );
    }

    if (level === 'page') {
      return (
        <div style={errorStyles}>
          <h2 style={{ margin: '0 0 1rem 0' }}>⚠️ Page Error</h2>
          <p>This page encountered an error and couldn't load properly.</p>
          {config.isDevelopment && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Error Details</summary>
              <pre style={{ overflow: 'auto', fontSize: '0.75rem' }}>
                {error?.message}
                {error?.stack}
              </pre>
            </details>
          )}
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Error ID: {errorId} | Retry: {retryCount}/{maxRetries}
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button style={buttonStyles} onClick={this.handleRetry}>
              Try Again
            </button>
            <button style={buttonStyles} onClick={() => window.history.back()}>
              Go Back
            </button>
            <button style={buttonStyles} onClick={this.handleReport}>
              Report Issue
            </button>
          </div>
        </div>
      );
    }

    // Component level error
    return (
      <div style={errorStyles}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Component Error</h3>
        <p style={{ margin: '0 0 1rem 0' }}>
          A component failed to render properly.
        </p>
        {config.isDevelopment && (
          <details style={{ marginBottom: '1rem' }}>
            <summary>Error Details</summary>
            <pre style={{ overflow: 'auto', fontSize: '0.75rem' }}>
              {error?.message}
            </pre>
          </details>
        )}
        <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0 0 1rem 0' }}>
          Error ID: {errorId}
        </p>
        {retryCount < maxRetries && (
          <button style={buttonStyles} onClick={this.handleRetry}>
            Retry Component
          </button>
        )}
      </div>
    );
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnterpriseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnterpriseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// React Hook for error reporting
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, errorInfo?: { [key: string]: any }) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('Manual error report:', { error, errorInfo, errorId });
    
    // Report to analytics/monitoring
    if (config.isProduction && typeof window !== 'undefined') {
      try {
        const analyticsEvent = {
          event: 'manual_error_report',
          errorId,
          message: error.message,
          stack: error.stack,
          ...errorInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        };
        
        console.log('Manual error report:', analyticsEvent);
      } catch (reportingError) {
        console.error('Failed to report manual error:', reportingError);
      }
    }
    
    return errorId;
  }, []);

  return { reportError };
}

export default EnterpriseErrorBoundary;