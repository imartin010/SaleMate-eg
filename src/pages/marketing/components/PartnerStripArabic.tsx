import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { 
  Mountain, 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap 
} from 'lucide-react';

const PartnerStripArabic = () => {
  // Partner data with correct Supabase storage logos, labels and icons in Arabic
  const partners = [
    {
      name: 'ذا أدرس إنفستمنتس',
      logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/the-address-investments-logo.png',
      fallbackBg: 'from-blue-600 to-blue-700',
      label: 'الأعلى في ماونتن فيو',
      icon: Mountain,
      iconColor: 'text-blue-600'
    },
    {
      name: 'بولد روتس',
      logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/bold-routes-logo.png',
      fallbackBg: 'from-purple-600 to-purple-700',
      label: 'الأعلى في عدة مشاريع',
      icon: TrendingUp,
      iconColor: 'text-purple-600'
    },
    {
      name: 'نوي',
      logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/nawy-partners.png',
      fallbackBg: 'from-green-600 to-green-700',
      label: 'علامة موثوقة',
      icon: Shield,
      iconColor: 'text-green-600'
    },
    {
      name: 'كولدويل بانكر',
      logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/coldwell-banker-logo.png',
      fallbackBg: 'from-orange-600 to-orange-700',
      label: 'عمولات 60 يوم',
      icon: Clock,
      iconColor: 'text-orange-600'
    },
    {
      name: 'سيل ميت',
      logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_logo.png',
      fallbackBg: 'from-slate-600 to-slate-700',
      label: 'عمولات متقدمة',
      icon: Zap,
      iconColor: 'text-slate-600'
    }
  ];

  const PartnerLogo = ({ partner, index }: { partner: typeof partners[0], index: number }) => (
    <motion.div
      className="flex flex-col items-center justify-center mx-12 hover:scale-105 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.1 }}
    >
      <div className="relative group">
        {/* Label above logo - positioned closer with icon */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
          <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200 whitespace-nowrap flex items-center gap-1">
            <partner.icon className={`w-3 h-3 ${partner.iconColor}`} />
            {partner.label}
          </span>
        </div>
        
        <div className="w-32 h-16 bg-white rounded-lg flex items-center justify-center relative overflow-hidden shadow-md border border-gray-200">
          {/* Actual partner logo */}
          <img 
            src={partner.logo}
            alt={`${partner.name} logo`}
            className="max-w-full max-h-full object-contain p-2"
            loading="lazy"
            width="120"
            height="60"
            decoding="async"
            onError={(e) => {
              // Fallback to gradient logo if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          
          {/* Fallback gradient logo (hidden by default) */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r ${partner.fallbackBg} rounded-lg flex items-center justify-center`}
            style={{ display: 'none' }}
          >
            <span className="text-white font-bold text-xl">
              {partner.name.charAt(0)}
            </span>
          </div>
          
          {/* Company name overlay on hover */}
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
            <span className="text-white text-xs font-medium text-center px-2">
              {partner.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="py-12 bg-white border-y border-gray-100" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            شبكة الشركاء الموثوقة
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            اغلق الصفقات تحت علامات تجارية راسخة واكسب عمولات أعلى
          </p>
        </motion.div>

        {/* Partner logos marquee */}
        <div className="relative overflow-hidden">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          
          <Marquee
            speed={40}
            pauseOnHover={true}
            gradient={false}
            className="py-12"
            direction="right"
          >
            {/* First set of partners */}
            {partners.map((partner, index) => (
              <PartnerLogo key={`${partner.name}-${index}`} partner={partner} index={index} />
            ))}
            {/* Duplicate set for seamless loop with spacing */}
            <div className="w-24"></div>
            {partners.map((partner, index) => (
              <PartnerLogo key={`${partner.name}-duplicate-${index}`} partner={partner} index={index} />
            ))}
          </Marquee>
        </div>

        {/* Partner benefits */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">عمولات أعلى</h3>
            <p className="text-sm text-slate-600">اكسب حتى 15% أكثر عند الإغلاق تحت علامات الشركاء</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">اعتراف فوري</h3>
            <p className="text-sm text-slate-600">استفد من ثقة العلامة التجارية الراسخة والسمعة</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">دعم تسويقي</h3>
            <p className="text-sm text-slate-600">الوصول إلى المواد التسويقية والحملات للشركاء</p>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-slate-500 mb-4">
            معدلات عمولة الشركاء معروضة لكل مشروع في متجرنا
          </p>
          <motion.button
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
            whileHover={{ x: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            عرض مشاريع الشركاء
            <svg className="w-4 h-4 mr-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerStripArabic;
