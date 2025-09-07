import React from 'react';
import { Link } from 'react-router-dom';

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h1>
          <p className="text-gray-600 mb-6">Password reset functionality coming soon...</p>
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 