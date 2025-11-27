import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SourcePerformance } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface SourcePerformanceChartProps {
  data: SourcePerformance[];
  loading?: boolean;
}

export function SourcePerformanceChart({ data, loading }: SourcePerformanceChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView && !shouldAnimate) {
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isInView, shouldAnimate]);
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
  const chartData = data.map((source) => {
    const sourceName = source.source 
      ? source.source.charAt(0).toUpperCase() + source.source.slice(1) 
      : 'Unknown';
    const rate = typeof source.conversion_rate === 'string' 
      ? parseFloat(source.conversion_rate) 
      : Number(source.conversion_rate) || 0;
    
    return {
      source: sourceName,
      conversionRate: rate,
    };
  });

  console.log('SourcePerformanceChart - data:', JSON.stringify(data, null, 2));
  console.log('SourcePerformanceChart - chartData:', JSON.stringify(chartData, null, 2));

  // Check if all values are zero
  const allZero = chartData.every(item => item.conversionRate === 0);

  return (
    <div ref={ref} className="w-full">
      {/* Conversion Rate Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Conversion Rate by Source</h3>
        {allZero && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            All conversion rates are currently 0%. This may be due to rounding of very small percentages.
          </div>
        )}
        
        {/* Data Table */}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left border border-gray-200">Source</th>
                <th className="px-4 py-2 text-right border border-gray-200">Total Leads</th>
                <th className="px-4 py-2 text-right border border-gray-200">Closed Deals</th>
                <th className="px-4 py-2 text-right border border-gray-200">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((source, idx) => {
                const sourceName = source.source 
                  ? source.source.charAt(0).toUpperCase() + source.source.slice(1) 
                  : 'Unknown';
                const rate = typeof source.conversion_rate === 'string' 
                  ? parseFloat(source.conversion_rate) 
                  : Number(source.conversion_rate) || 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200 font-medium">{sourceName}</td>
                    <td className="px-4 py-2 border border-gray-200 text-right">{source.total_leads.toLocaleString()}</td>
                    <td className="px-4 py-2 border border-gray-200 text-right">{source.closed_deals.toLocaleString()}</td>
                    <td className="px-4 py-2 border border-gray-200 text-right">{rate.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="source" 
                tick={{ fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#6b7280' }}
                domain={allZero ? [0, 1] : [0, 'dataMax']}
                allowDecimals={true}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Conversion Rate']}
              />
              <Legend />
            <Bar 
              dataKey="conversionRate" 
              fill="#3b82f6" 
              name="Conversion Rate %" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={0}
              animationDuration={800}
              minPointSize={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

