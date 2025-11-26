import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../../../components/common/Logo';
import { PhoneInput } from '../components/PhoneInput';
import { OTPInput } from '../components/OTPInput';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle, UserPlus, Users, ArrowLeft, Shield } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

type SignupStep = 'details' | 'otp' | 'success';

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUpWithOTP, sendOTP, loading, error, clearError } = useAuthStore();
  
  const [step, setStep] = useState<SignupStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState<string>();
  const [formData, setFormData] = useState<SignupForm | null>(null);
  const [devOtp, setDevOtp] = useState<string>();
  const [otpHelperMessage, setOtpHelperMessage] = useState<string>();
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>();
  const [challengeId, setChallengeId] = useState<string>();

  // Check for invitation parameters
  const invitationToken = searchParams.get('invitation');
  const invitationEmail = searchParams.get('email');
  const hasInvitation = !!invitationToken && !!invitationEmail;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: invitationEmail || '',
    },
  });

  const phoneValue = watch('phone');

  const onSubmitDetails = async (values: SignupForm) => {
    clearError();
    setOtpError(undefined);
    setFormData(values);
    setDevOtp(undefined);
    setOtpHelperMessage(undefined);
    setOtpExpiresIn(undefined);

    // Send OTP
    setSendingOTP(true);
    const result = await sendOTP(values.phone, 'signup');
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
    if (result.devOtp) {
      setDevOtp(result.devOtp);
    }
    setOtpHelperMessage(
      result.message || (result.fallback ? 'SMS delivery is temporarily unavailable. Use the code shown below.' : undefined)
    );
    if (result.expiresIn) {
      setOtpExpiresIn(result.expiresIn);
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

    const success = await signUpWithOTP(
      formData.name,
      formData.email,
      formData.phone,
      formData.password,
      challengeId,
      otp
    );

    setVerifyingOTP(false);

    if (success) {
      setChallengeId(undefined);
      setDevOtp(undefined);
      setOtpHelperMessage(undefined);
      setOtpExpiresIn(undefined);
      setStep('success');
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } else {
      // Show the actual error from auth store, not a generic OTP error
      const actualError = error || 'Signup failed. Please try again.';
      setOtpError(actualError);
      // Also set the main error so it's visible
      if (error) {
        setError(error);
      }
    }
  };

  const handleResendOTP = async () => {
    if (!formData) return;
    
    setOtpError(undefined);
    const result = await sendOTP(formData.phone, 'signup');
    
    if (!result.success) {
      setOtpError(result.error);
      return;
    }

    if (result.challengeId) {
      setChallengeId(result.challengeId);
    }
    if (result.devOtp) {
      setDevOtp(result.devOtp);
    }
    setOtpHelperMessage(
      result.message || (result.fallback ? 'SMS delivery is temporarily unavailable. Use the code shown below.' : undefined)
    );
    if (result.expiresIn) {
      setOtpExpiresIn(result.expiresIn);
    }
  };

  const handleBackToDetails = () => {
    setStep('details');
    setOtpError(undefined);
    clearError();
    setDevOtp(undefined);
    setOtpHelperMessage(undefined);
    setOtpExpiresIn(undefined);
    setChallengeId(undefined);
  };

  // Success Screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {hasInvitation ? 'Account Created & Team Joined!' : 'Account Created!'}
          </h1>
          <p className="text-gray-600 mb-4">
            {hasInvitation 
              ? 'Your account has been created and you\'ve been added to the team.'
              : 'Your phone number has been verified and your account is ready.'
            }
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to <br />
              <span className="font-semibold font-mono">{formData?.phone}</span>
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
            onClick={handleBackToDetails}
            disabled={verifyingOTP}
            className="mt-6 w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to details</span>
          </button>
        </div>
      </div>
    );
  }

  // Details Entry Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Logo variant="icon" size="xl" className="mx-auto mb-4 scale-125" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join SaleMate today</p>
        </div>

        {hasInvitation && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Team Invitation</span>
            </div>
            <p className="text-sm text-blue-700">
              You've been invited to join a team! Complete your signup to automatically join.
            </p>
          </div>
        )}

        {(error || otpError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error || otpError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              disabled={hasInvitation}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              } ${hasInvitation ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
            {hasInvitation && (
              <p className="mt-1 text-sm text-blue-600">Email from team invitation</p>
            )}
          </div>

          {/* Phone Number */}
          <PhoneInput
            value={phoneValue || ''}
            onChange={(value) => setValue('phone', value)}
            error={errors.phone?.message}
            required
          />

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12 ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12 ${
                  errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || sendingOTP}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendingOTP ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending verification code...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Continue
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
