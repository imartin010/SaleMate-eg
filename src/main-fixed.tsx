import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './app/layout/AppLayout';
import { ThemeProvider } from './app/providers/ThemeProvider';
// Import the simple auth store instead
// import { useAuthStore } from './store/auth-simple';
import './index.css';

// Simple theme provider without complex logic
const SimpleThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="light">{children}</div>;
};

// Simplified App Layout
const SimpleAppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">SaleMate</h1>
          <p className="text-gray-600 mt-2">Egyptian Real Estate Lead Management</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-blue-600 mb-2">Dashboard</h2>
            <p className="text-gray-600 text-sm">Overview and stats</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-green-600 mb-2">My Leads</h2>
            <p className="text-gray-600 text-sm">CRM and pipeline</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-purple-600 mb-2">Shop</h2>
            <p className="text-gray-600 text-sm">Buy leads</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-orange-600 mb-2">Community</h2>
            <p className="text-gray-600 text-sm">Connect with agents</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-md inline-block">
            <h3 className="text-lg font-semibold mb-4">Quick Login</h3>
            <div className="space-y-2">
              <button className="block w-full text-left p-3 rounded border hover:bg-gray-50">
                <div className="font-medium">Ahmed Hassan</div>
                <div className="text-sm text-gray-600">admin@sm.com - Admin</div>
              </button>
              <button className="block w-full text-left p-3 rounded border hover:bg-gray-50">
                <div className="font-medium">Sara Mahmoud</div>
                <div className="text-sm text-gray-600">user1@sm.com - User</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleThemeProvider>
      <BrowserRouter>
        <SimpleAppLayout />
      </BrowserRouter>
    </SimpleThemeProvider>
  </React.StrictMode>
);

