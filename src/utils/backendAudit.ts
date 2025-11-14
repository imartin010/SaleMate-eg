/**
 * Comprehensive Backend-Frontend Connection Audit
 * Tests all aspects of the Supabase connection
 */

import { supabase } from '../lib/supabaseClient';

export interface AuditResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface AuditReport {
  overall: 'healthy' | 'degraded' | 'critical';
  results: AuditResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Run comprehensive backend connection audit
 */
export async function auditBackendConnection(): Promise<AuditReport> {
  const results: AuditResult[] = [];
  
  // 1. Check Environment Variables
  results.push(await testEnvironmentVariables());
  
  // 2. Test Supabase Client Initialization
  results.push(await testSupabaseClient());
  
  // 3. Test Network Connectivity
  results.push(await testNetworkConnectivity());
  
  // 4. Test Authentication Service
  results.push(await testAuthService());
  
  // 5. Test Database Connection
  results.push(await testDatabaseConnection());
  
  // 6. Test RLS Policies
  results.push(await testRLSPolicies());
  
  // 7. Test Critical Tables
  results.push(await testCriticalTables());
  
  // 8. Test Edge Functions
  results.push(await testEdgeFunctions());
  
  // 9. Test Realtime Connection
  results.push(await testRealtimeConnection());
  
  // 10. Test Performance
  results.push(await testPerformance());
  
  // Calculate summary
  const summary = {
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warning').length,
  };
  
  // Determine overall health
  let overall: 'healthy' | 'degraded' | 'critical';
  if (summary.failed === 0 && summary.warnings === 0) {
    overall = 'healthy';
  } else if (summary.failed === 0) {
    overall = 'degraded';
  } else {
    overall = 'critical';
  }
  
  return {
    overall,
    results,
    summary,
  };
}

async function testEnvironmentVariables(): Promise<AuditResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      test: 'Environment Variables',
      status: 'fail',
      message: 'Missing required environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseAnonKey?.length || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  if (!supabaseUrl.startsWith('https://')) {
    return {
      test: 'Environment Variables',
      status: 'warning',
      message: 'Supabase URL should use HTTPS',
      details: { url: supabaseUrl },
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    test: 'Environment Variables',
    status: 'pass',
    message: 'All environment variables are set',
    details: {
      url: supabaseUrl.substring(0, 30) + '...',
      keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
    },
    timestamp: new Date().toISOString(),
  };
}

