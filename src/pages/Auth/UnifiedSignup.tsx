import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../store/auth';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  User,
  Building,
  CheckCircle,
  ArrowRight,
  Phone,
  Shield,
  ArrowLeft
} from 'lucide-react';

type SignupStep = 'form' | 'otp' | 'completed';

export const UnifiedSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'manager' | 'support' | 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<SignupStep>('form');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // Get Supabase URL and key from environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Phone is mandatory
    if (!formData.phone || formData.phone.length < 10) {
      setError('Phone number is mandatory for all accounts');
      setLoading(false);
      return;
    }

    try {
      console.log('📱 Requesting OTP for phone signup:', formData.phone);
      
      // Format phone number (handle Egyptian numbers)
      let formattedPhone = formData.phone.replace(/\D/g, '');
      
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

      // Call the OTP API with proper authorization
      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: formattedPhone,
          isSignup: true,
          signupData: {
            name: formData.name,
            email: formData.email || null, // Email is optional
            role: formData.role,
            password: formData.password
          }
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
      console.log('🔐 Verifying OTP for phone signup');
      
      // Format phone number
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      // Call the OTP verification API with proper authorization
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
        console.log('✅ OTP verified, account created:', result.user);
        
        // Login the user
        const userProfile = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          createdAt: new Date().toISOString()
        };
        
        login(userProfile);
        setStep('completed');
        setSuccess('Account created successfully! Welcome to SaleMate.');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (err: unknown) {
      console.error('❌ OTP verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: formattedPhone,
          isSignup: true,
          signupData: {
            name: formData.name,
            email: formData.email || null, // Email is optional
            role: formData.role,
            password: formData.password
          }
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">SaleMate</h1>
          <p className="text-muted-foreground">Join the Premium Lead Management Platform</p>
        </div>

        {/* Signup Card */}
        <Card className="card-modern">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Sign up with your phone number and optional email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'form' && (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="pl-10 crm-input"
                      required
                    />
                  </div>
                </div>

                {/* Phone Field - Always required */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className="pl-10 crm-input"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Phone number is mandatory for all accounts
                  </p>
                </div>

                {/* Email Field - Optional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email (optional)"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="pl-10 crm-input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email is optional but recommended for account recovery
                  </p>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Type</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.role}
                      onChange={(e) => updateFormData('role', e.target.value)}
                      className="pl-10 crm-input"
                    >
                      <option value="user">Real Estate Agent</option>
                      <option value="manager">Team Manager</option>
                      <option value="support">Support Staff</option>
                      <option value="admin">Administrator</option>
                    </Select>
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
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

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className="pl-10 pr-10 crm-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Verify Your Phone</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit code to {formData.phone}
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
                        Verify & Create Account
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
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to form
                  </Button>
                </div>
              </div>
            )}

            {step === 'completed' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-600">Account Created!</h3>
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
                  Already have an account?{' '}
                  <Link 
                    to="/auth/login" 
                    className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                  >
                    Sign in here
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Your data is secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
