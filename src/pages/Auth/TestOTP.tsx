import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export const TestOTP: React.FC = () => {
  const [phone, setPhone] = useState('01070020058');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const testOTPRequest = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🔍 Testing OTP request with:', { supabaseUrl, supabaseKey });

      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          phone: phone,
          isSignup: false
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📡 Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      try {
        const result = JSON.parse(responseText);
        setResult(JSON.stringify(result, null, 2));
      } catch (parseError) {
        setResult(`Response parsed as text: ${responseText}`);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Test failed:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">OTP Test</h1>
          <p className="text-muted-foreground">Test the OTP system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test OTP Request</CardTitle>
            <CardDescription>Test the Edge Function connection</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <Button 
              onClick={testOTPRequest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test OTP Request'}
            </Button>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="p-3 bg-green-100 border border-green-300 rounded">
                <strong>Result:</strong>
                <pre className="mt-2 text-sm overflow-auto">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
