import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/auth';
import { Logo } from '../../components/common/Logo';
import { Loader2, LogIn, AlertCircle, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInEmail, loading, error, clearError, resendConfirmation, user } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Check if we're on the performance subdomain
  const isPerformanceSubdomain = typeof window !== 'undefined' && window.location.hostname.includes('performance');
  const performanceLogoUrl = "https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_performance_logo.png";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: localStorage.getItem('remember_me') === 'true',
    },
  });

  const onSubmit = async (values: LoginForm) => {
    clearError();
    setUserEmail(values.email);
    
    const success = await signInEmail(values.email, values.password, values.rememberMe);
    if (success) {
      // Wait for auth store to be updated with user data
      // Check the store state to ensure user is set before redirecting
      let attempts = 0;
      const checkAuthState = () => {
        const authState = useAuthStore.getState();
        if (authState.user) {
      // Check if we're on performance subdomain
          // For performance subdomain, redirect to root which has PerformanceDashboardRouter
          // that will route users based on their role (CEO -> /dashboard, franchise employee -> /franchise/:slug)
          const defaultPath = isPerformanceSubdomain ? '/' : '/app';
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultPath;
          navigate(from, { replace: true });
        } else if (attempts < 20) {
          // Retry up to 20 times (2 seconds total) to account for async state updates
          attempts++;
          setTimeout(checkAuthState, 100);
        } else {
          // Fallback: redirect anyway after timeout
          console.warn('Login: User state not found after timeout, redirecting anyway');
          const defaultPath = isPerformanceSubdomain ? '/' : '/app';
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultPath;
        navigate(from, { replace: true });
        }
      };
      // Start checking immediately, but give a small delay for state propagation
      setTimeout(checkAuthState, 50);
    }
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Logo 
            variant="icon" 
            size="xl" 
            className="mx-auto mb-4 scale-125"
            logoUrl={isPerformanceSubdomain ? performanceLogoUrl : undefined}
          />
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
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

          {/* Remember Me */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Remember me for 30 days</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
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
