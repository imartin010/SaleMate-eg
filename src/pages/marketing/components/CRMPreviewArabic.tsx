import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  MessageCircle, 
  MapPin,
  ArrowLeft,
  FileText
} from 'lucide-react';

const CRMPreviewArabic = () => {
  // Mock lead data for demonstration - Arabic names
  const mockLeads = [
    {
      id: 1,
      name: 'أحمد حسن',
      project: 'القاهرة الجديدة',
      status: 'محتمل',
      phone: '+201234567890',
      avatar: 'أح'
    },
    {
      id: 2,
      name: 'فاطمة الراشد', 
      project: 'سيدي عبدالرحمن',
      status: 'عميل مهم',
      phone: '+201987654321',
      avatar: 'فا'
    },
    {
      id: 3,
      name: 'عمر محمود',
      project: 'مدينة المستقبل', 
      status: 'تم الاجتماع',
      phone: '+201555123456',
      avatar: 'عم'
    }
  ];

  // Metrics data
  const metrics = {
    costPerLead: 125,
    leadsDelivered: 2340,
    period: 'هذا الشهر'
  };

  // Get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'محتمل':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'عميل مهم':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'تم الاجتماع':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="py-12 md:py-20 bg-white" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            منصة{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CRM متكاملة
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6 px-4">
            أدر عملاءك المحتملين، تتبع التقدم، واغلق المزيد من الصفقات من خلال منصة CRM الجيل القادم مع رؤى مدفوعة بالبيانات
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>متجر العملاء المحتملين</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>رؤى مدفوعة بالبيانات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>شراكات موثوقة</span>
            </div>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Main CRM Interface */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl border border-slate-200/50">
            <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
              
              {/* Metrics Card */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="lg:col-span-1 order-2 lg:order-1"
              >
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-slate-100">
                  <div className="text-center">
                    <div className="text-xs md:text-sm text-slate-500 mb-2">{metrics.period}</div>
                    <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">+{metrics.leadsDelivered.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-slate-600 mb-4 md:mb-6">عميل محتمل تم تسليمه</div>
                    
                    <div className="border-t border-slate-100 pt-3 md:pt-4">
                      <div className="text-xs md:text-sm text-slate-500 mb-1">متوسط التكلفة</div>
                      <div className="text-xl md:text-2xl font-bold text-slate-800">{metrics.costPerLead} ج.م</div>
                      <div className="text-xs md:text-sm text-slate-500">لكل عميل</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Lead Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="lg:col-span-3 order-1 lg:order-2"
              >
                <div className="space-y-3 md:space-y-4">
                  {mockLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      variants={cardVariants}
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                          <div className="flex items-start gap-3 md:gap-4 flex-1 w-full">
                            {/* Avatar */}
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-semibold text-xs md:text-sm shadow-lg flex-shrink-0">
                              {lead.avatar}
                            </div>
                            
                            {/* Lead Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-slate-800 text-base md:text-lg truncate">{lead.name}</h4>
                                {/* Status Badge - moved to top on mobile */}
                                <Badge className={`${getStatusBadgeColor(lead.status)} px-2 md:px-3 py-1 rounded-lg font-medium text-xs self-start sm:self-center`}>
                                  {lead.status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 mb-3 md:mb-4">
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="truncate">{lead.project}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex-shrink-0"
                                >
                                  <Phone className="w-3 h-3 ml-1" />
                                  اتصال
                                </Button>
                                <Button 
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex-shrink-0"
                                >
                                  <MessageCircle className="w-3 h-3 ml-1" />
                                  واتساب
                                </Button>
                                <Button 
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex-shrink-0"
                                >
                                  <FileText className="w-3 h-3 ml-1" />
                                  إرسال عرض
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div 
            className="text-center mt-12 md:mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl md:rounded-2xl p-6 md:p-8 border border-blue-100">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                جاهز لتطوير أعمالك العقارية؟
              </h3>
              <p className="text-sm md:text-base text-slate-600 mb-6 max-w-2xl mx-auto px-4">
                انضم إلى منصة الجيل القادم وتواصل مع عملاء محتملين جدد يومياً من خلال شراكات موثوقة ومدفوعة بالبيانات. 
                بدون بطاقة ائتمان مطلوبة، بدون رسوم إعداد.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link to="/app/crm">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group w-full sm:w-auto">
                    <Users className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                    استكشف المنصة
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    انضم للشراكة
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CRMPreviewArabic;
