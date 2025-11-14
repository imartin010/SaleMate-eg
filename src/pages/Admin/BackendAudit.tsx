import React from 'react';
import { BackendAuditPanel } from '../../components/admin/BackendAuditPanel';
import { Settings } from 'lucide-react';

export default function BackendAudit() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/30 via-blue-50/20 to-white">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-8 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Backend Connection Audit</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive test of Supabase backend connectivity and services
          </p>
        </div>
        <BackendAuditPanel />
      </div>
    </div>
  );
}

