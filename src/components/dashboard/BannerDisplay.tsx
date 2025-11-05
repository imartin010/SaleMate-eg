import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardBanner } from '../../lib/data/banners';
import { trackBannerImpression, trackBannerClick } from '../../lib/data/banners';
import { useAuthStore } from '../../store/auth';

interface BannerDisplayProps {
  placement: string;
}

export const BannerDisplay: React.FC<BannerDisplayProps> = ({ placement }) => {
  const [banners, setBanners] = useState<DashboardBanner[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { profile } = useAuthStore();

  useEffect(() => {
    loadBanners();
  }, [placement]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      
      // Try to load from edge function first, fallback to direct query
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
          const limitedBanners = result.banners.slice(0, 3); // Limit to 3 banners for carousel
          setBanners(limitedBanners);
          
          // Track impressions
          limitedBanners.forEach((banner: DashboardBanner) => {
            if (profile?.id) {
              trackBannerImpression(banner.id, profile.id);
            }
          });
        }
      } catch (edgeError) {
        console.warn('Edge function failed, trying direct query:', edgeError);
        // Fallback: query directly from Supabase
        const { supabase } = await import('../../lib/supabase');
        const limit = placement === 'home_banner' ? 3 : 1; // Fetch up to 3 for home_banner carousel
        const { data, error } = await supabase
          .from('dashboard_banners')
          .select('*')
          .eq('placement', placement)
          .eq('status', 'live')
          .order('priority', { ascending: true })
          .limit(limit);
        
        if (!error && data) {
          setBanners(data);
        }
      }
    } catch (error) {
      console.error('Load banners error:', error);
    } finally {
      setLoading(false);
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

  // Filter banners for home_banner placement (up to 3)
  const displayBanners = placement === 'home_banner' 
    ? visibleBanners.slice(0, 3) 
    : visibleBanners;

  // Auto-advance slides for home_banner carousel
  useEffect(() => {
    if (placement !== 'home_banner' || displayBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [placement, displayBanners.length]);

  // Render based on placement
  // home_banner always renders (even if no banners), so check it first
  if (placement === 'home_banner') {
    
    // Always render the banner block, even if no banner is configured
    return (
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 bg-white">
        {loading ? (
          // Loading state
          <div className="w-full h-48 md:h-64 bg-gradient-to-r from-blue-100 via-blue-100 to-blue-100 flex items-center justify-center">
            <div className="animate-pulse text-gray-400 text-sm">Loading banner...</div>
          </div>
        ) : displayBanners.length > 0 ? (
          <>
            {/* Carousel Container */}
            <div className="relative w-full h-48 md:h-64 overflow-hidden">
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {displayBanners.map((banner, index) => (
                  <div key={banner.id} className="min-w-full relative">
                    {/* Banner Image */}
                    {banner.image_url ? (
                      <div className="relative w-full h-48 md:h-64 overflow-hidden">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-full h-48 md:h-64 lg:h-80 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
                        <p className="text-white/80 text-sm">No image uploaded</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {displayBanners.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all z-20"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % displayBanners.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all z-20"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Slide Indicators */}
              {displayBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {displayBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Banner Content (for current slide) */}
            {displayBanners[currentSlide] && (
              <div className="relative p-4 md:p-6 lg:p-8">
                <button
                  onClick={() => handleDismiss(displayBanners[currentSlide].id)}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors z-10"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>

                <div className="pr-12">
                  {displayBanners[currentSlide].title && (
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {displayBanners[currentSlide].title}
                    </h3>
                  )}
                  {displayBanners[currentSlide].subtitle && (
                    <p className="text-sm md:text-base text-gray-600 mb-4">
                      {displayBanners[currentSlide].subtitle}
                    </p>
                  )}
                  {displayBanners[currentSlide].cta_label && (
                    <button
                      onClick={() => handleClick(displayBanners[currentSlide])}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm"
                    >
                      {displayBanners[currentSlide].cta_label}
                      {displayBanners[currentSlide].cta_url && <ExternalLink className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // Placeholder when no banner is configured
          <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-gray-500 text-sm mb-2">No banner configured</p>
              <p className="text-gray-400 text-xs">
                Configure a banner in Admin → CMS → Banners
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For other placements, return null if no banners
  if (visibleBanners.length === 0) return null;

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

};

