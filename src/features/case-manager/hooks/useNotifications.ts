import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/api/client';
import { useAuthStore } from '../../store/auth';
import type { Notification } from '../../types/case';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api/caseApi';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage user notifications
 * Fetches notifications and sets up realtime subscriptions
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_events',
          filter: `target_profile_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Refetch to get accurate state
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsRead(user.id);
      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n =>
          n.status === 'sent'
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Refetch to get accurate state
      await fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'sent' && !n.read_at).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

