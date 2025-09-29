import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BackgroundDecor } from './Decor';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Sparkles,
  ArrowLeft,
  Play,
  Handshake,
  FileText,
  Phone,
  MessageCircle
} from 'lucide-react';
import { Logo } from '../../../components/common/Logo';

const HeroArabic = () => {
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Language Switcher */}
      <div className="absolute top-4 left-4 z-20">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg hover:bg-white transition-all duration-200 text-sm font-medium text-slate-700 hover:text-blue-600"
        >
          <span>🇺🇸</span>
          <span>English</span>
        </Link>
      </div>
      
      {/* Background decorations */}
      <BackgroundDecor />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse" />
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-xl opacity-40 animate-pulse" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            className="text-center lg:text-right"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center lg:justify-end mb-8"
              variants={fadeInUp}
            >
              <Logo className="h-12 w-auto" />
            </motion.div>

            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 mb-6"
              variants={fadeInUp}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                أكثر من 2,500 وسيط عقاري يستخدم منصتنا
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight"
              variants={fadeInUp}
            >
              منصة العقارات{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                المتقدمة
              </span>
              <br />
              للوسطاء المحترفين
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              variants={fadeInUp}
            >
              احصل على عملاء محتملين عالي الجودة، نظام CRM مجاني مدى الحياة، وشراكات مع أفضل الشركات العقارية في مصر
            </motion.p>

            {/* Feature highlights */}
            <motion.div 
              className="flex flex-wrap items-center justify-center lg:justify-end gap-6 mb-8"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">نظام CRM مجاني</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">عملاء محتملين يومياً</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="font-medium">عمولات أعلى</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end mb-12"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-xl transition-all duration-300 group">
                  <Sparkles className="w-5 h-5 ml-2 group-hover:animate-spin" />
                  ابدأ مجاناً الآن
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/demo" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-300 group">
                  <Play className="w-5 h-5 ml-2" />
                  شاهد العرض التوضيحي
                </Link>
              </motion.div>
            </motion.div>

            {/* CTA Card */}
            <motion.div 
              className="max-w-md mx-auto lg:mx-0 lg:ml-auto"
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {/* Main CTA Card */}
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">جاهز لتطوير عملك العقاري؟</h3>
                  <p className="text-sm text-slate-600">انضم لمئات الوسطاء الذين يستخدمون سيل ميت</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Sign Up Button - Primary */}
                  <motion.div 
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to="/auth/signup" className="block">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 group">
                        <Users className="w-4 h-4 ml-2" />
                        إنشاء حساب مجاني
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                  
                  {/* Demo Button - Secondary */}
                  <motion.div 
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to="/demo" className="block">
                      <Button variant="outline" className="w-full border-slate-300 hover:border-blue-400 font-semibold py-3">
                        <Play className="w-4 h-4 ml-2" />
                        تجربة المنصة
                      </Button>
                    </Link>
                  </motion.div>
                </div>
                
                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>آمن 100%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>بدون رسوم إعداد</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual Content */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Main Dashboard Preview */}
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl p-6 border border-slate-200/50"
              variants={floatingAnimation}
              animate="animate"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">لوحة التحكم</h3>
                    <p className="text-xs text-slate-500">العملاء المحتملين اليوم</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border border-green-200">
                  +12 عميل جديد
                </Badge>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-1">2,340</div>
                  <div className="text-sm text-slate-600">عميل محتمل</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">125 ج.م</div>
                  <div className="text-sm text-slate-600">متوسط التكلفة</div>
                </div>
              </div>

              {/* Sample Lead Cards */}
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    أح
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 text-sm">أحمد حسن</h4>
                    <p className="text-xs text-slate-500">القاهرة الجديدة - مهتم بشقة</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                      <Phone className="w-3 h-3 ml-1" />
                      اتصال
                    </Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs">
                      <MessageCircle className="w-3 h-3 ml-1" />
                      واتساب
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    فا
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 text-sm">فاطمة الراشد</h4>
                    <p className="text-xs text-slate-500">الساحل الشمالي - فيلا للبيع</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                      <Phone className="w-3 h-3 ml-1" />
                      اتصال
                    </Button>
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 text-xs">
                      <FileText className="w-3 h-3 ml-1" />
                      عرض
                    </Button>
                  </div>
                </div>
              </div>

              {/* Partnership Badge */}
              <motion.div 
                className="absolute -top-4 -left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Handshake className="w-3 h-3 inline ml-1" />
                شراكة نوي
              </motion.div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-8 -right-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl shadow-xl"
              animate={{ y: [-5, 5, -5], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            >
              <TrendingUp className="w-6 h-6" />
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl shadow-lg"
              animate={{ y: [5, -5, 5], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            >
              <Shield className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroArabic;
