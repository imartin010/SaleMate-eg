import { Link } from 'react-router-dom';
import { Logo } from '../../../components/common/Logo';

const FooterArabic = () => {
  return (
    <footer className="bg-slate-900 text-white py-12" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Logo className="h-8 w-auto mb-4 text-white" />
            <p className="text-slate-400 mb-4 max-w-md">
              منصة العقارات المتقدمة للوسطاء المحترفين. احصل على عملاء محتملين عالي الجودة ونظام CRM مجاني.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">المنصة</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/features" className="hover:text-white">المميزات</Link></li>
              <li><Link to="/pricing" className="hover:text-white">الأسعار</Link></li>
              <li><Link to="/demo" className="hover:text-white">تجربة مجانية</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">الدعم</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/help" className="hover:text-white">المساعدة</Link></li>
              <li><Link to="/contact" className="hover:text-white">اتصل بنا</Link></li>
              <li><a href="mailto:support@salemate.com" className="hover:text-white">support@salemate.com</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2024 سيل ميت. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterArabic;
