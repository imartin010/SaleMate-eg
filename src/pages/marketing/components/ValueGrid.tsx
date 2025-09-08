import React from 'react';
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
      icon: ShoppingCart,
      title: 'Buy Qualified Leads',
      description: 'Project-tagged, compliant, duplicate-checked leads ready to convert.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      delay: 0
    },
    {
      icon: Smartphone,
      title: 'Free CRM Included',
      description: 'Complete pipeline management with stages, notes, WhatsApp and phone actions.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      delay: 0.1
    },
    {
      icon: TrendingUp,
      title: 'Higher Commissions with Partners',
      description: 'Close under our partner brands to earn 15-25% higher commissions.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      delay: 0.2
    },
    {
      icon: Users,
      title: 'Agent Community',
      description: 'Connect with posts and network with top agents across Egypt.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      delay: 0.3
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'RLS security, role-based access controls, and complete audit trail.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      delay: 0.4
    },
    {
      icon: Zap,
      title: 'Instant Start',
      description: 'Sign up today and start receiving qualified leads within hours.',
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
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        type: "spring",
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
              SaleMate
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to generate, manage, and close more real estate deals in Egypt
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
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            Start with our free CRM and buy your first leads today. 
            No setup fees, no monthly subscriptions, pay only for what you need.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ValueGrid;
