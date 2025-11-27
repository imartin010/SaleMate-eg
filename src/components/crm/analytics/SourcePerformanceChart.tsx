import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { SourcePerformance } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';

interface SourcePerformanceChartProps {
  data: SourcePerformance[];
  loading?: boolean;
}

export function SourcePerformanceChart({ data, loading }: SourcePerformanceChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No source performance data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((source) => ({
    source: source.source.charAt(0).toUpperCase() + source.source.slice(1),
    roi: Number(source.roi_percentage.toFixed(2)),
    cost: Number(source.total_cost.toFixed(2)),
    revenue: Number(source.total_revenue.toFixed(2)),
    conversionRate: source.conversion_rate,
  }));

  // Color function for ROI bars
  const getROIColor = (roi: number) => {
    if (roi >= 0) return '#10b981'; // green
    return '#ef4444'; // red
  };

  return (
    <div className="w-full space-y-6">
      {/* ROI Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">ROI by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="source" tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
            />
            <Legend />
            <Bar dataKey="roi" name="ROI %" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getROIColor(entry.roi)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost vs Revenue Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Cost vs Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="source" tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(value),
                '',
              ]}
            />
            <Legend />
            <Bar dataKey="cost" fill="#ef4444" name="Cost" radius={[8, 8, 0, 0]} />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

