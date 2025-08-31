import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlus, 
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
  Shield
} from 'lucide-react';

export const Signup: React.FC = () => {
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
  const [step, setStep] = useState<'form' | 'otp' | 'completed'>('form');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

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

    // Phone validation
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to send OTP to:', formData.phone);
      
      // Format phone number (ensure it starts with +)
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      // For development, skip phone verification and create account directly
      const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_SMS_ENABLED;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Creating account directly (skipping SMS)');
        
        try {
          // Create the account directly with email/password
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
                role: formData.role,
                phone: formattedPhone
              }
            }
          });

          console.log('📊 Direct signup result:', { signupData, signupError });

          if (signupError) {
            console.error('❌ Account creation error:', signupError);
            setError(signupError.message);
            return;
          }

          if (signupData.user) {
            console.log('✅ Account created, now creating profile manually...');
            
            // Manually create the profile since the trigger might be failing
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signupData.user.id,
                name: formData.name,
                email: formData.email,
                phone: formattedPhone,
                role: formData.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (profileError) {
              console.error('❌ Profile creation error:', profileError);
              // Even if profile creation fails, the user account exists
              setError('Account created but profile setup failed. Please contact support.');
              return;
            }

            console.log('✅ Profile created successfully:', profileData);
            setSuccess('Account created successfully! Redirecting to dashboard...');
            
            // The auth store will automatically detect the new session
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        } catch (profileErr: any) {
          console.error('❌ Profile creation exception:', profileErr);
          setError('Account created but profile setup failed: ' + profileErr.message);
        }
        return;
      }

      // Production mode - Send OTP via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) {
        console.error('OTP send error:', otpError);
        // If SMS provider is not configured, fall back to dev mode
        if (otpError.message.includes('phone provider') || otpError.message.includes('SMS')) {
          console.log('📱 SMS provider not configured, using development mode');
          setSuccess(`Development mode: OTP sent to ${formattedPhone}. Use code: 123456`);
          setStep('otp');
          return;
        }
        setError(otpError.message);
        return;
      }

      setSuccess('OTP sent to your phone number. Please check your messages.');
      setStep('otp');
    } catch (err: any) {
      console.error('OTP send exception:', err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 OTP Verification started with code:', otp);
    setOtpLoading(true);
    setError('');

    if (!otp || otp.length !== 6) {
      console.log('❌ Invalid OTP length:', otp?.length);
      setError('Please enter a valid 6-digit OTP');
      setOtpLoading(false);
      return;
    }

    try {
      // Format phone number
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      // Development mode - simulate OTP verification
      const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_SMS_ENABLED;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating OTP verification');
        // Check if OTP is the development code
        if (otp !== '123456') {
          setError('Invalid OTP. Use 123456 for development mode.');
          setOtpLoading(false);
          return;
        }
        
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Development OTP verified, creating account...');
        
        // Create account directly with email/password in dev mode
        console.log('📝 Creating Supabase account with:', {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: formattedPhone
        });
        
        // Create a real Supabase account after phone verification
        console.log('🔧 Creating real Supabase account after phone verification...');
        
        // Create the account with email/password
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role,
              phone: formattedPhone
            }
          }
        });

        console.log('📊 Supabase signup result:', { signupData, signupError });

        if (signupError) {
          console.error('❌ Account creation error:', signupError);
          setError(signupError.message);
          setOtpLoading(false);
          return;
        }

        if (signupData.user) {
          console.log('👤 Creating user profile in database...');
          
          // Create profile in database (the trigger should handle this, but let's be explicit)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signupData.user.id,
              name: formData.name,
              email: formData.email,
              role: formData.role
            })
            .select()
            .single();

          console.log('📋 Profile creation result:', { profile, profileError });

          if (!profileError && profile) {
            const userProfile = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: formattedPhone,
              role: profile.role,
              managerId: profile.manager_id || undefined,
              createdAt: profile.created_at
            };
            
            console.log('🎉 Logging in authenticated user:', userProfile);
            login(userProfile);
            setStep('completed');
            setSuccess('Account created successfully! Welcome to SaleMate.');
            
            setTimeout(() => {
              console.log('🔄 Navigating to dashboard...');
              navigate('/');
            }, 2000);
          } else {
            console.error('❌ Profile creation failed:', profileError);
            setError('Account created but profile setup failed. Please contact support.');
            setOtpLoading(false);
          }
        } else {
          console.error('❌ No user data returned from signup');
          setError('Account creation failed. Please try again.');
          setOtpLoading(false);
        }
        return;
      }

      // Production mode - Verify OTP with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        setError(verifyError.message);
        return;
      }

      if (data.user) {
        console.log('Phone verified, creating account...');
        
        // Now create the account with email/password
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role,
              phone: formattedPhone
            }
          }
        });

        if (signupError) {
          console.error('Account creation error:', signupError);
          setError(signupError.message);
          return;
        }

        if (signupData.user) {
          // Create profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: signupData.user.id,
              name: formData.name,
              email: formData.email,
              phone: formattedPhone,
              role: formData.role
            })
            .select()
            .single();

          if (!profileError && profile) {
            const userProfile = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              role: profile.role,
              managerId: profile.manager_id || undefined,
              createdAt: profile.created_at
            };
            
            login(userProfile);
            setStep('completed');
            setSuccess('Account created successfully! Welcome to SaleMate.');
            
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setError('Account created but profile setup failed. Please contact support.');
          }
        }
      }
    } catch (err: any) {
      console.error('❌ OTP verification exception:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        full: err
      });
      setError(err.message || 'OTP verification failed');
    } finally {
      console.log('🔄 Setting OTP loading to false');
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;

      // Development mode - simulate OTP resend
      const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_SMS_ENABLED;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating OTP resend');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess('Development mode: OTP resent! Use code: 123456');
        return;
      }

      // Production mode - resend OTP via Supabase
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) {
        // Fall back to dev mode if SMS provider not configured
        if (otpError.message.includes('phone provider') || otpError.message.includes('SMS')) {
          console.log('📱 SMS provider not configured, using development mode');
          setSuccess('Development mode: OTP resent! Use code: 123456');
          return;
        }
        setError(otpError.message);
      } else {
        setSuccess('OTP resent successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
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
              Start managing your real estate leads today
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

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10 crm-input"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
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
                  We'll send you an OTP to verify your phone number
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

              {/* Send OTP Button */}
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

                <form onSubmit={handleOtpVerification} className="space-y-4">
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
                      onClick={handleResendOtp}
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
                    ← Back to form
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

            {/* Login Link - Only show on form step */}
            {step === 'form' && (
              <div className="space-y-3">
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
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Prefer phone signup?{' '}
                    <Link 
                      to="/auth/phone-signup" 
                      className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                    >
                      Use phone instead
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </p>
                </div>
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

export default Signup;
