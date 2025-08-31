import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogIn, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Phone,
  Shield,
  CheckCircle,
  ArrowRight,
  Smartphone,
  AtSign
} from 'lucide-react';

type AuthMethod = 'email' | 'phone';
type LoginStep = 'form' | 'otp' | 'completed';

export const UnifiedLogin: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>('form');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📧 Attempting login with:', email);
      
      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        setError(authError.message);
        return;
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email);
        
        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile error:', profileError);
          // Create a default profile if none exists
          const defaultProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: email,
            phone: data.user.user_metadata?.phone || null,
            role: 'user' as const,
            createdAt: new Date().toISOString()
          };
          
          login(defaultProfile);
        } else {
          // Use existing profile
          const userProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: (profile as any).phone || undefined, // Safely access phone property
            role: profile.role,
            managerId: profile.manager_id || undefined,
            createdAt: profile.created_at
          };
          
          login(userProfile);
        }

        setStep('completed');
        setSuccess('Login successful! Redirecting to dashboard...');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      console.log('📱 Requesting OTP for phone login:', phone);
      
      // Format phone number (handle Egyptian numbers)
      let formattedPhone = phone.replace(/\D/g, '');
      
      // Handle Egyptian phone numbers (01070020058 -> +201070020058)
      if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
        formattedPhone = '+20' + formattedPhone.substring(1);
      } 
      // Handle US phone numbers
      else if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '+1' + formattedPhone;
      }
      // Add + if missing
      else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Get Supabase URL and key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🔗 Using Supabase URL:', supabaseUrl);

      // Call the OTP API with full URL and proper headers
      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: formattedPhone,
          isSignup: false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request OTP');
      }

      setSuccess(result.message || 'OTP sent successfully!');
      
      // In development mode, show the OTP code
      if (result.otp) {
        setSuccess(`Development mode: OTP sent! Use code: ${result.otp}`);
      }
      
      setStep('otp');
    } catch (err: unknown) {
      console.error('❌ OTP request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setOtpLoading(false);
      return;
    }

    try {
      console.log('🔐 Verifying OTP for phone login');
      
      // Format phone number (handle Egyptian numbers)
      let formattedPhone = phone.replace(/\D/g, '');
      
      // Handle Egyptian phone numbers (01070020058 -> +201070020058)
      if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
        formattedPhone = '+20' + formattedPhone.substring(1);
      } 
      // Handle US phone numbers
      else if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '+1' + formattedPhone;
      }
      // Add + if missing
      else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Get Supabase URL and key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Call the OTP verification API with full URL and proper headers
      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: formattedPhone,
          code: otp
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      if (result.success) {
        console.log('✅ OTP verified, user signed in:', result.user);
        
        // Login the user
        const userProfile = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          managerId: result.user.manager_id || undefined,
          createdAt: result.user.created_at
        };
        
        login(userProfile);
        setStep('completed');
        setSuccess('Signin successful! Welcome back to SaleMate.');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (err: any) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      let formattedPhone = phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      // Get Supabase URL and key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: formattedPhone,
          isSignup: false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      setSuccess(result.message || 'OTP resent successfully!');
      
      // In development mode, show the OTP code
      if (result.otp) {
        setSuccess(`Development mode: OTP resent! Use code: ${result.otp}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (authMethod === 'email') {
      handleEmailLogin(e);
    } else {
      handlePhoneLogin(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">SaleMate</h1>
          <p className="text-muted-foreground">Premium Real Estate Lead Management</p>
        </div>

        {/* Login Card */}
        <Card className="card-modern">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your SaleMate account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'form' && (
              <>
                {/* Authentication Method Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Signin Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={authMethod === 'email' ? 'default' : 'outline'}
                      onClick={() => setAuthMethod('email')}
                      className="flex items-center gap-2"
                    >
                      <AtSign className="h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === 'phone' ? 'default' : 'outline'}
                      onClick={() => setAuthMethod('phone')}
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      Phone
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field - Only show for email login */}
                  {authMethod === 'email' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 crm-input"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone Field - Only show for phone login */}
                  {authMethod === 'phone' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 crm-input"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We'll send you an OTP to verify your phone number
                      </p>
                    </div>
                  )}
                  
                  {/* Password Field - Only show for email login */}
                  {authMethod === 'email' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 crm-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forgot Password Link - Only show for email login */}
                  {authMethod === 'email' && (
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-sm text-primary hover:text-primary/80 font-medium"
                        onClick={() => {
                          // TODO: Implement forgot password functionality
                          console.log('Forgot password clicked');
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">{success}</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 crm-button crm-button-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {authMethod === 'email' ? 'Signing In...' : 'Sending OTP...'}
                      </>
                    ) : (
                      <>
                        {authMethod === 'email' ? (
                          <>
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Send OTP
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>

                {/* Development Test Accounts - Only show for email login */}
                {authMethod === 'email' && import.meta.env.DEV && (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Quick Access (Test Accounts)</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmail('admin@salemate.com');
                          setPassword('admin123');
                        }}
                        className="text-xs"
                      >
                        Admin Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmail('user1@salemate.com');
                          setPassword('user123');
                        }}
                        className="text-xs"
                      >
                        User Test
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      These accounts have access to real backend data and leads
                    </p>
                  </div>
                )}
              </>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Verify Your Phone</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit code to {phone}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter OTP Code</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest crm-input"
                      maxLength={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 crm-button crm-button-primary"
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify & Sign In
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Didn't receive the code?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        'Resend OTP'
                      )}
                    </Button>
                  </div>
                </form>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('form')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back to login
                  </Button>
                </div>
              </div>
            )}

            {step === 'completed' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-600">Login Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Redirecting you to your dashboard...
                  </p>
                </div>
                <div className="animate-pulse">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                </div>
              </div>
            )}

            {/* Navigation Links - Only show on form step */}
            {step === 'form' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    to="/auth/signup" 
                    className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                  >
                    Sign up here
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Access your real estate leads and analytics</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>✓ Lead Management</span>
            <span>✓ Purchase Tracking</span>
            <span>✓ Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
