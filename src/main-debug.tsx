import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

console.log('🚀 Debug SaleMate app starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root element found, creating debug app...');

// Simple debug component
const DebugApp = () => {
  console.log('🔍 DebugApp component rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
        🐛 SaleMate Debug Mode
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '15px' }}>
          Debug Information
        </h2>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Environment:</strong> {import.meta.env.MODE}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>User Agent:</strong> {navigator.userAgent}
        </div>
        
        <button 
          onClick={() => {
            console.log('🔄 Reloading page...');
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Reload Page
        </button>
        
        <button 
          onClick={() => {
            console.log('🧹 Clearing localStorage...');
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#dc2626', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer'
          }}
        >
          Clear Storage & Reload
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>
          Console Logs
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Check the browser console (F12) for detailed error messages and logs.
        </p>
      </div>
    </div>
  );
};

// Error boundary for debugging
class DebugErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Debug Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Debug Error Boundary error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#dc2626' }}>Debug Error Boundary Caught Error</h1>
          <p style={{ color: '#6b7280' }}>Error: {this.state.error?.message}</p>
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

console.log('🎯 Rendering debug app...');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DebugErrorBoundary>
      <DebugApp />
    </DebugErrorBoundary>
  </React.StrictMode>
);

console.log('✅ Debug SaleMate app rendered successfully');

