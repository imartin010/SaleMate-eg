import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Logo } from '../../../components/common/Logo';
import { Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { resetPassword, loading, error, clearError } = useAuthStore();
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (values: ResetForm) => {
    clearError();
    const success = await resetPassword(values.email);
    if (success) {
      setResetSuccess(true);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent you a password reset link. Please check your email and follow the instructions to reset your password.
          </p>
          <div className="space-y-4">
            <Link
              to="/auth/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
            <button
              onClick={() => setResetSuccess(false)}
              className="block w-full text-blue-600 hover:text-blue-700 font-semibold"
            >
              Send Another Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Logo variant="icon" size="xl" className="mx-auto mb-4 scale-125" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a password reset link</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link 
            to="/auth/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
          
          <div className="border-t pt-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
