import React from 'react';
import { motion } from 'framer-motion';
import { Users, Flame, Calendar, TrendingUp, UserPlus, Target } from 'lucide-react';
import { LeadStats } from '../../hooks/crm/useLeadStats';
import { Card } from '../ui/card';

interface StatsHeaderProps {
  stats: LeadStats;
  loading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: string;
  color: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const SkeletonCard: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </Card>
  );
};

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<Users className="h-6 w-6 text-blue-600" />}
        label="Total Leads"
        value={stats.totalLeads}
        color="bg-blue-50"
        delay={0}
      />
      <StatCard
        icon={<Flame className="h-6 w-6 text-orange-600" />}
        label="Hot Cases"
        value={stats.hotCases}
        color="bg-orange-50"
        delay={0.1}
      />
      <StatCard
        icon={<Calendar className="h-6 w-6 text-green-600" />}
        label="Meetings"
        value={stats.meetings}
        color="bg-green-50"
        delay={0.2}
      />
      <StatCard
        icon={<Target className="h-6 w-6 text-purple-600" />}
        label="Quality Rate"
        value={`${stats.qualityRate}%`}
        color="bg-purple-50"
        delay={0.3}
      />
    </div>
  );
};

