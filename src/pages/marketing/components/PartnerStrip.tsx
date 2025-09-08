import React from 'react';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';

const PartnerStrip = () => {
  // Partner data with placeholder logos
  const partners = [
    {
      name: 'The Address Investments',
      logo: '/partners/address-investments.svg',
      fallbackBg: 'from-blue-600 to-blue-700'
    },
    {
      name: 'Bold Routes',
      logo: '/partners/bold-routes.svg',
      fallbackBg: 'from-purple-600 to-purple-700'
    },
    {
      name: 'Nawy',
      logo: '/partners/nawy.svg',
      fallbackBg: 'from-green-600 to-green-700'
    },
    {
      name: 'Coldwell Banker',
      logo: '/partners/coldwell-banker.svg',
      fallbackBg: 'from-orange-600 to-orange-700'
    },
    {
      name: 'The Address Investments',
      logo: '/partners/address-investments.svg',
      fallbackBg: 'from-blue-600 to-blue-700'
    },
    {
      name: 'Bold Routes',
      logo: '/partners/bold-routes.svg',
      fallbackBg: 'from-purple-600 to-purple-700'
    }
  ];

  const PartnerLogo = ({ partner, index }: { partner: typeof partners[0], index: number }) => (
    <motion.div
      className="flex items-center justify-center mx-8 grayscale hover:grayscale-0 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative group">
        {/* Fallback gradient logo if image doesn't load */}
        <div className={`w-32 h-16 bg-gradient-to-r ${partner.fallbackBg} rounded-lg flex items-center justify-center relative overflow-hidden`}>
          {/* Placeholder logo with company initial */}
          <span className="text-white font-bold text-xl">
            {partner.name.charAt(0)}
          </span>
          
          {/* Company name overlay on hover */}
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-xs font-medium text-center px-2">
              {partner.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="py-12 bg-white border-y border-gray-100">
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
            Trusted Partner Network
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Close deals under established brands and earn higher commissions
          </p>
        </motion.div>

        {/* Partner logos marquee */}
        <div className="relative overflow-hidden">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <Marquee
            speed={30}
            pauseOnHover={true}
            gradient={false}
            className="py-4"
          >
            {partners.map((partner, index) => (
              <PartnerLogo key={`${partner.name}-${index}`} partner={partner} index={index} />
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
            <h3 className="font-semibold text-slate-800 mb-2">Higher Commissions</h3>
            <p className="text-sm text-slate-600">Earn up to 25% more when closing under partner brands</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Instant Recognition</h3>
            <p className="text-sm text-slate-600">Leverage established brand trust and reputation</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Marketing Support</h3>
            <p className="text-sm text-slate-600">Access to partner marketing materials and campaigns</p>
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
            Partner commission rates shown per project in our shop
          </p>
          <motion.button
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            View Partner Projects
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerStrip;
