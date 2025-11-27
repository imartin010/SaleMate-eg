import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AgentPerformance } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface AgentPerformanceChartProps {
  data: AgentPerformance[];
  loading?: boolean;
  onAgentClick?: (agentId: string) => void;
}

export function AgentPerformanceChart({ data, loading, onAgentClick }: AgentPerformanceChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView && !shouldAnimate) {
      // Small delay to ensure chart is rendered before animation starts
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
        No agent performance data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((agent) => ({
    name: agent.agent_name || 'Unknown',
    leads: agent.total_leads,
    closed: agent.closed_deals,
    conversionRate: agent.conversion_rate,
    avgResponseTime: agent.avg_response_time_hours ? Number(agent.avg_response_time_hours.toFixed(1)) : 0,
  }));

  return (
    <div ref={ref} className="w-full min-h-[400px]">
      <ResponsiveContainer width="100%" height={400}>
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
              formatter={(value: number, name: string) => {
                if (name === 'conversionRate') {
                  return [`${value.toFixed(2)}%`, 'Conversion Rate'];
                }
                if (name === 'avgResponseTime') {
                  return [`${value}h`, 'Avg Response Time'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="leads"
              fill="#3b82f6"
              name="Total Leads"
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={0}
              animationDuration={800}
              onClick={(entry: typeof chartData[0]) => {
                if (onAgentClick && entry.name) {
                  const agent = data.find((a: AgentPerformance) => a.agent_name === entry.name);
                  if (agent) onAgentClick(agent.agent_id);
                }
              }}
              style={{ cursor: onAgentClick ? 'pointer' : 'default' }}
            />
            <Bar
              dataKey="closed"
              fill="#10b981"
              name="Closed Deals"
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={200}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
    </div>
  );
}

