import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardBanner } from '../../lib/data/banners';
import { trackBannerImpression, trackBannerClick } from '../../lib/data/banners';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../core/api/client';

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
  }, [placement, profile?.role, profile?.id]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading banners for placement:', placement);
      console.log('👤 Current user:', profile ? `Logged in as ${profile.role}` : 'Not logged in');
      
      const now = new Date().toISOString();
      console.log('📅 Current date/time:', now);
      
      // Build query with proper date filtering
      // Note: .select() must come before .eq() filters
      let query = supabase
        .from('content')
        .select('*')
        .eq('content_type', 'banner')
        .eq('placement', placement)
        .eq('status', 'live');
      
      // Don't filter by dates in the query - we'll do it client-side
      // This is more reliable for date comparisons
      // Priority is stored in metadata JSONB, so we'll sort by created_at
      // and handle priority sorting client-side if needed
      query = query.order('created_at', { ascending: false });
      
      const limit = placement === 'home_banner' || placement === 'dashboard_top' ? 10 : 5;
      query = query.limit(limit);
      
      console.log('🔎 Executing query for placement:', placement);
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Banner query error:', error);
        setBanners([]);
        return;
      }
      
      console.log('📊 Raw banners from database:', data?.length || 0, data);
      
      if (!data || data.length === 0) {
        console.log('⚠️ No banners found in database for placement:', placement);
        setBanners([]);
        return;
      }
      
      // Client-side filtering for dates and audience
      const filtered = data.filter(banner => {
        console.log('🔍 Checking banner:', banner.title, {
          start_at: banner.start_at,
          end_at: banner.end_at,
          audience: banner.audience,
          status: banner.status
        });
        
        // Check date range
        const nowDate = new Date();
        
        if (banner.start_at) {
          const startDate = new Date(banner.start_at);
          if (startDate > nowDate) {
            console.log('❌ Banner not started yet:', banner.title);
            return false;
          }
        }
        
        if (banner.end_at) {
          const endDate = new Date(banner.end_at);
          if (endDate < nowDate) {
            console.log('❌ Banner already ended:', banner.title);
            return false;
          }
        }
        
        // Check audience (role) if specified
        // If audience is empty or not specified, show to everyone (including non-logged-in users)
        if (banner.audience && Array.isArray(banner.audience) && banner.audience.length > 0) {
          // If user is not logged in and banner has audience restrictions, skip it
          if (!profile?.role) {
            console.log('ℹ️ Non-logged-in user, banner has audience restrictions:', banner.title);
            return false;
          }
          // If user is logged in but their role is not in the audience, skip it
          if (!banner.audience.includes(profile.role)) {
            console.log('❌ User role not in audience:', banner.title, 'user role:', profile.role, 'audience:', banner.audience);
            return false;
          }
        } else {
          // No audience restrictions = show to everyone (logged in or not)
          console.log('✅ Banner has no audience restrictions, showing to all:', banner.title);
        }
        
        console.log('✅ Banner passes all filters:', banner.title);
        return true;
      });

      // Sort by priority (from metadata) if available, then by created_at
      filtered.sort((a, b) => {
        const aPriority = a.metadata?.priority ?? 999;
        const bPriority = b.metadata?.priority ?? 999;
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Lower priority number = higher priority
        }
        // If priorities are equal, sort by created_at (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log('✅ Filtered banners:', filtered.length, filtered);
      
      if (filtered.length > 0) {
        // Transform content table data to DashboardBanner format
        const transformedBanners: DashboardBanner[] = filtered.map((banner: any) => ({
          id: banner.id,
          title: banner.title || '',
          subtitle: banner.body || '',
          placement: banner.placement || '',
          image_url: banner.media_url || banner.cta?.image_url || null,
          cta_url: banner.cta?.cta_url || null,
          cta_label: banner.cta?.cta_label || null,
          status: banner.status || 'draft',
          start_at: banner.start_at || null,
          end_at: banner.end_at || null,
          audience: Array.isArray(banner.audience) ? banner.audience : (banner.audience ? [banner.audience] : []),
          priority: banner.metadata?.priority || 999,
          visibility_rules: banner.metadata?.visibility_rules || {},
          created_at: banner.created_at || new Date().toISOString(),
          updated_at: banner.updated_at || null,
        }));

        const limitedBanners = transformedBanners.slice(0, 3); // Limit to 3 banners for carousel
        setBanners(limitedBanners);
        
        // Track impressions
        limitedBanners.forEach((banner: DashboardBanner) => {
          if (profile?.id) {
            trackBannerImpression(banner.id, profile.id);
          }
        });
      } else {
        console.log('⚠️ No banners passed the filters');
        setBanners([]);
      }
    } catch (error) {
      console.error('❌ Load banners error:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (banner: DashboardBanner) => {
    if (profile?.id) {
      trackBannerClick(banner.id, profile.id);
    }

    if (banner.cta_url) {
      // Navigate to the CTA URL in a new tab
      window.open(banner.cta_url, '_blank', 'noopener,noreferrer');
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

  // Filter banners for home_banner and dashboard_top placement (up to 3)
  const displayBanners = (placement === 'home_banner' || placement === 'dashboard_top')
    ? visibleBanners.slice(0, 3) 
    : visibleBanners;

  // Auto-advance slides for home_banner and dashboard_top carousel
  useEffect(() => {
    if ((placement !== 'home_banner' && placement !== 'dashboard_top') || displayBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [placement, displayBanners.length]);

  // Render based on placement
  // dashboard_top and home_banner always render (even if no banners), so check them first
  if (placement === 'home_banner' || placement === 'dashboard_top') {
    
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
                    {/* Banner Image - Clickable */}
                    {banner.image_url ? (
                      <div className="relative w-full h-48 md:h-64 overflow-hidden group">
                        <button
                          onClick={() => handleClick(banner)}
                          className="w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label={banner.cta_url ? `Open ${banner.title || 'banner'}` : banner.title || 'Banner'}
                        >
                          <img
                            src={banner.image_url}
                            alt={banner.title || 'Banner'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={async (e) => {
                              console.error('❌ Image failed to load:', banner.image_url);
                              const target = e.target as HTMLImageElement;
                              
                              // Try to get public URL if it's a storage path
                              if (banner.image_url && !banner.image_url.startsWith('http')) {
                                try {
                                  const { data } = supabase.storage
                                    .from('public')
                                    .getPublicUrl(banner.image_url);
                                  console.log('🔄 Trying public URL:', data.publicUrl);
                                  target.src = data.publicUrl;
                                } catch (error) {
                                  console.error('❌ Failed to get public URL:', error);
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 flex items-center justify-center"><p class="text-white/80 text-sm">Image failed to load</p></div>';
                                  }
                                }
                              } else {
                                // Show error placeholder
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 flex items-center justify-center"><p class="text-white/80 text-sm">Image failed to load</p></div>';
                                }
                              }
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', banner.image_url);
                            }}
                          />
                        </button>
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
    // Hero banner (show first one only) - Image only, clickable
    const banner = visibleBanners[0];
    
    return (
      <div className="relative rounded-lg overflow-hidden shadow-xl group">
        {banner.image_url ? (
          <>
            <button
              onClick={() => handleClick(banner)}
              className="w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={banner.cta_url ? `Open ${banner.title || 'banner'}` : banner.title || 'Banner'}
            >
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={async (e) => {
                  console.error('❌ Image failed to load:', banner.image_url);
                  const target = e.target as HTMLImageElement;
                  
                  if (banner.image_url && !banner.image_url.startsWith('http')) {
                    try {
                      const { data } = supabase.storage
                        .from('public')
                        .getPublicUrl(banner.image_url);
                      target.src = data.publicUrl;
                    } catch (error) {
                      console.error('❌ Failed to get public URL:', error);
                    }
                  }
                }}
              />
            </button>
          </>
        ) : (
          <div className="w-full h-64 md:h-80 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
            <p className="text-white/80 text-sm">No image uploaded</p>
          </div>
        )}
      </div>
    );
  }

  if (placement === 'dashboard_grid') {
    // Grid cards (show up to 3) - Image only, clickable
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleBanners.slice(0, 3).map((banner) => (
          <div
            key={banner.id}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden group"
          >
            {banner.image_url ? (
              <>
                <button
                  onClick={() => handleClick(banner)}
                  className="w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={banner.cta_url ? `Open ${banner.title || 'banner'}` : banner.title || 'Banner'}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={async (e) => {
                      console.error('❌ Image failed to load:', banner.image_url);
                      const target = e.target as HTMLImageElement;
                      
                      if (banner.image_url && !banner.image_url.startsWith('http')) {
                        try {
                          const { data } = supabase.storage
                            .from('public')
                            .getPublicUrl(banner.image_url);
                          target.src = data.publicUrl;
                        } catch (error) {
                          console.error('❌ Failed to get public URL:', error);
                        }
                      }
                    }}
                  />
                </button>
              </>
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
                <p className="text-white/80 text-sm">No image uploaded</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

};

