import React, { useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  className?: string;
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpired,
  onError,
  className = ''
}) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleVerify = (token: string | null) => {
    onVerify(token);
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = () => {
    if (onError) {
      onError();
    }
  };

  // Reset reCAPTCHA when component unmounts or when needed
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, []);

  // reCAPTCHA is now enabled
  const isRecaptchaEnabled = true;
  
  // Get the appropriate site key based on environment
  const getSiteKey = () => {
    // For development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '6Lc_qrkrAAAAABodNNOxXGjDHXGQ5cRt1_gjojWL'; // Use your development key
    }
    
    // For production domains
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('salemate-eg.com') ||
        window.location.hostname.includes('sale-mate')) {
      return '6Lc_qrkrAAAAABodNNOxXGjDHXGQ5cRt1_gjojWL'; // Use your production key
    }
    
    // Fallback
    return '6Lc_qrkrAAAAABodNNOxXGjDHXGQ5cRt1_gjojWL';
  };

  const siteKey = getSiteKey();

  // If reCAPTCHA is disabled, automatically verify
  useEffect(() => {
    if (!isRecaptchaEnabled) {
      onVerify('disabled-for-now');
    }
  }, [isRecaptchaEnabled, onVerify]);

  if (!isRecaptchaEnabled) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
          🔒 reCAPTCHA temporarily disabled for testing
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleVerify}
        onExpired={handleExpired}
        onError={handleError}
        theme="light"
        size="normal"
      />
    </div>
  );
};
