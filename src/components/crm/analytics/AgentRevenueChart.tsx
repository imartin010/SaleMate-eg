import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgentRevenue } from '../../../hooks/crm/useCRMAnalytics';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface AgentRevenueChartProps {
  data: AgentRevenue[];
  loading?: boolean;
}

export function AgentRevenueChart({ data, loading }: AgentRevenueChartProps) {
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
        No agent revenue data available
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((agent) => ({
    name: agent.agent_name || 'Unknown',
    totalRevenue: Number(agent.total_revenue.toFixed(2)),
    closedDealsRevenue: Number(agent.closed_deals_revenue.toFixed(2)),
    avgRevenuePerLead: agent.avg_revenue_per_lead ? Number(agent.avg_revenue_per_lead.toFixed(2)) : 0,
    avgRevenuePerClosedDeal: agent.avg_revenue_per_closed_deal ? Number(agent.avg_revenue_per_closed_deal.toFixed(2)) : 0,
  }));

  return (
    <div ref={ref} className="w-full space-y-6">
      {/* Total Revenue Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Total Revenue by Agent</h3>
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
              formatter={(value: number) => [
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(value),
                '',
              ]}
            />
            <Legend />
            <Bar 
              dataKey="totalRevenue" 
              fill="#10b981" 
              name="Total Revenue" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar 
              dataKey="closedDealsRevenue" 
              fill="#3b82f6" 
              name="Closed Deals Revenue" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={200}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Revenue Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Average Revenue per Lead/Deal</h3>
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
              formatter={(value: number) => [
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(value),
                '',
              ]}
            />
            <Legend />
            <Bar 
              dataKey="avgRevenuePerLead" 
              fill="#8b5cf6" 
              name="Avg Revenue per Lead" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar 
              dataKey="avgRevenuePerClosedDeal" 
              fill="#f59e0b" 
              name="Avg Revenue per Closed Deal" 
              radius={[8, 8, 0, 0]}
              isAnimationActive={shouldAnimate}
              animationBegin={200}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

