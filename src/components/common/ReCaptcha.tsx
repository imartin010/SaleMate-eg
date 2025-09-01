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

  return (
    <div className={`flex justify-center ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6Lc_qrkrAAAAABodNNOxXGjDHXGQ5cRt1_gjojWL"
        onChange={handleVerify}
        onExpired={handleExpired}
        onError={handleError}
        theme="light"
        size="normal"
      />
    </div>
  );
};
