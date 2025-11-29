import React from 'react';
import { useFeatureFlags } from '../../core/config/features';
import { ComingSoonCard } from './ComingSoonSection';
import { Handshake } from 'lucide-react';

/**
 * Partners Section
 * Display 4 partner logos
 */
const PartnersSection: React.FC = React.memo(() => {
  const { partnerDealsEnabled } = useFeatureFlags();
  
  const partners = [
    { name: 'Nawy', logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/nawy-partners.png' },
    { name: 'Coldwell Banker', logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/coldwell-banker-logo.png' },
    { name: 'The Address Investments', logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/the-address-investments-logo.png' },
    { name: 'Bold Routes', logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/bold-routes-logo.png' },
  ];

  // Show Coming Soon if partner deals are disabled
  if (!partnerDealsEnabled) {
    return (
      <div className="space-y-4 md:space-y-6 h-full flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Our Partners</h2>
        <ComingSoonCard
          title="Partner Deals"
          description="Submit deals with our partner developers and track commissions. Coming soon!"
          launchDate="Month 6"
          icon={<Handshake className="h-6 w-6 text-gray-600" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Our Partners</h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="rounded-xl md:rounded-2xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 md:p-6 border border-gray-100 aspect-square flex items-center justify-center hover:shadow-xl hover:border-blue-200 transition-all duration-300"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-w-full max-h-16 md:max-h-24 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

PartnersSection.displayName = 'PartnersSection';

export default PartnersSection;

