import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BackgroundDecor, GradientOrb } from './Decor';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react';

const Hero = () => {
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
        ease: "easeInOut"
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
        {[...Array(20)].map((_, i) => (
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
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 py-24 lg:py-32 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                  <Shield className="w-3 h-3 mr-1" />
                  Free CRM
                </Badge>
                <Badge variant="secondary" className="bg-white/80 text-green-600 border-green-200">
                  <Users className="w-3 h-3 mr-1" />
                  Verified Sellers
                </Badge>
                <Badge variant="secondary" className="bg-white/80 text-purple-600 border-purple-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Partner Commissions
                </Badge>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                variants={fadeInUp}
              >
                Daily Fresh{' '}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Real-Estate Leads
                </span>{' '}
                in Egypt
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg md:text-xl text-slate-600 max-w-2xl mb-8 leading-relaxed"
                variants={fadeInUp}
              >
                Buy verified, high-intent leads and manage them with our free, powerful CRM. 
                Close under{' '}
                <span className="font-semibold text-blue-600">The Address Investments</span>,{' '}
                <span className="font-semibold text-purple-600">Bold Routes</span>,{' '}
                <span className="font-semibold text-green-600">Nawy</span>, or{' '}
                <span className="font-semibold text-orange-600">Coldwell Banker</span>{' '}
                to unlock higher commissions.
              </motion.p>

              {/* CTA buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                variants={fadeInUp}
              >
                <Button asChild size="lg" className="crm-button crm-button-primary group">
                  <Link to="/auth/signup">
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    Get Leads Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="group">
                  <a href="#how-it-works">
                    <Play className="w-5 h-5 mr-2" />
                    See How It Works
                  </a>
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>18,240+ leads delivered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>4 active partners</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Free CRM included</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right column - Visual */}
            <motion.div 
              className="relative flex justify-center lg:justify-end"
              variants={floatingAnimation}
              initial="initial"
              animate="animate"
            >
              <div className="relative w-full max-w-lg">
                {/* Main illustration placeholder */}
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4">
                    {/* Mock CRM interface */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="h-3 bg-slate-300 rounded w-20 mb-1"></div>
                          <div className="h-2 bg-slate-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Mock lead cards */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="bg-white/50 rounded-xl p-4 border border-white/30"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 + 0.5 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-2 bg-slate-300 rounded w-24"></div>
                          <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            New Capital
                          </div>
                        </div>
                        <div className="h-2 bg-slate-200 rounded w-32 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-blue-500 rounded w-16 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">Call</span>
                          </div>
                          <div className="h-6 bg-green-500 rounded w-20 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">WhatsApp</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating stats */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-xs text-slate-500 mb-1">This month</div>
                  <div className="text-lg font-bold text-green-600">+2,340</div>
                  <div className="text-xs text-slate-400">leads delivered</div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <div className="text-xs text-slate-500 mb-1">Avg. CPL</div>
                  <div className="text-lg font-bold text-blue-600">EGP 125</div>
                  <div className="text-xs text-slate-400">per lead</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
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

export default Hero;
