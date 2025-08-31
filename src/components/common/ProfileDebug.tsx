import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';

export const ProfileDebug: React.FC = () => {
  const { user, profile, refreshProfile } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkProfileDirectly = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔍 Checking profile directly for user ID:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Direct profile check error:', error);
        setDebugInfo({ error: error.message, code: error.code });
      } else {
        console.log('✅ Direct profile check result:', data);
        setDebugInfo(data);
      }
    } catch (err) {
      console.error('❌ Direct profile check exception:', err);
      setDebugInfo({ error: 'Exception occurred' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfileDirectly();
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Profile Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>User Email:</strong> {user.email}</div>
        <div><strong>Store Profile Role:</strong> {profile?.role || 'undefined'}</div>
        <div><strong>Store Role:</strong> {useAuthStore.getState().role}</div>
        <div><strong>Direct DB Role:</strong> {debugInfo?.role || 'loading...'}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        {debugInfo?.error && (
          <div className="text-red-500"><strong>Error:</strong> {debugInfo.error}</div>
        )}
      </div>
      <div className="mt-2 space-x-2">
        <button
          onClick={refreshProfile}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Refresh
        </button>
        <button
          onClick={checkProfileDirectly}
          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          Check DB
        </button>
      </div>
    </div>
  );
};
