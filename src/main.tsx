import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { QueryProvider } from './app/providers/QueryProvider';
import { AuthProvider } from './components/common/AuthProvider';
import { WalletProvider } from './contexts/WalletContext';
import './index.css';

// Production build - minimal logging
if (import.meta.env.DEV) {
  console.log('🚀 SaleMate app starting with complete auth system...');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

if (import.meta.env.DEV) {
  console.log('✅ Root element found, creating React app...');
}

// Simple error boundary for debugging
class DebugErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#dc2626' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280' }}>Check the console for details</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DebugErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <RouterProvider router={router} />
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </DebugErrorBoundary>
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  console.log('✅ SaleMate app rendered successfully');
}