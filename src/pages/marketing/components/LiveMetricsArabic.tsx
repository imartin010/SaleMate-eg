import { motion } from 'framer-motion';

const LiveMetricsArabic = () => {
  const metrics = [
    { value: '2,340+', label: 'عميل محتمل تم تسليمه', color: 'text-blue-600' },
    { value: '98%', label: 'معدل رضا العملاء', color: 'text-green-600' },
    { value: '125 ج.م', label: 'متوسط تكلفة العميل', color: 'text-purple-600' },
    { value: '24/7', label: 'دعم فني', color: 'text-orange-600' }
  ];

  return (
    <section className="py-16 bg-white" dir="rtl">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            أرقام{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              حية
            </span>
          </h2>
          <p className="text-slate-600">إحصائيات منصة سيل ميت في الوقت الحقيقي</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={`text-3xl md:text-4xl font-bold ${metric.color} mb-2`}>
                {metric.value}
              </div>
              <div className="text-sm text-slate-600">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveMetricsArabic;
