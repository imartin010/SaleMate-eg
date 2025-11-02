import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { DashboardBanner } from '../../lib/data/banners';
import { trackBannerImpression, trackBannerClick } from '../../lib/data/banners';
import { useAuthStore } from '../../store/auth';

interface BannerDisplayProps {
  placement: string;
}

export const BannerDisplay: React.FC<BannerDisplayProps> = ({ placement }) => {
  const [banners, setBanners] = useState<DashboardBanner[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const { profile } = useAuthStore();

  useEffect(() => {
    loadBanners();
  }, [placement]);

  const loadBanners = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/banners-resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ placement }),
        }
      );

      const result = await response.json();
      
      if (result.banners) {
        setBanners(result.banners);
        
        // Track impressions
        result.banners.forEach((banner: DashboardBanner) => {
          if (profile?.id) {
            trackBannerImpression(banner.id, profile.id);
          }
        });
      }
    } catch (error) {
      console.error('Load banners error:', error);
    }
  };

  const handleClick = (banner: DashboardBanner) => {
    if (profile?.id) {
      trackBannerClick(banner.id, profile.id);
    }

    if (banner.cta_url) {
      window.open(banner.cta_url, '_blank');
    }
  };

  const handleDismiss = (bannerId: string) => {
    setDismissedBanners(prev => new Set(prev).add(bannerId));
    
    // Store in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissed_banners') || '[]');
    dismissed.push(bannerId);
    localStorage.setItem('dismissed_banners', JSON.stringify(dismissed));
  };

  // Filter out dismissed banners
  const visibleBanners = banners.filter(b => !dismissedBanners.has(b.id));

  if (visibleBanners.length === 0) return null;

  // Render based on placement
  if (placement === 'dashboard_top') {
    // Hero banner (show first one only)
    const banner = visibleBanners[0];
    
    return (
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg overflow-hidden shadow-xl">
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        
        <div className="relative p-8">
          <button
            onClick={() => handleDismiss(banner.id)}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-2">{banner.title}</h2>
            {banner.subtitle && (
              <p className="text-lg text-white/90 mb-6">{banner.subtitle}</p>
            )}
            {banner.cta_label && (
              <button
                onClick={() => handleClick(banner)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {banner.cta_label}
                {banner.cta_url && <ExternalLink className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (placement === 'dashboard_grid') {
    // Grid cards (show up to 3)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleBanners.slice(0, 3).map((banner) => (
          <div
            key={banner.id}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleClick(banner)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(banner.id);
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white hover:bg-black/70 rounded-full transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {banner.image_url && (
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{banner.title}</h3>
              {banner.subtitle && (
                <p className="text-gray-600 mb-4">{banner.subtitle}</p>
              )}
              {banner.cta_label && (
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  {banner.cta_label}
                  {banner.cta_url && <ExternalLink className="h-4 w-4" />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