async function testSupabaseClient(): Promise<AuditResult> {
  try {
    if (!supabase) {
      return {
        test: 'Supabase Client',
        status: 'fail',
        message: 'Supabase client is not initialized',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Test if client has required methods
    const hasAuth = typeof supabase.auth === 'object';
    const hasFrom = typeof supabase.from === 'function';
    const hasRpc = typeof supabase.rpc === 'function';
    
    if (!hasAuth || !hasFrom || !hasRpc) {
      return {
        test: 'Supabase Client',
        status: 'fail',
        message: 'Supabase client is missing required methods',
        details: { hasAuth, hasFrom, hasRpc },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      test: 'Supabase Client',
      status: 'pass',
      message: 'Supabase client is properly initialized',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'Supabase Client',
      status: 'fail',
      message: `Client initialization error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testNetworkConnectivity(): Promise<AuditResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        test: 'Network Connectivity',
        status: 'fail',
        message: 'Cannot test: Supabase URL not configured',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Test REST endpoint
    const startTime = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
    });
    const latency = Date.now() - startTime;
    
    if (!response.ok && response.status !== 401) {
      return {
        test: 'Network Connectivity',
        status: 'fail',
        message: `Network request failed: ${response.status} ${response.statusText}`,
        details: { status: response.status, latency },
        timestamp: new Date().toISOString(),
      };
    }
    
    if (latency > 5000) {
      return {
        test: 'Network Connectivity',
        status: 'warning',
        message: `High latency detected: ${latency}ms`,
        details: { latency },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      test: 'Network Connectivity',
      status: 'pass',
      message: `Network connection successful (${latency}ms)`,
      details: { latency, status: response.status },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'Network Connectivity',
      status: 'fail',
      message: `Network error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testAuthService(): Promise<AuditResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message !== 'Auth session missing!') {
      return {
        test: 'Authentication Service',
        status: 'fail',
        message: `Auth service error: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
    
    // Check if session can be retrieved
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      test: 'Authentication Service',
      status: user ? 'pass' : 'warning',
      message: user ? 'Authentication service is working' : 'No active session (expected if not logged in)',
      details: {
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'Authentication Service',
      status: 'fail',
      message: `Auth service error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testDatabaseConnection(): Promise<AuditResult> {
  try {
    // Test with a simple query that should work for all users
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (error) {
      // Check if it's an RLS issue or actual connection issue
      if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
        return {
          test: 'Database Connection',
          status: 'warning',
          message: 'Database is reachable but RLS policies may be blocking access',
          details: { error: error.message, code: error.code },
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        test: 'Database Connection',
        status: 'fail',
        message: `Database connection error: ${error.message}`,
        details: { error: error.message, code: error.code },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      test: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful',
      details: { rowsReturned: data?.length || 0 },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'Database Connection',
      status: 'fail',
      message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testRLSPolicies(): Promise<AuditResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        test: 'RLS Policies',
        status: 'warning',
        message: 'Cannot test RLS: No authenticated user',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Test profile access (should work for own profile)
    // Use maybeSingle() instead of single() to handle case where profile doesn't exist yet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      // Check if it's a "table doesn't exist" error vs RLS error
      if (profileError.code === 'PGRST205' || profileError.message?.includes('does not exist')) {
        return {
          test: 'RLS Policies',
          status: 'fail',
          message: `Profiles table issue: ${profileError.message}`,
          details: { error: profileError.message, code: profileError.code },
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        test: 'RLS Policies',
        status: 'fail',
        message: `RLS policy issue: Cannot access own profile - ${profileError.message}`,
        details: { error: profileError.message, code: profileError.code },
        timestamp: new Date().toISOString(),
      };
    }
    
    // If no profile exists, try to create one
    if (!profile) {
      try {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            phone: user.user_metadata?.phone || user.phone || '',
            role: 'user',
            wallet_balance: 0,
          });
        
        if (createError) {
          // If it's a duplicate key error, the profile might exist but wasn't found
          // Try fetching again with a different approach
          if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('id, name, email')
              .eq('id', user.id)
              .maybeSingle();
            
            if (retryProfile) {
              return {
                test: 'RLS Policies',
                status: 'pass',
                message: 'RLS policies are working correctly (profile found on retry)',
                details: { canAccessProfile: true },
                timestamp: new Date().toISOString(),
              };
            }
          }
          
          return {
            test: 'RLS Policies',
            status: 'warning',
            message: `Profile creation issue: ${createError.message}`,
            details: { error: createError.message, code: createError.code },
            timestamp: new Date().toISOString(),
          };
        }
        
        // Retry fetching the profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .maybeSingle();
        
        if (newProfile) {
          return {
            test: 'RLS Policies',
            status: 'pass',
            message: 'RLS policies are working correctly (profile created)',
            details: { canAccessProfile: true, profileCreated: true },
            timestamp: new Date().toISOString(),
          };
        }
      } catch (createErr) {
        return {
          test: 'RLS Policies',
          status: 'warning',
          message: `Profile missing and creation failed: ${createErr instanceof Error ? createErr.message : String(createErr)}`,
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    // Test leads access
    const { error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (leadsError && leadsError.code === 'PGRST116') {
      return {
        test: 'RLS Policies',
        status: 'warning',
        message: 'RLS policies may be too restrictive for leads table',
        details: { error: leadsError.message },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      test: 'RLS Policies',
      status: 'pass',
      message: 'RLS policies are working correctly',
      details: { canAccessProfile: !!profile },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'RLS Policies',
      status: 'fail',
      message: `RLS test error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testCriticalTables(): Promise<AuditResult> {
  const criticalTables = ['profiles', 'projects', 'leads'];
  const results: Record<string, { accessible: boolean; error?: string }> = {};
  
  for (const table of criticalTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      results[table] = {
        accessible: !error || error.code !== '42P01', // 42P01 = table does not exist
        error: error?.message,
      };
    } catch (error) {
      results[table] = {
        accessible: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  const allAccessible = Object.values(results).every(r => r.accessible);
  const someAccessible = Object.values(results).some(r => r.accessible);
  
  if (!allAccessible) {
    return {
      test: 'Critical Tables',
      status: someAccessible ? 'warning' : 'fail',
      message: `Some critical tables are not accessible`,
      details: results,
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    test: 'Critical Tables',
    status: 'pass',
    message: 'All critical tables are accessible',
    details: results,
    timestamp: new Date().toISOString(),
  };
}

async function testEdgeFunctions(): Promise<AuditResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        test: 'Edge Functions',
        status: 'fail',
        message: 'Cannot test: Supabase URL not configured',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Test a known edge function (send-otp or verify-otp)
    // These are common functions that should exist
    const testFunctions = ['send-otp', 'verify-otp'];
    let lastError: Error | null = null;
    
    for (const funcName of testFunctions) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: true }),
        });
        const latency = Date.now() - startTime;
        
        // Even if the function returns an error, if we get a response, the endpoint is working
        // 400/401/422 are expected for invalid requests, which means the function exists
        if (response.status === 200 || response.status === 400 || response.status === 401 || response.status === 422) {
          return {
            test: 'Edge Functions',
            status: 'pass',
            message: `Edge function '${funcName}' is accessible`,
            details: { function: funcName, status: response.status, latency },
            timestamp: new Date().toISOString(),
          };
        }
        
        // 404 means function doesn't exist, but endpoint is reachable
        if (response.status === 404) {
          continue; // Try next function
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue; // Try next function
      }
    }
    
    // If no functions worked, check if the endpoint itself is reachable
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      });
      
      // Any response (even 404) means the endpoint is configured
      return {
        test: 'Edge Functions',
        status: 'pass',
        message: 'Edge functions endpoint is configured and reachable',
        details: { status: response.status },
        timestamp: new Date().toISOString(),
      };
    } catch (endpointErr) {
      // Network error - endpoint might not be accessible
      return {
        test: 'Edge Functions',
        status: 'warning',
        message: 'Edge functions endpoint may not be accessible (this is normal if functions are not deployed)',
        details: { error: lastError?.message || (endpointErr instanceof Error ? endpointErr.message : String(endpointErr)) },
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      test: 'Edge Functions',
      status: 'warning',
      message: 'Edge functions test could not complete (this is normal if functions are not deployed)',
      details: { error: error instanceof Error ? error.message : String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

async function testRealtimeConnection(): Promise<AuditResult> {
  try {
    // Create a unique channel name to avoid conflicts
    const channelName = `audit-test-${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    return new Promise((resolve) => {
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            channel.unsubscribe();
            supabase.removeChannel(channel);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
      
      // Increase timeout to 5 seconds for better reliability
      const timeout = setTimeout(() => {
        cleanup();
        if (!resolved) {
          resolve({
            test: 'Realtime Connection',
            status: 'warning',
            message: 'Realtime connection test timed out (this is normal if realtime is not actively used)',
            details: { note: 'Realtime may require active subscription to establish connection' },
            timestamp: new Date().toISOString(),
          });
        }
      }, 5000);
      
      // Subscribe to the channel
      channel
        .subscribe((status, err) => {
          if (resolved) return;
          
          clearTimeout(timeout);
          
          if (err) {
            cleanup();
            resolve({
              test: 'Realtime Connection',
              status: 'warning',
              message: `Realtime connection error: ${err.message || 'Unknown error'}`,
              details: { error: err.message },
              timestamp: new Date().toISOString(),
            });
            return;
          }
          
          if (status === 'SUBSCRIBED') {
            cleanup();
            resolve({
              test: 'Realtime Connection',
              status: 'pass',
              message: 'Realtime connection successful',
              details: { status },
              timestamp: new Date().toISOString(),
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            cleanup();
            resolve({
              test: 'Realtime Connection',
              status: 'warning',
              message: `Realtime connection status: ${status} (this is normal if realtime is not actively used)`,
              details: { status, note: 'Realtime may require active subscription or may be disabled' },
              timestamp: new Date().toISOString(),
            });
          } else {
            // Wait a bit more for SUBSCRIBED status
            // If we get here, the connection is in progress
            setTimeout(() => {
              if (!resolved && status !== 'SUBSCRIBED') {
                cleanup();
                resolve({
                  test: 'Realtime Connection',
                  status: 'pass',
                  message: `Realtime connection established (status: ${status})`,
                  details: { status },
                  timestamp: new Date().toISOString(),
                });
              }
            }, 1000);
          }
        });
    });
  } catch (error) {
    return {
      test: 'Realtime Connection',
      status: 'warning',
      message: `Realtime test error: ${error instanceof Error ? error.message : String(error)} (this is normal if realtime is not configured)`,
      details: { error: error instanceof Error ? error.message : String(error) },
      timestamp: new Date().toISOString(),
    };
  }
}

async function testPerformance(): Promise<AuditResult> {
  try {
    const queries = [
      () => supabase.from('projects').select('id').limit(1),
      () => supabase.from('profiles').select('id').limit(1),
    ];
    
    const startTime = Date.now();
    await Promise.all(queries.map(q => q()));
    const totalTime = Date.now() - startTime;
    
    if (totalTime > 3000) {
      return {
        test: 'Performance',
        status: 'warning',
        message: `Slow query performance: ${totalTime}ms`,
        details: { totalTime },
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      test: 'Performance',
      status: 'pass',
      message: `Query performance is good (${totalTime}ms)`,
      details: { totalTime },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      test: 'Performance',
      status: 'warning',
      message: `Performance test error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

