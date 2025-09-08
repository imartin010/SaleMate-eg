import React from 'react';
import { Helmet } from 'react-helmet-async';

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

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="SaleMate" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="SaleMate" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:site" content="@salemate" />
      <meta property="twitter:creator" content="@salemate" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      {/* Geo Tags */}
      <meta name="geo.region" content="EG" />
      <meta name="geo.placename" content="Egypt" />
      <meta name="ICBM" content="30.0444, 31.2357" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
}

export default MarketingSEO;
