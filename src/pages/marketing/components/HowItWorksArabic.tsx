import { motion } from 'framer-motion';

const HowItWorksArabic = () => {
  const steps = [
    {
      number: '01',
      title: 'إنشاء حساب مجاني',
      description: 'سجل في دقائق واحصل على وصول فوري لنظام CRM المجاني'
    },
    {
      number: '02', 
      title: 'تصفح العملاء المحتملين',
      description: 'اختر من مئات العملاء المحتملين المتحققين في مشاريع مختلفة'
    },
    {
      number: '03',
      title: 'ابدأ البيع',
      description: 'تواصل مع العملاء واغلق الصفقات بعمولات أعلى'
    }
  ];

  return (
    <section className="py-20 bg-slate-50" dir="rtl">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            كيف يعمل{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              سيل ميت؟
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            ثلاث خطوات بسيطة للبدء في كسب المزيد من العمولات
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksArabic;
