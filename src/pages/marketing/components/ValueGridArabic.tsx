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

const ValueGridArabic = () => {
  const values = [
    {
      icon: ShoppingCart,
      title: 'متجر العملاء المحتملين الجديد',
      description: 'تواصل مع عملاء محتملين جدد ومتحققين يومياً من خلال منصة السوق الموثوقة.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      delay: 0
    },
    {
      icon: Smartphone,
      title: 'منصة CRM متكاملة',
      description: 'إدارة شاملة للعمليات مع رؤى مدفوعة بالبيانات وأدوات تواصل سلسة.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      delay: 0.1
    },
    {
      icon: TrendingUp,
      title: 'شراكات موثوقة',
      description: 'انضم إلى شبكة أفضل شركات الوساطة وافتح إمكانات ربح أعلى من خلال الشراكات.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      delay: 0.2
    },
    {
      icon: Users,
      title: 'مجتمع الوسطاء',
      description: 'تواصل مع المنشورات وتشبك مع أفضل الوسطاء في مصر.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      delay: 0.3
    },
    {
      icon: Shield,
      title: 'آمن ومتوافق',
      description: 'أمان RLS، ضوابط وصول قائمة على الأدوار، ومسار تدقيق كامل.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      delay: 0.4
    },
    {
      icon: Zap,
      title: 'بداية فورية',
      description: 'ابدأ في دقائق مع نظام CRM مجاني وشراء عملائك المحتملين الأوائل اليوم.',
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50" dir="rtl">
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
            لماذا يختار الوسطاء{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              سيل ميت؟
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            كل ما تحتاجه لتنمية أعمالك العقارية في منصة واحدة قوية
          </p>
        </motion.div>

        {/* Values grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                variants={cardVariants}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className={`h-full p-6 ${value.bgColor} ${value.borderColor} border-2 hover:shadow-xl transition-all duration-300 group`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-3">
                      {value.title}
                    </h3>
                    
                    <p className="text-slate-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>

                  {/* Hover effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-r ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
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
              انضم لأكثر من 2,500 وسيط يستخدم سيل ميت بالفعل
            </span>
          </div>
          
          <motion.p 
            className="text-slate-600 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            ابدأ بنظام CRM المجاني واشتر عملاءك المحتملين الأوائل اليوم. 
            بدون رسوم إعداد، بدون اشتراكات شهرية، ادفع فقط لما تحتاجه.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ValueGridArabic;
