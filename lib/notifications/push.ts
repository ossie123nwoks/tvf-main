import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { notificationAnalyticsService } from './analyticsService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
  sound?: boolean;
  badge?: number;
}

export interface NotificationCategory {
  id: string;
  name: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
}

export interface NotificationPreferences {
  newContent: boolean;
  reminders: boolean;
  updates: boolean;
  marketing: boolean;
}

export interface ScheduledNotification {
  id: string;
  contentId: string;
  contentType: 'sermon' | 'article';
  scheduledFor: Date;
  title: string;
  body: string;
  userId: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private recentNotifications: Map<string, number> = new Map(); // Track recent notifications to prevent duplicates
  private notificationCategories: NotificationCategory[] = [];

  constructor() {
    this.initializeNotificationCategories();
  }

  /**
   * Initialize notification categories for different types of notifications
   */
  private initializeNotificationCategories(): void {
    this.notificationCategories = [
      {
        id: 'content',
        name: 'Content Notifications',
        actions: [
          {
            id: 'view',
            title: 'View',
            authenticationRequired: false,
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
            destructive: false,
          },
        ],
      },
      {
        id: 'reminder',
        name: 'Reminder Notifications',
        actions: [
          {
            id: 'view',
            title: 'View',
            authenticationRequired: false,
          },
          {
            id: 'snooze',
            title: 'Snooze 1 Hour',
            destructive: false,
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
            destructive: false,
          },
        ],
      },
      {
        id: 'update',
        name: 'App Updates',
        actions: [
          {
            id: 'view',
            title: 'View',
            authenticationRequired: false,
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
            destructive: false,
          },
        ],
      },
    ];
  }

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for push notifications');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      // Get the projectId from expo-constants as per Expo documentation
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('Project ID not found in app config');
        return null;
      }

      // Get the push token with projectId
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
      } catch (tokenError: any) {
        // Handle Firebase initialization errors gracefully
        const errorMessage = tokenError?.message || String(tokenError);
        
        if (Platform.OS === 'android' && errorMessage.includes('FirebaseApp')) {
          console.warn(
            'Push notifications: Firebase not configured for Android.\n' +
            'To enable push notifications on Android, you need to:\n' +
            '1. Create a Firebase project at https://console.firebase.google.com\n' +
            '2. Add your Android app (package: com.tvffellowship.app)\n' +
            '3. Download google-services.json and place it in the project root\n' +
            '4. Rebuild your app\n' +
            'See docs/PUSH_NOTIFICATIONS_SETUP.md for detailed instructions.'
          );
          return null;
        }
        
        // Re-throw other errors
        throw tokenError;
      }

      this.expoPushToken = token.data;
      console.log('Expo push token:', this.expoPushToken);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        try {
          await this.setupAndroidChannels();
        } catch (channelError: any) {
          // Non-critical error, log but continue
          const errorMessage = channelError?.message || String(channelError);
          if (errorMessage.includes('FirebaseApp')) {
            console.warn('Android notification channels: Firebase not configured. Continuing without channels.');
          } else {
            console.warn('Error setting up Android notification channels:', channelError);
          }
        }
      }

      // Set up notification categories
      try {
        await this.setupNotificationCategories();
      } catch (categoryError) {
        // Non-critical error, log but continue
        console.warn('Error setting up notification categories:', categoryError);
      }

      // Store the token in Supabase
      await this.storePushToken(this.expoPushToken);

      return this.expoPushToken;
    } catch (error: any) {
      // Check if it's a Firebase-related error
      const errorMessage = error?.message || String(error);
      
      if (Platform.OS === 'android' && errorMessage.includes('FirebaseApp')) {
        console.warn(
          'Push notifications unavailable: Firebase not configured.\n' +
          'This is expected in development. See docs/PUSH_NOTIFICATIONS_SETUP.md for setup instructions.'
        );
      } else {
        console.error('Error registering for push notifications:', error);
      }
      
      return null;
    }
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('content', {
      name: 'Content Notifications',
      description: 'Notifications for new sermons and articles',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Reminder Notifications',
      description: 'Notifications for scheduled reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('update', {
      name: 'App Updates',
      description: 'Notifications for app updates and announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('marketing', {
      name: 'News & Updates',
      description: 'Notifications for church news and marketing',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
      sound: 'default',
    });
  }

  /**
   * Set up notification categories for iOS
   */
  private async setupNotificationCategories(): Promise<void> {
    for (const category of this.notificationCategories) {
      // Transform actions to match Expo's expected format
      const expoActions = (category.actions || []).map(action => ({
        identifier: action.id,
        buttonTitle: action.title,
        options: {
          opensAppToForeground: action.id === 'view',
          isDestructive: action.destructive || false,
          isAuthenticationRequired: action.authenticationRequired || false,
        },
      }));
      
      await Notifications.setNotificationCategoryAsync(category.id, expoActions);
    }
  }

  /**
   * Store push token in Supabase
   */
  private async storePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user to store push token');
        return;
      }

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Platform.OS,
          device_id: Device.osInternalBuildId || 'unknown',
          is_active: true,
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error storing push token:', error);
      } else {
        console.log('Push token stored successfully');
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  /**
   * Send a push notification to a specific user
   */
  async sendNotificationToUser(
    userId: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      // Create a unique key for deduplication (userId + title + timestamp within last minute)
      const dedupeKey = `${userId}-${notification.title}-${Math.floor(Date.now() / 60000)}`;
      
      // Check if we've sent this notification recently (within the last minute)
      const lastSent = this.recentNotifications.get(dedupeKey);
      if (lastSent && Date.now() - lastSent < 60000) {
        console.log(`Skipping duplicate notification to user ${userId}: ${notification.title}`);
        return false;
      }

      // Get user's active push token(s) - get the most recent one if multiple exist
      const { data: tokenData, error: tokenError } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenError) {
        console.error('Error fetching push token for user:', userId, tokenError);
        return false;
      }

      if (!tokenData || !tokenData.token) {
        // User doesn't have a push token registered - this is expected for users who haven't enabled notifications
        console.log(`User ${userId} doesn't have an active push token. Skipping notification.`);
        return false;
      }

      // Mark this notification as sent
      this.recentNotifications.set(dedupeKey, Date.now());
      
      // Clean up old entries (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 300000;
      for (const [key, timestamp] of this.recentNotifications.entries()) {
        if (timestamp < fiveMinutesAgo) {
          this.recentNotifications.delete(key);
        }
      }

      // Send the notification
      const message = {
        to: tokenData.token,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false ? 'default' : undefined,
        badge: notification.badge,
        categoryId: notification.categoryId,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'ok') {
        // Store notification in database
        const notificationRecord = await this.storeNotificationHistory(userId, notification);
        
        // Track delivery status
        if (notificationRecord) {
          await notificationAnalyticsService.trackNotificationDelivery(
            notificationRecord.id,
            userId,
            'delivered',
            { platform: Platform.OS, deviceId: Device.osInternalBuildId }
          );
        }
        
        return true;
      } else {
        // Check if it's an FCM configuration error (Android)
        const isFCMError = result.data?.details?.error === 'InvalidCredentials' ||
                          result.data?.message?.includes('FCM server key') ||
                          result.data?.message?.includes('Firebase');

        if (isFCMError && Platform.OS === 'android') {
          console.warn(
            'Android push notification failed: FCM not configured.\n' +
            'To enable Android push notifications:\n' +
            '1. Create a Firebase project at https://console.firebase.google.com\n' +
            '2. Add your Android app (package: com.tvffellowship.app)\n' +
            '3. Download google-services.json and place it in the project root\n' +
            '4. Configure FCM server key in Expo dashboard\n' +
            '5. Rebuild your app\n' +
            'See docs/PUSH_NOTIFICATIONS_SETUP.md for detailed instructions.'
          );
          // Don't store failed notification for FCM config issues
          return false;
        }

        console.error('Failed to send notification:', result);
        
        // Track failed delivery (except for FCM config issues)
        const notificationRecord = await this.storeNotificationHistory(userId, notification);
        if (notificationRecord) {
          await notificationAnalyticsService.trackNotificationDelivery(
            notificationRecord.id,
            userId,
            'failed',
            { platform: Platform.OS, deviceId: Device.osInternalBuildId },
            result.data?.message || 'Unknown error'
          );
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to all users with specific preferences
   */
  async sendNotificationToAllUsers(
    notification: PushNotificationData,
    preferences: Partial<NotificationPreferences> = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get all users with active push tokens and matching preferences
      let query = supabase
        .from('push_tokens')
        .select(`
          user_id,
          token,
          users!inner(
            preferences
          )
        `)
        .eq('is_active', true);

      // Apply preference filters if provided
      if (preferences.newContent !== undefined) {
        query = query.eq('users.preferences.notifications.newContent', preferences.newContent);
      }
      if (preferences.reminders !== undefined) {
        query = query.eq('users.preferences.notifications.reminders', preferences.reminders);
      }
      if (preferences.updates !== undefined) {
        query = query.eq('users.preferences.notifications.updates', preferences.updates);
      }
      if (preferences.marketing !== undefined) {
        query = query.eq('users.preferences.notifications.marketing', preferences.marketing);
      }

      const { data: users, error } = await query;

      if (error) {
        console.error('Error fetching users for notification:', error);
        return { sent: 0, failed: 0 };
      }

      if (!users || users.length === 0) {
        console.log('No users found matching notification preferences');
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      // Send notification to each user
      for (const user of users) {
        const success = await this.sendNotificationToUser(user.user_id, notification);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification to multiple specific users by their IDs
   */
  async sendNotificationToUsers(
    userIds: string[],
    notification: PushNotificationData
  ): Promise<{ sent: number; failed: number; skipped: number }> {
    try {
      let sent = 0;
      let failed = 0;
      let skipped = 0;

      // First, check which users have active push tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from('push_tokens')
        .select('user_id, token')
        .in('user_id', userIds)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (tokensError) {
        console.error('Error fetching push tokens:', tokensError);
        return { sent: 0, failed: userIds.length, skipped: 0 };
      }

      // Create a map of user_id to token (use most recent token per user)
      const userTokenMap = new Map<string, string>();
      if (tokensData) {
        for (const tokenData of tokensData) {
          if (!userTokenMap.has(tokenData.user_id)) {
            userTokenMap.set(tokenData.user_id, tokenData.token);
          }
        }
      }

      // Send notifications only to users with tokens
      for (const userId of userIds) {
        const token = userTokenMap.get(userId);
        if (!token) {
          skipped++;
          continue;
        }

        const success = await this.sendNotificationToUser(userId, notification);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      return { sent, failed, skipped };
    } catch (error) {
      console.error('Error sending notifications to users:', error);
      return { sent: 0, failed: userIds.length, skipped: 0 };
    }
  }

  /**
   * Send notification to users by role
   */
  async sendNotificationByRole(
    role: 'admin' | 'moderator' | 'member',
    notification: PushNotificationData
  ): Promise<{ sent: number; failed: number }> {
    try {
      // First, get all users with the specified role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', role);

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return { sent: 0, failed: 0 };
      }

      if (!users || users.length === 0) {
        console.log(`No users found with role: ${role}`);
        return { sent: 0, failed: 0 };
      }

      const userIds = users.map(u => u.id);

      // Get push tokens for these users
      const { data: tokens, error: tokensError } = await supabase
        .from('push_tokens')
        .select('user_id')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (tokensError) {
        console.error('Error fetching push tokens:', tokensError);
        return { sent: 0, failed: 0 };
      }

      if (!tokens || tokens.length === 0) {
        console.log(`No active push tokens found for users with role: ${role}`);
        return { sent: 0, failed: 0 };
      }

      const tokenUserIds = tokens.map(t => t.user_id);
      return await this.sendNotificationToUsers(tokenUserIds, notification);
    } catch (error) {
      console.error('Error sending notification by role:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  async scheduleNotification(
    notification: PushNotificationData,
    trigger: Date | number
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false ? 'default' : undefined,
          badge: notification.badge,
          categoryIdentifier: notification.categoryId,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Unregister from push notifications and deactivate token in Supabase
   */
  async unregisterFromPushNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user to unregister push token');
        return;
      }

      // Deactivate the user's push tokens
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deactivating push token:', error);
      } else {
        console.log('Push token deactivated successfully');
      }

      // Clear the local token
      this.expoPushToken = null;
    } catch (error) {
      console.error('Error unregistering from push notifications:', error);
    }
  }

  /**
   * Map notification category/type to database-compatible type
   * Database expects: 'new_content', 'reminder', 'update', 'marketing'
   */
  private mapNotificationTypeToDatabaseType(
    categoryId?: string,
    dataType?: string
  ): 'new_content' | 'reminder' | 'update' | 'marketing' {
    // Check data.type first (from notification data)
    if (dataType) {
      if (dataType === 'sermon' || dataType === 'article') {
        return 'new_content';
      }
      if (dataType === 'event' || dataType === 'reminder') {
        return 'reminder';
      }
      if (dataType === 'announcement' || dataType === 'update') {
        return 'update';
      }
      if (dataType === 'marketing') {
        return 'marketing';
      }
    }

    // Check categoryId
    if (categoryId === 'content') {
      return 'new_content';
    }
    if (categoryId === 'reminder') {
      return 'reminder';
    }
    if (categoryId === 'update' || categoryId === 'general') {
      return 'update';
    }
    if (categoryId === 'marketing') {
      return 'marketing';
    }

    // Default to 'update' for general notifications
    return 'update';
  }

  private async storeNotificationHistory(
    userId: string,
    notification: PushNotificationData
  ): Promise<any> {
    try {
      const notificationType = this.mapNotificationTypeToDatabaseType(
        notification.categoryId,
        notification.data?.type as string
      );

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notificationType,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sent_at: new Date().toISOString(),
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing notification history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error storing notification history:', error);
      return null;
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { total: 0, unread: 0, byType: {} };
      }

      const total = data?.length || 0;
      const unread = data?.filter(n => !n.is_read).length || 0;
      const byType = data?.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return { total, unread, byType };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, unread: 0, byType: {} };
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(async (response) => {
      // Track notification engagement
      const notificationId = response.notification.request.content.data?.notificationId;
      const userId = response.notification.request.content.data?.userId;
      
      if (notificationId && userId) {
        await notificationAnalyticsService.trackNotificationEngagement(
          notificationId,
          userId,
          'clicked',
          {
            action: response.actionIdentifier,
            userText: response.userText,
            platform: Platform.OS,
          }
        );
      }
      
      // Call the original callback
      callback(response);
    });
  }

  /**
   * Handle notification received while app is in foreground
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(async (notification) => {
      // Track notification opened
      const notificationId = notification.request.content.data?.notificationId;
      const userId = notification.request.content.data?.userId;
      
      if (notificationId && userId) {
        await notificationAnalyticsService.trackNotificationEngagement(
          notificationId,
          userId,
          'opened',
          {
            platform: Platform.OS,
            foreground: true,
          }
        );
      }
      
      // Call the original callback
      callback(notification);
    });
  }

  /**
   * Get current notification permissions
   */
  async getPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync();
  }

  /**
   * Get the current Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types
export type { PushNotificationData, NotificationCategory, NotificationAction, NotificationPreferences, ScheduledNotification };
