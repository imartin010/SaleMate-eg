import React from 'react';
import { Logo } from './Logo';

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'hero' | 'page' | 'section';
  className?: string;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ 
  title, 
  subtitle, 
  variant = 'page',
  className = '' 
}) => {
  const variants = {
    hero: 'py-16 bg-brand-gradient-hero text-white',
    page: 'py-12 bg-brand-gradient-brand text-white',
    section: 'py-8 bg-brand-light text-brand-dark border-b border-brand-muted/20'
  };

  const logoSizes = {
    hero: 'xl',
    page: 'lg',
    section: 'md'
  };

  const titleSizes = {
    hero: 'text-brand-5xl md:text-brand-6xl',
    page: 'text-brand-4xl md:text-brand-5xl',
    section: 'text-brand-3xl md:text-brand-4xl'
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      <div className="container mx-auto px-6 text-center">
        {variant === 'hero' && (
          <Logo 
            variant="full" 
            size={logoSizes[variant] as any} 
            showTagline={true} 
            className="mx-auto mb-8" 
          />
        )}
        
        <h1 className={`font-brand font-bold mb-4 ${titleSizes[variant]}`}>
          {title}
        </h1>
        
        {subtitle && (
          <p className={`text-xl opacity-90 max-w-3xl mx-auto ${
            variant === 'section' ? 'text-brand-muted' : ''
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
