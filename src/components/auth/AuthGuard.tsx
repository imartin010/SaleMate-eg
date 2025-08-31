import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthGuard: React.FC = () => {
  // For now, allow all access - auth system will be fully implemented later
  return <Outlet />;
};