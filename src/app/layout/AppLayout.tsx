import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Logo } from '../../components/common/Logo';
import { ProfileDebug } from '../../components/common/ProfileDebug';
import { TestConnection } from '../../components/common/TestConnection';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Always visible when authenticated */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Logo */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-center">
            <Logo variant="icon" size="xl" className="scale-125" />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
      
      {/* Debug Components */}
      <ProfileDebug />
      <TestConnection />
    </div>
  );
};