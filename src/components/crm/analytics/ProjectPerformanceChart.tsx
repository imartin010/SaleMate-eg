import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProjectPerformance } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface ProjectPerformanceChartProps {
  data: ProjectPerformance[];
  loading?: boolean;
}

export function ProjectPerformanceChart({ data, loading }: ProjectPerformanceChartProps) {
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
        No project performance data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((project) => ({
    name: project.project_name || 'Unknown',
    conversionRate: project.conversion_rate,
  }));

  return (
    <div ref={ref} className="w-full">
      {/* Conversion Rate Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Conversion Rate by Project</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
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
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

