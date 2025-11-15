/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple test component
const TestApp = () => {
  return (
    <div className="p-4 bg-blue-500 text-white">
      <h1 className="text-2xl font-bold">SaleMate Test</h1>
      <p>If you can see this, React is working!</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

