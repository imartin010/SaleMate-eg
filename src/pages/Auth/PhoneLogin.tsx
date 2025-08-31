import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../store/auth';
import { Loader2, Smartphone, AlertCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

const phoneSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number is too short')
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +201234567890)'),
});

const codeSchema = z.object({
  code: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type CodeForm = z.infer<typeof codeSchema>;

export default function PhoneLogin() {
  const navigate = useNavigate();
  const { user, sendOTP, verifyOTP, loading, error, clearError } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countdown, setCountdown] = useState(0);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
  });

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

  const onPhoneSubmit = async (values: PhoneForm) => {
    const success = await sendOTP(values.phone);
    if (success) {
      setPhoneNumber(values.phone);
      setStep('code');
      setCountdown(45); // 45 second cooldown
    }
  };

  const onCodeSubmit = async (values: CodeForm) => {
    const success = await verifyOTP(
      phoneNumber,
      values.code,
      values.email,
      values.name
    );
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    const success = await sendOTP(phoneNumber);
    if (success) {
      setCountdown(45);
    }
  };

  const goBack = () => {
    if (step === 'code') {
      setStep('phone');
      setPhoneNumber('');
      clearError();
    } else {
      navigate('/auth/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo variant="icon" size="md" />
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === 'phone' ? 'Phone Login' : 'Verify Code'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 'phone' 
                ? 'Enter your phone number to receive a verification code'
                : `We sent a 6-digit code to ${phoneNumber}`
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+201234567890"
                  {...phoneForm.register('phone')}
                  className={phoneForm.formState.errors.phone ? 'border-red-500' : ''}
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Use international format with country code (e.g., +20 for Egypt)
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...codeForm.register('code')}
                  className={`text-center text-lg tracking-widest ${codeForm.formState.errors.code ? 'border-red-500' : ''}`}
                />
                {codeForm.formState.errors.code && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  {...codeForm.register('name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...codeForm.register('email')}
                />
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Verify & Sign In
                  </>
                )}
              </Button>

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

          <div className="text-center text-sm">
            <span className="text-gray-600">Prefer email? </span>
            <Link to="/auth/login" className="text-blue-600 hover:underline font-medium">
              Sign in with email
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
