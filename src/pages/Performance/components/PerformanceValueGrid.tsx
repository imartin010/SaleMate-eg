import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Shield, 
  Zap,
  Target,
  FileText
} from 'lucide-react';

const PerformanceValueGrid = () => {
  const values = [
    {
      icon: BarChart3,
      title: 'Real-Time Performance Tracking',
      description: 'Monitor franchise performance with live metrics, transaction tracking, and comprehensive analytics dashboards.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      delay: 0
    },
    {
      icon: DollarSign,
      title: 'Financial Management',
      description: 'Track revenue, expenses, and P&L statements with automated commission calculations and payout forecasting.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      delay: 0.1
    },
    {
      icon: TrendingUp,
      title: 'Transaction Analytics',
      description: 'Monitor deal pipeline from EOI to contracted stage with stage-based tracking and revenue forecasting.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      delay: 0.2
    },
    {
      icon: PieChart,
      title: 'Expense Tracking',
      description: 'Categorize and monitor fixed and variable expenses with detailed reporting and budget analysis.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      delay: 0.3
    },
    {
      icon: Target,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations and forecasting to optimize performance and make data-driven decisions.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      delay: 0.4
    },
    {
      icon: FileText,
      title: 'Comprehensive Reporting',
      description: 'Generate detailed P&L statements, performance reports, and financial summaries with export capabilities.',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      delay: 0.5
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div 
          className="text-center mb-10 sm:mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4 px-2 sm:px-0">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Performance Platform
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4 sm:px-0">
            A comprehensive financial management platform designed for franchise operations with real-time tracking and AI-powered insights
          </p>
        </motion.div>

        {/* Value proposition grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
              >
                <Card className={`h-full p-4 sm:p-6 ${value.bgColor} ${value.borderColor} border-2 hover:shadow-xl transition-all duration-300 group`}>
                  {/* Icon */}
                  <motion.div 
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:shadow-lg transition-shadow duration-300`}
                    variants={iconVariants}
                    whileHover="hover"
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3 group-hover:text-slate-900 transition-colors">
                    {value.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                    {value.description}
                  </p>

                  {/* Hover effect indicator */}
                  <motion.div 
                    className={`mt-4 h-1 bg-gradient-to-r ${value.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-10 sm:mt-12 lg:mt-16 px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 mb-4 sm:mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-slate-700">
              Trusted by franchise leaders across Egypt
            </span>
          </div>
          
          <motion.p 
            className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto px-2 sm:px-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Start tracking your franchise performance today. 
            Real-time insights, automated calculations, and AI-powered recommendations.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default PerformanceValueGrid;

