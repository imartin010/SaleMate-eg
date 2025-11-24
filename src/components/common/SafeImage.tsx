import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onError?: () => void;
}

/**
 * SafeImage component with robust error handling and fallbacks
 * Prevents infinite error loops and provides graceful degradation
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  placeholder,
  onError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Default placeholder component
  const defaultPlaceholder = (
    <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-center p-4">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-medium">Image unavailable</p>
      </div>
    </div>
  );

  // Reset errors when src changes
  React.useEffect(() => {
    setImageError(false);
    setFallbackError(false);
    setIsLoading(true);
  }, [src]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    // If we haven't tried the fallback yet, try it
    if (!imageError && fallbackSrc && target.src !== fallbackSrc) {
      setImageError(true);
      target.src = fallbackSrc;
      return;
    }
    
    // If fallback also failed or no fallback, show placeholder
    if (!fallbackError) {
      setFallbackError(true);
      setIsLoading(false);
      onError?.();
    }
    
    // Hide the broken image
    target.style.display = 'none';
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If both image and fallback failed, show placeholder
  if (imageError && (fallbackError || !fallbackSrc)) {
    return placeholder || defaultPlaceholder;
  }

  // If no src provided, show placeholder immediately
  if (!src) {
    return placeholder || defaultPlaceholder;
  }

  // Determine which image to show
  const imageSrc = imageError && fallbackSrc ? fallbackSrc : src;

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-100 animate-pulse ${className}`} />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};
