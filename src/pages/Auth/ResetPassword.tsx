import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Logo } from '../../components/common/Logo';
import { Loader2, Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateEmail()) return;

    const success = await resetPassword(email);
    if (success) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Click the link in your email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setEmailSent(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Send Another Email
              </button>
              <Link
                to="/auth/login"
                className="w-full block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/auth/login"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Logo variant="icon" size="md" />
          <div className="w-5" /> {/* Spacer */}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {validationError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationError}
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
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">Remember your password? </span>
          <Link to="/auth/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}