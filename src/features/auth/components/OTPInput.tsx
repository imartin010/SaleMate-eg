import React, { useRef, useState, useEffect } from 'react';
import { Loader2, RefreshCw, Clock } from 'lucide-react';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onResend: () => void;
  isVerifying?: boolean;
  error?: string;
  expiresInSeconds?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onResend,
  isVerifying = false,
  error,
  expiresInSeconds = 300, // 5 minutes default
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const [resendCooldown, setResendCooldown] = useState(30); // 30 second cooldown for resend
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeLeft(expiresInSeconds);
  }, [expiresInSeconds]);

  // Main expiration timer
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer (30 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // Clear current box
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous box and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits.length === length) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      inputRefs.current[length - 1]?.focus();
      onComplete(digits);
    }
  };

  const handleResend = () => {
    if (!canResend || isVerifying) return;
    
    // Reset OTP inputs
    setOtp(Array(length).fill(''));
    setTimeLeft(expiresInSeconds);
    setResendCooldown(30); // Reset cooldown to 30 seconds
    setCanResend(false);
    inputRefs.current[0]?.focus();
    
    onResend();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* OTP Input Boxes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
          Enter Verification Code
        </label>
        <div 
          className="flex justify-center gap-2 mb-2"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isVerifying}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                ${error 
                  ? 'border-red-500 bg-red-50' 
                  : digit 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-white'
                }
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 text-center mt-2">{error}</p>
        )}
      </div>

      {/* Timer and Resend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className={`font-mono ${timeLeft <= 60 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isVerifying}
          className={`flex items-center gap-2 text-sm font-medium transition-colors
            ${canResend && !isVerifying
              ? 'text-blue-600 hover:text-blue-700 cursor-pointer'
              : 'text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : !canResend && resendCooldown > 0 ? (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Resend in {resendCooldown}s</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Resend Code</span>
            </>
          )}
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Didn't receive the code? Check your SMS or wait for the timer to resend.
      </p>
    </div>
  );
};

