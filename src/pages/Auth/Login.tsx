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
  Phone
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', email);
      
      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        return;
      }

      if (data.user) {
        console.log('Login successful:', data.user.email);
        
        // Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          // Create a default profile if none exists
          const defaultProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: email,
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
            role: profile.role,
            managerId: profile.manager_id,
            createdAt: profile.created_at
          };
          
          login(userProfile);
        }

        navigate('/');
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
              Sign in to your SaleMate account to access your leads
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
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
              
              {/* Password Field */}
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

              {/* Forgot Password Link */}
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

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 crm-button crm-button-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>



            {/* Development Test Accounts */}
            {import.meta.env.DEV && (
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

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/auth/signup" 
                  className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
                >
                  Sign up here
                </Link>
              </p>
            </div>

            {/* Phone Authentication Options */}
            <div className="text-center space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or use phone</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link to="/auth/phone-signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Phone Sign In
                  </Button>
                </Link>
                <Link to="/auth/phone-signup">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Phone Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Access your real estate leads and analytics</p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>✓ Lead Management</span>
                <span>✓ Purchase Tracking</span>
                <span>✓ Analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
