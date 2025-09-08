import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  Users,
  Zap,
  Shield
} from 'lucide-react';
import { BackgroundDecor } from './Decor';

const FinalCTA = () => {
  const features = [
    { icon: Users, text: 'Free CRM forever' },
    { icon: Zap, text: 'Start in minutes' },
    { icon: Shield, text: 'No setup fees' }
  ];

  const floatingAnimation = {
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700" />
      <BackgroundDecor />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6"
              variants={floatingAnimation}
              initial="initial"
              animate="animate"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-medium text-sm">
                Join 2,500+ successful agents
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Start Closing More{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Deals This Week
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Get instant access to qualified leads and our complete CRM system. 
              No contracts, no setup fees, pay only for what you need.
            </motion.p>

            {/* Feature highlights */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.text}
                    className="flex items-center gap-2 text-white/90"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  >
                    <Icon className="w-5 h-5 text-green-300" />
                    <span className="font-medium">{feature.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg group shadow-xl">
                  <Link to="/auth/signup">
                    <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    Create Free Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg backdrop-blur-sm">
                  <a href="mailto:support@salemate.com">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Talk to Support
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-blue-200 text-sm mb-4">
                Trusted by agents at Egypt's top real estate companies
              </p>
              
              {/* Social proof numbers */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">18,240+</div>
                  <div className="text-xs text-blue-200">Leads delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.8/5</div>
                  <div className="text-xs text-blue-200">Agent rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">98%</div>
                  <div className="text-xs text-blue-200">Would recommend</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"
            variants={floatingAnimation}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"
            variants={floatingAnimation}
            initial="initial"
            animate="animate"
            style={{ animationDelay: '2s' }}
          />
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="relative block w-full h-16"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </div>
    </section>
  );
};

export default FinalCTA;
