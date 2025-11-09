import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { HomeHeader } from '../../components/home/HomeHeader';
import { ComplianceHeader } from '../../components/common/ComplianceHeader';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/app' || location.pathname === '/app/home' || location.pathname === '/app/dashboard';
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Always visible when authenticated */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Public compliance header */}
        <ComplianceHeader />

        {/* HomeHeader - Used for all pages */}
        <HomeHeader />
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {/* All pages manage their own containers and padding now */}
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
      
      {/* Debug Components - Removed for production */}
      {/* <ProfileDebug />
      <TestConnection /> */}
    </div>
  );
};