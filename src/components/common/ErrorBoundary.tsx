import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by boundary:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              Don't worry, this happens sometimes. Try refreshing the page or click retry.
            </p>
            <button
              onClick={this.retry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fast fallback component
export const FastFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex items-center justify-center min-h-[200px] p-4">
    <div className="text-center max-w-md">
      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
      <p className="text-gray-600 mb-3 font-semibold">Page failed to load</p>
      {error && (
        <div className="mb-3 p-2 bg-red-50 rounded text-left">
          <p className="text-xs text-red-700 font-mono break-all">
            {error.message || 'Unknown error'}
          </p>
          {error.stack && (
            <details className="mt-2 text-xs text-red-600">
              <summary className="cursor-pointer">Show stack trace</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">{error.stack}</pre>
            </details>
          )}
        </div>
      )}
      <button
        onClick={retry}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  </div>
);