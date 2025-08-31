import React from 'react';
import { Logo } from './Logo';

export const LogoTest: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">SaleMate Logo Test</h1>
      
      {/* Full Logo Variants */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Full Logo Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Small</h3>
            <Logo variant="full" size="sm" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Medium</h3>
            <Logo variant="full" size="md" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Large</h3>
            <Logo variant="full" size="lg" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Extra Large</h3>
            <Logo variant="full" size="xl" />
          </div>
        </div>
      </div>

      {/* Icon Only Variants */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Icon Only Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Small</h3>
            <Logo variant="icon" size="sm" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Medium</h3>
            <Logo variant="icon" size="md" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Large</h3>
            <Logo variant="icon" size="lg" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Extra Large</h3>
            <Logo variant="icon" size="xl" />
          </div>
        </div>
      </div>

      {/* Text Only Variants */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Text Only Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Small</h3>
            <Logo variant="text" size="sm" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Medium</h3>
            <Logo variant="text" size="md" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Large</h3>
            <Logo variant="text" size="lg" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Extra Large</h3>
            <Logo variant="text" size="xl" />
          </div>
        </div>
      </div>

      {/* With Tagline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">With Tagline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Full Logo with Tagline</h3>
            <Logo variant="full" size="lg" showTagline={true} />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Text Only with Tagline</h3>
            <Logo variant="text" size="lg" showTagline={true} />
          </div>
        </div>
      </div>

      {/* Background Tests */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Background Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg">
            <h3 className="text-sm font-medium mb-2">White Background</h3>
            <Logo variant="full" size="md" />
          </div>
          <div className="text-center p-6 bg-blue-600 rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-white">Blue Background</h3>
            <Logo variant="full" size="md" />
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-white">Gradient Background</h3>
            <Logo variant="full" size="md" />
          </div>
        </div>
      </div>

      {/* Responsive Test */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Responsive Test</h2>
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">Resize your browser to see responsive behavior</p>
          <Logo variant="full" size="lg" showTagline={true} className="mx-auto" />
        </div>
      </div>
    </div>
  );
};
