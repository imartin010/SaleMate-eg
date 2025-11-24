/**
 * Realtime Utilities
 * 
 * Helper functions for handling Supabase realtime subscriptions with error handling
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface SubscriptionOptions {
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
  retryOnError?: boolean;
  maxRetries?: number;
}

/**
 * Safely subscribe to a realtime channel with error handling
 */
export function safeSubscribe(
  channel: RealtimeChannel,
  options: SubscriptionOptions = {}
): RealtimeChannel {
  const {
    onError,
    onStatusChange,
    retryOnError = false,
    maxRetries = 3
  } = options;

  let retryCount = 0;

  const handleStatusChange = (status: string) => {
    onStatusChange?.(status);

    // Handle connection errors
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      const error = new Error(`Realtime connection failed: ${status}`);
      
      if (retryOnError && retryCount < maxRetries) {
        retryCount++;
        console.warn(`Realtime connection failed, retrying (${retryCount}/${maxRetries})...`);
        
        // Retry after exponential backoff
        setTimeout(() => {
          channel.subscribe();
        }, Math.min(1000 * Math.pow(2, retryCount), 10000));
      } else {
        onError?.(error);
        if (!retryOnError) {
          console.warn('Realtime connection failed. Features requiring realtime updates may not work.');
        }
      }
    } else if (status === 'SUBSCRIBED') {
      retryCount = 0; // Reset retry count on successful connection
    }
  };

  // Subscribe with status callback
  channel.subscribe((status) => {
    handleStatusChange(status);
  });

  return channel;
}

/**
 * Create a realtime channel with automatic error handling
 */
export function createSafeChannel(
  supabase: SupabaseClient,
  channelName: string,
  options: SubscriptionOptions = {}
): RealtimeChannel {
  const channel = supabase.channel(channelName);
  return safeSubscribe(channel, options);
}
