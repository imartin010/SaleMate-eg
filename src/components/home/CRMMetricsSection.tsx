import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useLeadStore } from '../../features/leads/store/leads.store';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { supabase } from '../../lib/supabase';

interface CRMMetrics {
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  pipelineValue: number;
}

/**
 * CRM Metrics Section
 * Displays key CRM metrics and quick access to dashboard
 */
const CRMMetricsSection: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { leads, fetchLeads, loading } = useLeadStore();
  const [metrics, setMetrics] = useState<CRMMetrics>({
    totalLeads: 0,
    activeLeads: 0,
    conversionRate: 0,
    pipelineValue: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchLeads(user.id, true);
    }
  }, [user?.id, fetchLeads]);

  useEffect(() => {
    if (leads.length > 0) {
      const totalLeads = leads.length;
      const activeStages = ['Contacted', 'Qualified', 'Viewing Scheduled', 'Viewing Done', 'Negotiating', 'Hot Case'];
      const activeLeads = leads.filter(l => activeStages.includes(l.stage)).length;
      const closedDeals = leads.filter(l => l.stage === 'Closed Deal').length;
      const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
      const pipelineValue = activeLeads * 100000; // Placeholder calculation

      setMetrics({
        totalLeads,
        activeLeads,
        conversionRate,
        pipelineValue,
      });
    }
  }, [leads]);

  if (loading) {
    return (
      <div className="rounded-2xl md:rounded-3xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 md:p-8 border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 md:p-8 border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">AI-Enabled CRM</h2>
            <p className="text-sm text-gray-600">Your performance at a glance</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/crm/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          View Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-gray-600">Total Leads</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-xs text-gray-600">Active Leads</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.activeLeads}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-gray-600">Conversion</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.conversionRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <p className="text-xs text-gray-600">Pipeline Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(metrics.pipelineValue / 1000).toFixed(0)}K
          </p>
        </div>
      </div>
    </div>
  );
});

CRMMetricsSection.displayName = 'CRMMetricsSection';

export default CRMMetricsSection;

