import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Simple QuickLogin component
const QuickLogin = () => {
  const users = [
    { id: 'admin-1', name: 'Ahmed Hassan', email: 'admin@sm.com', role: 'admin' },
    { id: 'support-1', name: 'Fatma Ali', email: 'support@sm.com', role: 'support' },
    { id: 'manager-1', name: 'Mohamed Saeed', email: 'manager@sm.com', role: 'manager' },
    { id: 'user-1', name: 'Sara Mahmoud', email: 'user1@sm.com', role: 'user' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">SaleMate</h1>
            <p className="text-gray-600 mt-2">Choose a user to login (Demo Mode)</p>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-blue-600 mt-1 capitalize">{user.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Dashboard
const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">SaleMate Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">My Leads</h2>
            <p className="text-gray-600">Manage your lead pipeline</p>
            <div className="mt-4 text-2xl font-bold text-gray-900">24</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Shop</h2>
            <p className="text-gray-600">Purchase new leads</p>
            <div className="mt-4 text-2xl font-bold text-gray-900">6 Projects</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Community</h2>
            <p className="text-gray-600">Connect with agents</p>
            <div className="mt-4 text-2xl font-bold text-gray-900">12 Posts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App with simple routing
const DebugApp = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/quick" element={<QuickLogin />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/auth/quick" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>
);

