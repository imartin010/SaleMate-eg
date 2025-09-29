import { useEffect } from 'react';

const MarketingSEOArabic = () => {
  useEffect(() => {
    // Set document title
    document.title = 'سيل ميت - منصة العقارات المتقدمة | عقود شراكة وعملاء محتملين عالي الجودة';
    
    // Set meta tags
    const setMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('description', 'انضم إلى منصة سيل ميت للحصول على عملاء محتملين عالي الجودة ونظام CRM مجاني. اكسب عمولات أعلى من خلال الشراكات مع أفضل الشركات العقارية في مصر.');
    setMetaTag('keywords', 'عقارات, عملاء محتملين, CRM, شراكات عقارية, عمولات, مصر, القاهرة الجديدة, الساحل الشمالي');
    
    // Open Graph
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', 'https://salemate.com/ar', true);
    setMetaTag('og:title', 'سيل ميت - منصة العقارات المتقدمة', true);
    setMetaTag('og:description', 'احصل على عملاء محتملين عالي الجودة ونظام CRM مجاني. اكسب عمولات أعلى من خلال الشراكات العقارية.', true);
    setMetaTag('og:locale', 'ar_EG', true);

    return () => {
      // Cleanup is optional for SEO tags
    };
  }, []);

  return null;
};

export default MarketingSEOArabic;