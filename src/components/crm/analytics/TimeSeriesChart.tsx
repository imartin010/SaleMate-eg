import React, { useRef, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeAnalytics } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface TimeSeriesChartProps {
  data: TimeAnalytics[];
  loading?: boolean;
}

export function TimeSeriesChart({ data, loading }: TimeSeriesChartProps) {
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
        No time series data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((period) => ({
    period: period.period_label,
    created: period.leads_created,
    closed: period.leads_closed,
    conversionRate: period.conversion_rate,
  }));

  return (
    <div ref={ref} className="w-full min-h-[400px]">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'conversionRate') {
                  return [`${value.toFixed(2)}%`, 'Conversion Rate'];
                }
                return [value, name === 'created' ? 'Leads Created' : 'Leads Closed'];
              }}
            />
            <Legend />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Leads Created"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={shouldAnimate}
            animationBegin={0}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="closed"
            stroke="#10b981"
            strokeWidth={2}
            name="Leads Closed"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={shouldAnimate}
            animationBegin={300}
            animationDuration={1000}
          />
          </LineChart>
        </ResponsiveContainer>
    </div>
  );
}

