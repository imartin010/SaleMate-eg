import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BackgroundDecor, GradientOrb } from '../../marketing/components/Decor';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Play,
  Shield,
  Target,
  DollarSign
} from 'lucide-react';
import { Logo } from '../../../components/common/Logo';

const PerformanceHero = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const floatingAnimation = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background decorations */}
      <BackgroundDecor />
      <GradientOrb size="xl" position="top-left" opacity="low" />
      <GradientOrb size="lg" position="bottom-right" opacity="low" />

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 pt-4 pb-16 sm:pb-24 lg:pt-6 lg:pb-32 z-10">
        <div className="max-w-6xl mx-auto">
          {/* Large Logo - Centered at the top */}
          <motion.div 
            className="flex justify-center mb-8 sm:mb-12"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Logo 
              variant="full" 
              size="xl" 
              className="scale-150 sm:scale-175 lg:scale-200 transform"
              logoUrl="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_performance_logo.png"
            />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left column - Content */}
            <motion.div 
              className="text-center lg:text-left"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Trust badges */}
              <motion.div 
                className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6"
                variants={fadeInUp}
              >
                <Badge variant="secondary" className="bg-white/80 text-blue-600 border-blue-200">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Performance Tracking
                </Badge>
                <Badge variant="secondary" className="bg-white/80 text-green-600 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Financial Analytics
                </Badge>
                <Badge variant="secondary" className="bg-white/80 text-purple-600 border-purple-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure & Compliant
                </Badge>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 px-2 sm:px-0"
                variants={fadeInUp}
              >
                <span className="text-slate-900">Track Your </span>
                <span className="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">Franchise Performance</span>
                <span className="text-slate-900"> with Real-Time Insights</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0"
                variants={fadeInUp}
              >
                Comprehensive financial management platform for franchise operations. Track transactions, monitor expenses, analyze P&L, and make data-driven decisions with AI-powered insights.
              </motion.p>

              {/* Creative CTA Section */}
              <motion.div 
                className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-0"
                variants={fadeInUp}
              >
                {/* Main CTA Card */}
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
                  <div className="text-center mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2">Ready to Optimize Your Performance?</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Join franchise leaders using our platform</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Login Button - Primary */}
                    <motion.div 
                      className="flex-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to="/auth/login" className="inline-flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group w-full">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-spin" />
                        <span className="font-semibold text-sm sm:text-base">Login to Dashboard</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>

                    {/* Learn More Button - Secondary */}
                    <motion.div 
                      className="flex-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <a href="#how-it-works" className="inline-flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-700 bg-white/80 border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group w-full">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-sm sm:text-base">Learn More</span>
                      </a>
                    </motion.div>
                  </div>

                  {/* Trust indicators inside card */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">Real-time data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">AI-powered insights</span>
                    </div>
                  </div>
                </div>
                
                {/* Secondary CTA */}
                <div className="flex justify-center">
                  <a href="#how-it-works" className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-medium text-slate-600 hover:text-blue-600 hover:bg-white/50 rounded-2xl transition-all duration-300 group">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                    See How It Works
                  </a>
                </div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 px-2 sm:px-0"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Financial analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>AI-powered insights</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right column - Visual */}
            <motion.div 
              className="relative flex justify-center lg:justify-end mt-8 lg:mt-0"
              variants={floatingAnimation}
              initial="initial"
              animate="animate"
            >
              <div className="relative w-full max-w-lg px-2 sm:px-0">
                {/* Main illustration placeholder */}
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mock Dashboard interface */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <div className="h-2 sm:h-3 bg-slate-300 rounded w-16 sm:w-24 mb-1"></div>
                          <div className="h-1.5 sm:h-2 bg-slate-200 rounded w-12 sm:w-20"></div>
                        </div>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Mock performance cards */}
                    {['Revenue', 'Expenses', 'Profit'].map((_, i) => (
                      <motion.div
                        key={i}
                        className="bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/30"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 + 0.5 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-1.5 sm:h-2 bg-slate-300 rounded w-12 sm:w-20"></div>
                          <div className="text-xs bg-blue-100 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="text-xs">+12.5%</span>
                          </div>
                        </div>
                        <div className="h-2 sm:h-3 bg-slate-200 rounded w-20 sm:w-32 mb-2"></div>
                        <div className="flex gap-1">
                          <div className="h-5 sm:h-6 bg-blue-500 rounded w-12 sm:w-16 flex items-center justify-center gap-1">
                            <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            <span className="text-xs text-white font-medium hidden sm:inline">Track</span>
                          </div>
                          <div className="h-5 sm:h-6 bg-green-500 rounded w-14 sm:w-20 flex items-center justify-center gap-1">
                            <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            <span className="text-xs text-white font-medium hidden sm:inline">Analyze</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating stats - hidden on very small screens */}
                <motion.div
                  className="hidden sm:block absolute -top-4 -right-4 bg-white rounded-xl p-2 sm:p-3 shadow-lg border border-gray-100"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-xs text-slate-500 mb-1">This month</div>
                  <div className="text-base sm:text-lg font-bold text-green-600">+24.3%</div>
                  <div className="text-xs text-slate-400">growth</div>
                </motion.div>

                <motion.div
                  className="hidden sm:block absolute -bottom-4 -left-4 bg-white rounded-xl p-2 sm:p-3 shadow-lg border border-gray-100"
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <div className="text-xs text-slate-500 mb-1">Active</div>
                  <div className="text-base sm:text-lg font-bold text-blue-600">22</div>
                  <div className="text-xs text-slate-400">franchises</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <motion.div 
        className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-1 h-3 bg-slate-400 rounded-full mt-2"
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default PerformanceHero;

