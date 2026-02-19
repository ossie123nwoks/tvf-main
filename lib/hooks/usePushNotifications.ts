import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { pushNotificationService, PushNotificationData, NotificationPreferences } from '@/lib/notifications/push';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  isRegistered: boolean;
  permissions: Notifications.NotificationPermissionsStatus | null;
  registerForPushNotifications: () => Promise<string | null>;
  sendTestNotification: () => Promise<boolean>;
  scheduleReminder: (contentId: string, contentType: 'sermon' | 'article', scheduledFor: Date) => Promise<string | null>;
  cancelReminder: (notificationId: string) => Promise<void>;
  getNotificationHistory: (limit?: number, offset?: number) => Promise<any[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  getStats: () => Promise<{ total: number; unread: number; byType: Record<string, number> }>;
  loading: boolean;
  error: string | null;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setError('User must be authenticated to register for push notifications');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await pushNotificationService.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        setIsRegistered(true);
        console.log('Successfully registered for push notifications');
      } else {
        setError('Failed to register for push notifications');
      }
      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error registering for push notifications:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to send notifications');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const notification: PushNotificationData = {
        title: 'Test Notification',
        body: 'This is a test notification from TRUEVINE FELLOWSHIP Church app.',
        categoryId: 'content',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      };

      const success = await pushNotificationService.sendNotificationToUser(user.id, notification);
      if (!success) {
        setError('Failed to send test notification');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error sending test notification:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Schedule a reminder notification
  const scheduleReminder = useCallback(async (
    contentId: string,
    contentType: 'sermon' | 'article',
    scheduledFor: Date
  ): Promise<string | null> => {
    if (!user) {
      setError('User must be authenticated to schedule reminders');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const notification: PushNotificationData = {
        title: `Reminder: ${contentType === 'sermon' ? 'Sermon' : 'Article'} Available`,
        body: `Don't forget to check out the ${contentType} you wanted to revisit.`,
        categoryId: 'reminder',
        data: {
          type: 'reminder',
          contentId,
          contentType,
          scheduledFor: scheduledFor.toISOString(),
        },
      };

      const notificationId = await pushNotificationService.scheduleNotification(notification, scheduledFor);
      if (!notificationId) {
        setError('Failed to schedule reminder');
      }
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error scheduling reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cancel a reminder notification
  const cancelReminder = useCallback(async (notificationId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await pushNotificationService.cancelNotification(notificationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error canceling reminder:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notification history
  const getNotificationHistory = useCallback(async (
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> => {
    if (!user) {
      setError('User must be authenticated to get notification history');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const history = await pushNotificationService.getNotificationHistory(user.id, limit, offset);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting notification history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await pushNotificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error marking notification as read:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notification statistics
  const getStats = useCallback(async (): Promise<{ total: number; unread: number; byType: Record<string, number> }> => {
    if (!user) {
      setError('User must be authenticated to get notification stats');
      return { total: 0, unread: 0, byType: {} };
    }

    setLoading(true);
    setError(null);

    try {
      const stats = await pushNotificationService.getNotificationStats(user.id);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error getting notification stats:', err);
      return { total: 0, unread: 0, byType: {} };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const currentPermissions = await pushNotificationService.getPermissions();
        setPermissions(currentPermissions);
        
        // If permissions are granted, try to get existing token
        if (currentPermissions.status === 'granted') {
          const existingToken = pushNotificationService.getExpoPushToken();
          if (existingToken) {
            setExpoPushToken(existingToken);
            setIsRegistered(true);
          }
        }
      } catch (err) {
        console.error('Error checking notification permissions:', err);
      }
    };

    checkPermissions();
  }, []);

  // Set up notification listeners (only once per user session)
  useEffect(() => {
    if (!user) return;

    let notificationListener: Notifications.Subscription | null = null;
    let responseListener: Notifications.Subscription | null = null;

    // Handle notification received while app is in foreground
    notificationListener = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        // Only log once - avoid duplicate logs
        const notificationId = notification.request.identifier;
        console.log('Notification received:', {
          id: notificationId,
          title: notification.request.content.title,
          body: notification.request.content.body,
        });
        // You can handle foreground notifications here
        // For example, show an in-app notification or update UI
      }
    );

    // Handle notification response (when user taps notification)
    responseListener = pushNotificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        
        // Handle notification tap
        const data = response.notification.request.content.data;
        
        if (data?.type === 'content' && data?.contentId) {
          // Navigate to content
          // You would use your navigation system here
          console.log('Navigate to content:', data.contentId);
        } else if (data?.type === 'reminder' && data?.contentId) {
          // Navigate to content for reminder
          console.log('Navigate to reminder content:', data.contentId);
        }
      }
    );

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [user?.id]); // Only re-run if user ID changes, not on every user object change

  return {
    expoPushToken,
    isRegistered,
    permissions,
    registerForPushNotifications,
    sendTestNotification,
    scheduleReminder,
    cancelReminder,
    getNotificationHistory,
    markAsRead,
    getStats,
    loading,
    error,
  };
};
