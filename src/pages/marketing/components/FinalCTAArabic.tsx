import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  ArrowLeft, 
  MessageCircle,
  Shield,
  Zap
} from 'lucide-react';

const FinalCTAArabic = () => {
  const features = [
    { icon: Users, text: 'CRM مجاني مدى الحياة' },
    { icon: Shield, text: 'بدون رسوم إعداد' },
    { icon: Zap, text: 'ابدأ في دقائق' }
  ];

  const floatingAnimation = {
    initial: { y: 0, rotate: 0 },
    animate: {
      y: [-20, 20, -20],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <section className="relative py-20 overflow-hidden" dir="rtl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
      
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Main headline */}
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              جاهز لتطوير{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                أعمالك العقارية؟
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
              انضم إلى منصة الجيل القادم وطور أعمالك العقارية من خلال شراكات موثوقة ورؤى مدفوعة بالبيانات. 
              بدون عقود، بدون رسوم إعداد، ابدأ رحلتك اليوم.
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
                <Link to="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white hover:bg-gray-100 rounded-lg shadow-xl transition-all duration-300 group">
                  <Sparkles className="w-5 h-5 ml-2 group-hover:animate-spin" />
                  إنشاء حساب مجاني
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="mailto:support@salemate.com" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border border-white/30 hover:bg-white/10 rounded-lg backdrop-blur-sm transition-all duration-300">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  تحدث مع الدعم
                </a>
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
                موثوق من قبل الوسطاء في أفضل شركات العقارات في مصر
              </p>
              
              {/* Social proof numbers */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">18,240+</div>
                  <div className="text-xs text-blue-200">عميل محتمل تم تسليمه</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.8/5</div>
                  <div className="text-xs text-blue-200">تقييم الوسطاء</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">98%</div>
                  <div className="text-xs text-blue-200">يوصون بالخدمة</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            className="absolute top-10 right-10 w-20 h-20 bg-white/5 rounded-full blur-xl"
            variants={floatingAnimation}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="absolute bottom-10 left-10 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"
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
          className="relative block w-full h-20 fill-white"
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          opacity=".25"
        />
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
          opacity=".5"
        />
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
        />
        </svg>
      </div>
    </section>
  );
};

export default FinalCTAArabic;
