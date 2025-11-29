import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  BarChart3, 
  Package,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Sign Up & Get Started',
      description: 'Create your free account and get instant access to the AI-enabled CRM platform.',
      details: ['Free account creation', 'Instant CRM access', 'No credit card required'],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      number: 2,
      icon: Users,
      title: 'Manage Your Leads',
      description: 'Add, organize, and track leads through your sales pipeline with AI-powered insights.',
      details: ['Lead management', 'Pipeline tracking', 'AI coaching recommendations'],
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      number: 3,
      icon: BarChart3,
      title: 'Track Performance',
      description: 'Monitor your sales performance, conversion rates, and financial metrics in real-time.',
      details: ['Performance analytics', 'Financial tracking', 'ROI insights'],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      number: 4,
      icon: Package,
      title: 'Browse Real-Time Inventory',
      description: 'Access 30,000+ primary market units with real-time updates and detailed property information.',
      details: ['Real-time inventory', '30,000+ units', 'Detailed property data'],
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const stepVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
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

  return (
    <section id="how-it-works" className="py-20 bg-white">
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
            How It{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get started in minutes with our AI-enabled CRM and start managing your leads today
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div 
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Desktop timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-24 left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-green-200 to-orange-200 rounded-full" />
              
              <div className="grid grid-cols-4 gap-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      variants={stepVariants}
                      className="relative"
                      whileHover={{ y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r ${step.color} rounded-full border-4 border-white shadow-lg z-10`} />
                      
                      {/* Card */}
                      <div className={`${step.bgColor} rounded-2xl p-6 border-2 border-opacity-20 hover:border-opacity-40 transition-all duration-300 mt-32`}>
                        {/* Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Step number */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-6 h-6 bg-gradient-to-r ${step.color} text-white text-sm font-bold rounded-full flex items-center justify-center`}>
                            {step.number}
                          </span>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {step.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-slate-600 mb-4 text-sm">
                          {step.description}
                        </p>

                        {/* Details */}
                        <ul className="space-y-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Arrow (except for last step) */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-24 -right-4 transform -translate-y-1/2 z-20">
                          <ArrowRight className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={stepVariants}
                  className="relative"
                >
                  <div className={`${step.bgColor} rounded-2xl p-6 border-2 border-opacity-20`}>
                    {/* Step header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-6 h-6 bg-gradient-to-r ${step.color} text-white text-sm font-bold rounded-full flex items-center justify-center`}>
                            {step.number}
                          </span>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-slate-600 mb-3">
                          {step.description}
                        </p>

                        {/* Details */}
                        <ul className="space-y-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Connector line (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4">
                      <div className="w-px h-8 bg-gradient-to-b from-slate-300 to-slate-100" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full border border-green-200/50 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-700">
              Average setup time: 2 minutes
            </span>
          </div>
          
          <p className="text-slate-600 max-w-xl mx-auto">
            Ready to get started? Request access to our AI-enabled CRM platform and we'll contact you to set up your account.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
