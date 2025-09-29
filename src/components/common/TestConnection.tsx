import React, { useState } from 'react';
import { supabase } from "../../lib/supabaseClient"
import { useAuthStore } from '../../store/auth';

export const TestConnection: React.FC = () => {
  const { user } = useAuthStore();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      // Test basic connection
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        setTestResult(`❌ Connection error: ${error.message}`);
        return;
      }
      
      setTestResult('✅ Database connection successful');
      
      // Test specific user profile
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          setTestResult(`❌ Profile fetch error: ${profileError.message}`);
        } else {
          setTestResult(`✅ Profile found: ${profile.name} (${profile.role})`);
        }
      }
    } catch (err) {
      setTestResult(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Connection Test</h3>
      <div className="text-xs mb-2">
        <div><strong>User:</strong> {user?.email || 'Not logged in'}</div>
        <div><strong>Status:</strong> {testResult || 'Not tested'}</div>
      </div>
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
    </div>
  );
};
