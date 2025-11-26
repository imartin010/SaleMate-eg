import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../../../components/common/Logo';
import { OTPInput } from '../components/OTPInput';
import { Loader2, LogIn, AlertCircle, Eye, EyeOff, Mail, CheckCircle, Shield, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
  use2FA: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginStep = 'credentials' | 'otp';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInEmail, signInWith2FA, sendOTP, loading, error, clearError, resendConfirmation } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [formData, setFormData] = useState<LoginForm | null>(null);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState<string>();
  const [challengeId, setChallengeId] = useState<string>();
  const [devOtp, setDevOtp] = useState<string>();
  const [otpHelperMessage, setOtpHelperMessage] = useState<string>();
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: localStorage.getItem('remember_me') === 'true',
      use2FA: false,
    },
  });

  const use2FA = watch('use2FA');

  const onSubmit = async (values: LoginForm) => {
    clearError();
    setOtpError(undefined);
    setUserEmail(values.email);
    setFormData(values);

    // If 2FA is not requested, sign in directly
    if (!values.use2FA) {
      const success = await signInEmail(values.email, values.password, values.rememberMe);
      if (success) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
      return;
    }

    // If 2FA is requested, we need to get the user's phone and send OTP
    // First, try to sign in to get user profile (we'll sign out if 2FA fails)
    const tempSuccess = await signInEmail(values.email, values.password, false);
    if (!tempSuccess) return;

    // Get user's phone from the store
    const profile = useAuthStore.getState().profile;
    if (!profile?.phone) {
      clearError();
      await useAuthStore.getState().signOut();
      setOtpError('No phone number found. Please sign in without 2FA.');
      return;
    }

    setUserPhone(profile.phone);

    // Sign out temporarily - we'll sign in again after 2FA
    await useAuthStore.getState().signOut();

    // Send OTP
    setSendingOTP(true);
    const result = await sendOTP(profile.phone, '2fa');
    setSendingOTP(false);

    if (!result.success) {
      setOtpError(result.error);
      return;
    }

    if (!result.challengeId) {
      setOtpError('Failed to start verification. Please try again.');
      return;
    }

    setChallengeId(result.challengeId);
    setDevOtp(result.devOtp);
    setOtpHelperMessage(
      result.message || (result.fallback ? 'SMS delivery is temporarily unavailable. Use the code shown below.' : undefined)
    );
    if (result.expiresIn) {
      setOtpExpiresIn(result.expiresIn);
    } else {
      setOtpExpiresIn(undefined);
    }

    // Move to OTP step
    setStep('otp');
  };

  const handleOTPComplete = async (otp: string) => {
    if (!formData) return;

    clearError();
    setOtpError(undefined);
    setVerifyingOTP(true);

    if (!challengeId) {
      setVerifyingOTP(false);
      setOtpError('Verification session expired. Please request a new code.');
      return;
    }

    const success = await signInWith2FA(
      formData.email,
      formData.password,
      challengeId,
      otp,
      formData.rememberMe
    );

    setVerifyingOTP(false);

    if (success) {
      setChallengeId(undefined);
      setDevOtp(undefined);
      setOtpHelperMessage(undefined);
      setOtpExpiresIn(undefined);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } else {
      setOtpError(error || 'Invalid verification code');
    }
  };

  const handleResendOTP = async () => {
    if (!userPhone) return;
    
    setOtpError(undefined);
    const result = await sendOTP(userPhone, '2fa');
    
    if (!result.success) {
      setOtpError(result.error);
      return;
    }

    if (result.challengeId) {
      setChallengeId(result.challengeId);
    }
    setDevOtp(result.devOtp);
    setOtpHelperMessage(
      result.message || (result.fallback ? 'SMS delivery is temporarily unavailable. Use the code shown below.' : undefined)
    );
    if (result.expiresIn) {
      setOtpExpiresIn(result.expiresIn);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtpError(undefined);
    clearError();
    setChallengeId(undefined);
    setDevOtp(undefined);
    setOtpHelperMessage(undefined);
    setOtpExpiresIn(undefined);
  };

  const handleResendConfirmation = async () => {
    if (!userEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    const success = await resendConfirmation(userEmail);
    
    if (success) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    }
    
    setResendLoading(false);
  };

  const isEmailNotConfirmed = error && error.toLowerCase().includes('email not confirmed');

  // OTP Verification Screen
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to <br />
              <span className="font-semibold font-mono">{userPhone}</span>
            </p>
          </div>

          {(otpHelperMessage || devOtp) && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              {otpHelperMessage && (
                <p className="text-sm mb-2">{otpHelperMessage}</p>
              )}
              {devOtp && (
                <p className="text-sm">
                  Use this verification code:{' '}
                  <span className="font-semibold font-mono text-base tracking-widest">{devOtp}</span>
                </p>
              )}
              {otpExpiresIn && (
                <p className="text-xs mt-2 text-amber-700">
                  Code expires in approximately {Math.max(1, Math.round(otpExpiresIn / 60))} minutes.
                </p>
              )}
            </div>
          )}

          <OTPInput
            length={6}
            onComplete={handleOTPComplete}
            onResend={handleResendOTP}
            isVerifying={verifyingOTP}
            error={otpError}
            expiresInSeconds={otpExpiresIn ?? 300}
          />

          <button
            type="button"
            onClick={handleBackToCredentials}
            disabled={verifyingOTP}
            className="mt-6 w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to login</span>
          </button>
        </div>
      </div>
    );
  }

  // Credentials Entry Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Logo variant="icon" size="xl" className="mx-auto mb-4 scale-125" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your SaleMate account</p>
        </div>

        {resendSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <span className="text-green-700 text-sm font-medium">Confirmation email sent!</span>
              <p className="text-green-600 text-xs mt-1">Please check your email and click the confirmation link.</p>
            </div>
          </div>
        )}

        {(error || otpError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error || otpError}</span>
            </div>
            
            {isEmailNotConfirmed && userEmail && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-red-600 text-xs mb-2">
                  Check your email for a confirmation link, or resend it if needed.
                </p>
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading || resendSuccess}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Email Sent!
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link 
                to="/auth/reset-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12 ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & 2FA Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Remember me for 30 days</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('use2FA')}
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-600" />
                Use two-factor authentication (2FA)
              </span>
            </label>
          </div>

          {use2FA && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>2FA enabled:</strong> You'll receive a verification code via SMS after entering your password.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || sendingOTP}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(loading || sendingOTP) ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {sendingOTP ? 'Sending 2FA code...' : 'Signing in...'}
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
