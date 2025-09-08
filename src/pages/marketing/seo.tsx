import React, { useEffect } from 'react';

interface MarketingSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export function MarketingSEO({
  title = "SaleMate — Daily Fresh Real-Estate Leads in Egypt",
  description = "Buy verified, high-intent real estate leads and manage them with our free CRM. Close under The Address Investments, Bold Routes, Nawy, or Coldwell Banker to unlock higher commissions.",
  keywords = "real estate leads, egypt property, crm, real estate agents, property leads, cairo real estate, alexandria property, new capital leads",
  canonicalUrl = "https://salemate.com",
  ogImage = "https://salemate.com/og-image.jpg"
}: MarketingSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${canonicalUrl}#organization`,
        "name": "SaleMate",
        "url": canonicalUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${canonicalUrl}/logo.png`,
          "width": 512,
          "height": 512
        },
        "description": description,
        "foundingDate": "2024",
        "founder": {
          "@type": "Person",
          "name": "SaleMate Team"
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "EG",
          "addressRegion": "Cairo"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "support@salemate.com"
        },
        "sameAs": [
          "https://linkedin.com/company/salemate",
          "https://twitter.com/salemate",
          "https://facebook.com/salemate"
        ]
      },
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        "name": "SaleMate CRM & Lead Platform",
        "description": description,
        "brand": {
          "@id": `${canonicalUrl}#organization`
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EGP",
          "price": "95",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@id": `${canonicalUrl}#organization`
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "127",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#software`,
        "name": "SaleMate CRM",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EGP"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "127"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${canonicalUrl}#website`,
        "url": canonicalUrl,
        "name": "SaleMate",
        "description": description,
        "publisher": {
          "@id": `${canonicalUrl}#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${canonicalUrl}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  useEffect(() => {
    // Set document title
    document.title = title;

    // Create or update meta tags
    const setMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Set all meta tags
    setMetaTag('title', title);
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('robots', 'index, follow');
    setMetaTag('language', 'English');
    setMetaTag('author', 'SaleMate');
    setMetaTag('theme-color', '#3b82f6');

    // Open Graph tags
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:site_name', 'SaleMate', true);

    // Twitter tags
    setMetaTag('twitter:card', 'summary_large_image', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:image', ogImage, true);

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Add structured data
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData, null, 2);
  }, [title, description, keywords, canonicalUrl, ogImage]);

  return null;
}

export default MarketingSEO;
