import { supabase } from '@/lib/supabase/client';
import { NotificationSettings, UserPreferences } from '@/types/user';

export interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'content' | 'reminders' | 'updates' | 'marketing';
  required?: boolean; // Some notifications cannot be disabled
  subPreferences?: NotificationSubPreference[];
}

export interface NotificationSubPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  parentId: string;
}

export interface NotificationPreferenceGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  preferences: NotificationPreference[];
  enabled: boolean;
}

export interface NotificationSchedule {
  id: string;
  name: string;
  description: string;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

export interface NotificationFrequency {
  id: string;
  name: string;
  description: string;
  maxPerDay: number;
  maxPerWeek: number;
  enabled: boolean;
}

class NotificationPreferencesService {
  /**
   * Get notification preferences for a user
   */
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferenceGroup[]> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user preferences: ${error.message}`);
      }

      const preferences = user?.preferences?.notifications || this.getDefaultNotificationSettings();
      return this.buildPreferenceGroups(preferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return this.getDefaultPreferenceGroups();
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      // Get current user preferences
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current preferences: ${fetchError.message}`);
      }

      // Merge with existing preferences
      const currentPreferences = user?.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        notifications: {
          ...currentPreferences.notifications,
          ...preferences,
        },
      };

      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update preferences: ${updateError.message}`);
      }

      // Log the preference change
      await this.logPreferenceChange(userId, preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification schedules for a user
   */
  async getUserNotificationSchedules(userId: string): Promise<NotificationSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('user_notification_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch notification schedules: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseScheduleToSchedule);
    } catch (error) {
      console.error('Error fetching notification schedules:', error);
      return this.getDefaultSchedules();
    }
  }

  /**
   * Create or update notification schedule
   */
  async saveNotificationSchedule(
    userId: string,
    schedule: Omit<NotificationSchedule, 'id'>
  ): Promise<NotificationSchedule> {
    try {
      const { data, error } = await supabase
        .from('user_notification_schedules')
        .upsert({
          user_id: userId,
          name: schedule.name,
          description: schedule.description,
          quiet_hours_start: schedule.quietHoursStart,
          quiet_hours_end: schedule.quietHoursEnd,
          timezone: schedule.timezone,
          enabled: schedule.enabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save notification schedule: ${error.message}`);
      }

      return this.mapDatabaseScheduleToSchedule(data);
    } catch (error) {
      console.error('Error saving notification schedule:', error);
      throw error;
    }
  }

  /**
   * Delete notification schedule
   */
  async deleteNotificationSchedule(userId: string, scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notification_schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete notification schedule: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting notification schedule:', error);
      throw error;
    }
  }

  /**
   * Get notification frequency settings
   */
  async getUserNotificationFrequency(userId: string): Promise<NotificationFrequency> {
    try {
      const { data, error } = await supabase
        .from('user_notification_frequency')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch notification frequency: ${error.message}`);
      }

      if (data) {
        return this.mapDatabaseFrequencyToFrequency(data);
      }

      // Return default frequency if none exists
      return this.getDefaultFrequency();
    } catch (error) {
      console.error('Error fetching notification frequency:', error);
      return this.getDefaultFrequency();
    }
  }

  /**
   * Update notification frequency settings
   */
  async updateNotificationFrequency(
    userId: string,
    frequency: Partial<NotificationFrequency>
  ): Promise<NotificationFrequency> {
    try {
      const { data, error } = await supabase
        .from('user_notification_frequency')
        .upsert({
          user_id: userId,
          max_per_day: frequency.maxPerDay,
          max_per_week: frequency.maxPerWeek,
          enabled: frequency.enabled,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification frequency: ${error.message}`);
      }

      return this.mapDatabaseFrequencyToFrequency(data);
    } catch (error) {
      console.error('Error updating notification frequency:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getUserNotificationStats(userId: string): Promise<{
    totalReceived: number;
    totalRead: number;
    readRate: number;
    byType: Record<string, number>;
    byDay: Record<string, number>;
    lastNotification: Date | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read, sent_at')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notification stats: ${error.message}`);
      }

      const totalReceived = data?.length || 0;
      const totalRead = data?.filter(n => n.is_read).length || 0;
      const readRate = totalReceived > 0 ? (totalRead / totalReceived) * 100 : 0;

      const byType = data?.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byDay = data?.reduce((acc, n) => {
        const day = new Date(n.sent_at).toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const lastNotification = data?.[0]?.sent_at ? new Date(data[0].sent_at) : null;

      return {
        totalReceived,
        totalRead,
        readRate,
        byType,
        byDay,
        lastNotification,
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        totalReceived: 0,
        totalRead: 0,
        readRate: 0,
        byType: {},
        byDay: {},
        lastNotification: null,
      };
    }
  }

  /**
   * Reset notification preferences to defaults
   */
  async resetNotificationPreferences(userId: string): Promise<void> {
    try {
      const defaultPreferences = this.getDefaultNotificationSettings();
      await this.updateUserNotificationPreferences(userId, defaultPreferences);
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Build preference groups from notification settings
   */
  private buildPreferenceGroups(preferences: NotificationSettings): NotificationPreferenceGroup[] {
    return [
      {
        id: 'content',
        title: 'Content Notifications',
        description: 'Get notified about new sermons and articles',
        icon: 'content-copy',
        enabled: preferences.newContent,
        preferences: [
          {
            id: 'new_sermons',
            title: 'New Sermons',
            description: 'Notify me when new sermons are published',
            icon: 'music-note',
            enabled: preferences.newContent,
            category: 'content',
          },
          {
            id: 'new_articles',
            title: 'New Articles',
            description: 'Notify me when new articles are published',
            icon: 'article',
            enabled: preferences.newContent,
            category: 'content',
          },
          {
            id: 'featured_content',
            title: 'Featured Content',
            description: 'Notify me about featured sermons and articles',
            icon: 'star',
            enabled: preferences.newContent,
            category: 'content',
          },
        ],
      },
      {
        id: 'reminders',
        title: 'Reminders & Alerts',
        description: 'Personal reminders and scheduled notifications',
        icon: 'alarm',
        enabled: preferences.reminders,
        preferences: [
          {
            id: 'content_reminders',
            title: 'Content Reminders',
            description: 'Receive reminders for content you want to revisit',
            icon: 'schedule',
            enabled: preferences.reminders,
            category: 'reminders',
          },
          {
            id: 'series_updates',
            title: 'Series Updates',
            description: 'Get notified when new sermons are added to series you follow',
            icon: 'library-music',
            enabled: preferences.reminders,
            category: 'reminders',
          },
        ],
      },
      {
        id: 'updates',
        title: 'App Updates',
        description: 'Important app updates and system notifications',
        icon: 'update',
        enabled: preferences.updates,
        preferences: [
          {
            id: 'app_updates',
            title: 'App Updates',
            description: 'Notify me about app updates and new features',
            icon: 'system-update',
            enabled: preferences.updates,
            category: 'updates',
            required: true, // Cannot be disabled
          },
          {
            id: 'maintenance',
            title: 'Maintenance Notices',
            description: 'Notify me about scheduled maintenance and downtime',
            icon: 'build',
            enabled: preferences.updates,
            category: 'updates',
          },
        ],
      },
      {
        id: 'marketing',
        title: 'News & Updates',
        description: 'Church news, events, and promotional content',
        icon: 'campaign',
        enabled: preferences.marketing,
        preferences: [
          {
            id: 'church_news',
            title: 'Church News',
            description: 'Get updates about church events and announcements',
            icon: 'newspaper',
            enabled: preferences.marketing,
            category: 'marketing',
          },
          {
            id: 'events',
            title: 'Events & Activities',
            description: 'Notify me about upcoming church events and activities',
            icon: 'event',
            enabled: preferences.marketing,
            category: 'marketing',
          },
          {
            id: 'special_offers',
            title: 'Special Offers',
            description: 'Receive notifications about special offers and promotions',
            icon: 'local-offer',
            enabled: preferences.marketing,
            category: 'marketing',
          },
        ],
      },
    ];
  }

  /**
   * Get default notification settings
   */
  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      newContent: true,
      reminders: true,
      updates: true,
      marketing: false,
    };
  }

  /**
   * Get default preference groups
   */
  private getDefaultPreferenceGroups(): NotificationPreferenceGroup[] {
    return this.buildPreferenceGroups(this.getDefaultNotificationSettings());
  }

  /**
   * Get default notification schedules
   */
  private getDefaultSchedules(): NotificationSchedule[] {
    return [
      {
        id: 'default',
        name: 'Default Schedule',
        description: 'Standard notification schedule',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: true,
      },
    ];
  }

  /**
   * Get default notification frequency
   */
  private getDefaultFrequency(): NotificationFrequency {
    return {
      id: 'default',
      name: 'Default Frequency',
      description: 'Standard notification frequency',
      maxPerDay: 10,
      maxPerWeek: 50,
      enabled: true,
    };
  }

  /**
   * Map database schedule to NotificationSchedule
   */
  private mapDatabaseScheduleToSchedule(data: any): NotificationSchedule {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      timezone: data.timezone,
      enabled: data.enabled,
    };
  }

  /**
   * Map database frequency to NotificationFrequency
   */
  private mapDatabaseFrequencyToFrequency(data: any): NotificationFrequency {
    return {
      id: data.id,
      name: data.name || 'Custom Frequency',
      description: data.description || 'Custom notification frequency',
      maxPerDay: data.max_per_day,
      maxPerWeek: data.max_per_week,
      enabled: data.enabled,
    };
  }

  /**
   * Log preference changes for analytics
   */
  private async logPreferenceChange(
    userId: string,
    preferences: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('preference_change_logs')
        .insert({
          user_id: userId,
          preference_type: 'notifications',
          changes: preferences,
          changed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging preference change:', error);
      }
    } catch (error) {
      console.error('Error logging preference change:', error);
    }
  }
}

// Export singleton instance
export const notificationPreferencesService = new NotificationPreferencesService();

// Types are exported inline above
