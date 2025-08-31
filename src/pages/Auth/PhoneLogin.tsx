import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Logo } from '../../components/common/Logo';
import { Loader2, Smartphone, AlertCircle, ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';

export default function PhoneLogin() {
  const navigate = useNavigate();
  const { user, sendOTP, verifyOTP, loading, error, clearError } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'code' | 'details'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    name: '',
    email: '',
  });
  const [countdown, setCountdown] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePhone = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be in international format (e.g., +201234567890)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCode = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.code) {
      errors.code = 'Verification code is required';
    } else if (!/^\d{6}$/.test(formData.code)) {
      errors.code = 'Code must be 6 digits';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDetails = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validatePhone()) return;

    const success = await sendOTP(formData.phone);
    if (success) {
      setStep('code');
      setCountdown(45);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateCode()) return;

    // For new users, ask for details first
    if (!formData.name) {
      setStep('details');
      return;
    }

    const success = await verifyOTP(
      formData.phone,
      formData.code,
      formData.email || undefined,
      formData.name || undefined
    );
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateDetails()) return;

    const success = await verifyOTP(
      formData.phone,
      formData.code,
      formData.email || undefined,
      formData.name
    );
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    const success = await sendOTP(formData.phone);
    if (success) {
      setCountdown(45);
    }
  };

  const goBack = () => {
    if (step === 'details') {
      setStep('code');
    } else if (step === 'code') {
      setStep('phone');
      setFormData(prev => ({ ...prev, code: '' }));
    } else {
      navigate('/auth/login');
    }
    clearError();
    setValidationErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Logo variant="icon" size="md" />
          <div className="w-5" /> {/* Spacer */}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'phone' && 'Phone Login'}
            {step === 'code' && 'Verify Code'}
            {step === 'details' && 'Complete Signup'}
          </h1>
          <p className="text-gray-600">
            {step === 'phone' && 'Enter your phone number to receive a verification code'}
            {step === 'code' && `We sent a 6-digit code to ${formData.phone}`}
            {step === 'details' && 'Tell us a bit about yourself'}
          </p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+201234567890"
                disabled={loading}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.phone}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Use international format with country code
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest ${
                  validationErrors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123456"
                maxLength={6}
                disabled={loading}
              />
              {validationErrors.code && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.code}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verify & Continue
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 
                  ? `Resend code in ${countdown}s`
                  : 'Resend verification code'
                }
              </button>
            </div>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleCompleteSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.email}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add email for account recovery
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Complete Signup
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <span className="text-gray-600">Prefer email? </span>
          <Link to="/auth/login" className="text-blue-600 hover:underline font-medium">
            Sign in with email
          </Link>
        </div>
      </div>
    </div>
  );
}