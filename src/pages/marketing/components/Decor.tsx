import React from 'react';

// SVG decorative elements for the marketing page
export const BackgroundDecor = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Top-left gradient blob */}
    <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
    
    {/* Top-right geometric shape */}
    <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-bl from-purple-400/15 to-pink-600/15 rounded-full blur-2xl" />
    
    {/* Bottom-left accent */}
    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl" />
    
    {/* Floating particles */}
    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
    <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
    <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
  </div>
);

export const SectionDivider = ({ variant = 'wave' }: { variant?: 'wave' | 'curve' | 'zigzag' }) => {
  if (variant === 'wave') {
    return (
      <div className="relative h-16 w-full overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
            fill="url(#waveGradient)"
            opacity="0.1"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'curve') {
    return (
      <div className="relative h-12 w-full overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,120 Q600,0 1200,120 L1200,120 L0,120 Z"
            fill="url(#curveGradient)"
            opacity="0.05"
          />
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-8 w-full overflow-hidden">
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 L200,120 L400,40 L600,100 L800,20 L1000,80 L1200,0 L1200,120 L0,120 Z"
          fill="url(#zigzagGradient)"
          opacity="0.08"
        />
        <defs>
          <linearGradient id="zigzagGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export const FloatingIcon = ({ 
  icon: Icon, 
  className = "", 
  delay = 0 
}: { 
  icon: React.ElementType; 
  className?: string; 
  delay?: number;
}) => (
  <div 
    className={`absolute opacity-10 animate-bounce ${className}`}
    style={{ animationDelay: `${delay}s`, animationDuration: '3s' }}
  >
    <Icon className="w-6 h-6 text-blue-500" />
  </div>
);

export const GradientOrb = ({ 
  size = 'md', 
  position = 'top-left',
  opacity = 'low',
  animate = true 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: 'low' | 'medium' | 'high';
  animate?: boolean;
}) => {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
    xl: 'w-128 h-128'
  };

  const positionClasses = {
    'top-left': '-top-16 -left-16',
    'top-right': '-top-16 -right-16',
    'bottom-left': '-bottom-16 -left-16',
    'bottom-right': '-bottom-16 -right-16',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  const opacityClasses = {
    low: 'opacity-5',
    medium: 'opacity-10',
    high: 'opacity-20'
  };

  return (
    <div 
      className={`
        absolute ${sizeClasses[size]} ${positionClasses[position]} ${opacityClasses[opacity]}
        bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full blur-3xl
        ${animate ? 'animate-pulse' : ''}
      `}
    />
  );
};

export default {
  BackgroundDecor,
  SectionDivider,
  FloatingIcon,
  GradientOrb
};
