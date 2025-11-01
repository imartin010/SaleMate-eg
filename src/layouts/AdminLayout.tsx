import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopbar } from '../components/admin/AdminTopbar';
import { useAuthStore } from '../store/auth';
import { Navigate } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  const { profile } = useAuthStore();

  // Only allow admin and support roles
  if (!profile || !['admin', 'support'].includes(profile.role)) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <AdminTopbar />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

