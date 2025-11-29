import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Smartphone, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap 
} from 'lucide-react';

const ValueGrid = () => {
  const values = [
    {
      icon: Users,
      title: 'Lead Management',
      description: 'Organize and track all your leads in one place with our intuitive CRM system. Manage your pipeline from first contact to closed deal.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      delay: 0
    },
    {
      icon: TrendingUp,
      title: 'Performance Tracking',
      description: 'See how you and your team are performing with real-time analytics, conversion rates, and revenue tracking.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      delay: 0.1
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations and insights to help you close more deals and improve your sales process.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      delay: 0.2
    },
    {
      icon: Smartphone,
      title: 'Financial Tracking',
      description: 'Track revenue, commissions, ROI, and financial performance across all your leads and deals.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      delay: 0.3
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'RLS security, role-based access controls, and complete audit trail for your peace of mind.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      delay: 0.4
    },
    {
      icon: ShoppingCart,
      title: 'Lead Marketplace',
      description: 'Coming soon: Browse and purchase verified leads from top projects. Launching in Month 2.',
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
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
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SaleMate CRM
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The AI-enabled CRM platform built specifically for real estate professionals. Manage leads, track performance, and close more deals.
          </p>
        </motion.div>

        {/* Value proposition grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
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
                <Card className={`h-full p-6 ${value.bgColor} ${value.borderColor} border-2 hover:shadow-xl transition-all duration-300 group`}>
                  {/* Icon */}
                  <motion.div 
                    className={`w-14 h-14 rounded-xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300`}
                    variants={iconVariants}
                    whileHover="hover"
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors">
                    {value.title}
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
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
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">
              Join 2,500+ agents already using SaleMate
            </span>
          </div>
          
          <motion.p 
            className="text-slate-600 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Request access to our AI-enabled CRM platform. 
            Track performance, analyze data, and close more deals. Contract-based SaaS with dedicated support.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ValueGrid;
