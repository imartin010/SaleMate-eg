import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users 
} from 'lucide-react';

const LiveMetrics = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const metrics = [
    {
      icon: TrendingUp,
      label: 'Leads delivered',
      sublabel: '(last 30 days)',
      value: 18240,
      prefix: '',
      suffix: '',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      animationDuration: 2000
    },
    {
      icon: DollarSign,
      label: 'Average CPL by project',
      sublabel: '',
      value: 125,
      prefix: 'EGP ',
      suffix: '–180',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      animationDuration: 1500
    },
    {
      icon: Clock,
      label: 'Median time to first contact',
      sublabel: '',
      value: 8,
      prefix: '',
      suffix: 'm 12s',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      animationDuration: 1000
    },
    {
      icon: Users,
      label: 'Active partners',
      sublabel: '',
      value: 4,
      prefix: '',
      suffix: '',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      animationDuration: 800
    }
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Live{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time metrics from our platform showing quality and performance
          </p>
          
          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-500 font-medium">Live data • Updated every 5 minutes</span>
          </div>
        </motion.div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <MetricCard 
                key={metric.label}
                metric={metric}
                index={index}
                isInView={isInView}
                Icon={Icon}
              />
            );
          })}
        </div>

        {/* Additional insights */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-1">98.5%</div>
              <div className="text-sm text-slate-600">Lead quality score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-1">2.3x</div>
              <div className="text-sm text-slate-600">Avg. conversion rate increase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 mb-1">24/7</div>
              <div className="text-sm text-slate-600">Platform availability</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MetricCard = ({ 
  metric, 
  index, 
  isInView, 
  Icon 
}: { 
  metric: any; 
  index: number; 
  isInView: boolean; 
  Icon: React.ElementType;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        animateValue();
      }, index * 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, index]);

  const animateValue = () => {
    const start = 0;
    const end = metric.value;
    const duration = metric.animationDuration;
    const increment = end / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 16);
  };

  const formatValue = (value: number) => {
    if (metric.label.includes('Leads delivered')) {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card className={`p-6 h-full ${metric.bgColor} ${metric.borderColor} border-2 hover:shadow-xl transition-all duration-300 group`}>
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${metric.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className="text-2xl md:text-3xl font-bold text-slate-800 flex items-baseline gap-1">
            <span>{metric.prefix}</span>
            <motion.span
              key={displayValue}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatValue(displayValue)}
            </motion.span>
            <span className="text-lg">{metric.suffix}</span>
          </div>
        </div>

        {/* Label */}
        <div>
          <h3 className="font-semibold text-slate-700 text-sm mb-1">
            {metric.label}
          </h3>
          {metric.sublabel && (
            <p className="text-xs text-slate-500">
              {metric.sublabel}
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <motion.div 
          className={`mt-4 h-1 bg-gradient-to-r ${metric.color} rounded-full`}
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
        />
      </Card>
    </motion.div>
  );
};

export default LiveMetrics;
