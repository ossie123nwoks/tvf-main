import { pushNotificationService, PushNotificationData } from './push';
import { supabase } from '@/lib/supabase/client';
import { Sermon, Article } from '@/types/content';

export interface Reminder {
  id: string;
  userId: string;
  contentType: 'sermon' | 'article';
  contentId: string;
  reminderTime: Date;
  message?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderRequest {
  contentType: 'sermon' | 'article';
  contentId: string;
  reminderTime: Date;
  message?: string;
}

export interface ReminderStats {
  totalReminders: number;
  activeReminders: number;
  upcomingReminders: number;
  completedReminders: number;
}

class ReminderService {
  /**
   * Create a new reminder for a user
   */
  async createReminder(
    userId: string,
    request: CreateReminderRequest
  ): Promise<Reminder> {
    try {
      // Validate that the content exists
      const contentExists = await this.validateContentExists(request.contentType, request.contentId);
      if (!contentExists) {
        throw new Error(`${request.contentType} not found`);
      }

      // Check if user already has a reminder for this content
      const existingReminder = await this.getReminderByContent(userId, request.contentType, request.contentId);
      if (existingReminder) {
        throw new Error('Reminder already exists for this content');
      }

      // Create the reminder in database
      const { data, error } = await supabase
        .from('user_reminders')
        .insert({
          user_id: userId,
          content_type: request.contentType,
          content_id: request.contentId,
          reminder_time: request.reminderTime.toISOString(),
          message: request.message,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create reminder: ${error.message}`);
      }

      // Schedule the notification
      await this.scheduleReminderNotification(data);

      return this.mapDatabaseReminderToReminder(data);
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string, includeInactive = false): Promise<Reminder[]> {
    try {
      let query = supabase
        .from('user_reminders')
        .select('*')
        .eq('user_id', userId)
        .order('reminder_time', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch reminders: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseReminderToReminder);
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw error;
    }
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminderById(reminderId: string): Promise<Reminder | null> {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch reminder: ${error.message}`);
      }

      return this.mapDatabaseReminderToReminder(data);
    } catch (error) {
      console.error('Error fetching reminder:', error);
      throw error;
    }
  }

  /**
   * Get reminder by content
   */
  async getReminderByContent(
    userId: string,
    contentType: 'sermon' | 'article',
    contentId: string
  ): Promise<Reminder | null> {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch reminder: ${error.message}`);
      }

      return this.mapDatabaseReminderToReminder(data);
    } catch (error) {
      console.error('Error fetching reminder by content:', error);
      throw error;
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(
    reminderId: string,
    updates: Partial<CreateReminderRequest>
  ): Promise<Reminder> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.reminderTime) {
        updateData.reminder_time = updates.reminderTime.toISOString();
      }
      if (updates.message !== undefined) {
        updateData.message = updates.message;
      }

      const { data, error } = await supabase
        .from('user_reminders')
        .update(updateData)
        .eq('id', reminderId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update reminder: ${error.message}`);
      }

      // Reschedule notification if reminder time changed
      if (updates.reminderTime) {
        await this.scheduleReminderNotification(data);
      }

      return this.mapDatabaseReminderToReminder(data);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel/deactivate a reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_reminders')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) {
        throw new Error(`Failed to cancel reminder: ${error.message}`);
      }

      // Cancel the scheduled notification
      await pushNotificationService.cancelNotification(reminderId);
    } catch (error) {
      console.error('Error canceling reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder permanently
   */
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      // First cancel the notification
      await pushNotificationService.cancelNotification(reminderId);

      // Then delete from database
      const { error } = await supabase
        .from('user_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) {
        throw new Error(`Failed to delete reminder: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * Get upcoming reminders for a user
   */
  async getUpcomingReminders(userId: string, limit = 10): Promise<Reminder[]> {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('reminder_time', new Date().toISOString())
        .order('reminder_time', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch upcoming reminders: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseReminderToReminder);
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      throw error;
    }
  }

  /**
   * Get reminder statistics for a user
   */
  async getReminderStats(userId: string): Promise<ReminderStats> {
    try {
      const { data, error } = await supabase
        .from('user_reminders')
        .select('is_active, reminder_time')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch reminder stats: ${error.message}`);
      }

      const now = new Date();
      const totalReminders = data?.length || 0;
      const activeReminders = data?.filter(r => r.is_active).length || 0;
      const upcomingReminders = data?.filter(r => 
        r.is_active && new Date(r.reminder_time) > now
      ).length || 0;
      const completedReminders = data?.filter(r => 
        !r.is_active || new Date(r.reminder_time) <= now
      ).length || 0;

      return {
        totalReminders,
        activeReminders,
        upcomingReminders,
        completedReminders,
      };
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
      throw error;
    }
  }

  /**
   * Process due reminders (called by a background job)
   */
  async processDueReminders(): Promise<{ processed: number; errors: number }> {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('user_reminders')
        .select('*')
        .eq('is_active', true)
        .lte('reminder_time', now.toISOString())
        .order('reminder_time', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch due reminders: ${error.message}`);
      }

      let processed = 0;
      let errors = 0;

      for (const reminder of data || []) {
        try {
          await this.sendReminderNotification(reminder);
          await this.cancelReminder(reminder.id);
          processed++;
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error processing due reminders:', error);
      throw error;
    }
  }

  /**
   * Schedule a reminder notification
   */
  private async scheduleReminderNotification(reminder: any): Promise<void> {
    try {
      const content = await this.getContentDetails(reminder.content_type, reminder.content_id);
      if (!content) {
        throw new Error('Content not found');
      }

      const notification: PushNotificationData = {
        title: `Reminder: ${content.title}`,
        body: reminder.message || `Don't forget to check out this ${reminder.content_type}.`,
        categoryId: 'reminder',
        data: {
          type: 'reminder',
          reminderId: reminder.id,
          contentType: reminder.content_type,
          contentId: reminder.content_id,
          deepLink: `tvf-app://${reminder.content_type}/${reminder.content_id}`,
        },
        sound: true,
        badge: 1,
      };

      const reminderTime = new Date(reminder.reminder_time);
      const notificationId = await pushNotificationService.scheduleNotification(
        notification,
        reminderTime
      );

      if (!notificationId) {
        throw new Error('Failed to schedule notification');
      }

      // Store the notification ID for later cancellation
      await supabase
        .from('user_reminders')
        .update({
          notification_id: notificationId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminder.id);
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
      throw error;
    }
  }

  /**
   * Send reminder notification immediately
   */
  private async sendReminderNotification(reminder: any): Promise<void> {
    try {
      const content = await this.getContentDetails(reminder.content_type, reminder.content_id);
      if (!content) {
        throw new Error('Content not found');
      }

      const notification: PushNotificationData = {
        title: `Reminder: ${content.title}`,
        body: reminder.message || `Don't forget to check out this ${reminder.content_type}.`,
        categoryId: 'reminder',
        data: {
          type: 'reminder',
          reminderId: reminder.id,
          contentType: reminder.content_type,
          contentId: reminder.content_id,
          deepLink: `tvf-app://${reminder.content_type}/${reminder.content_id}`,
        },
        sound: true,
        badge: 1,
      };

      await pushNotificationService.sendNotificationToUser(reminder.user_id, notification);
    } catch (error) {
      console.error('Error sending reminder notification:', error);
      throw error;
    }
  }

  /**
   * Get content details for notification
   */
  private async getContentDetails(contentType: string, contentId: string): Promise<{ title: string } | null> {
    try {
      if (contentType === 'sermon') {
        const { data, error } = await supabase
          .from('sermons')
          .select('title')
          .eq('id', contentId)
          .single();

        if (error) return null;
        return data;
      } else if (contentType === 'article') {
        const { data, error } = await supabase
          .from('articles')
          .select('title')
          .eq('id', contentId)
          .single();

        if (error) return null;
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching content details:', error);
      return null;
    }
  }

  /**
   * Validate that content exists
   */
  private async validateContentExists(contentType: string, contentId: string): Promise<boolean> {
    try {
      if (contentType === 'sermon') {
        const { data, error } = await supabase
          .from('sermons')
          .select('id')
          .eq('id', contentId)
          .eq('is_published', true)
          .single();

        return !error && !!data;
      } else if (contentType === 'article') {
        const { data, error } = await supabase
          .from('articles')
          .select('id')
          .eq('id', contentId)
          .eq('is_published', true)
          .single();

        return !error && !!data;
      }

      return false;
    } catch (error) {
      console.error('Error validating content exists:', error);
      return false;
    }
  }

  /**
   * Map database reminder to Reminder interface
   */
  private mapDatabaseReminderToReminder(data: any): Reminder {
    return {
      id: data.id,
      userId: data.user_id,
      contentType: data.content_type,
      contentId: data.content_id,
      reminderTime: new Date(data.reminder_time),
      message: data.message,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Export singleton instance
export const reminderService = new ReminderService();

// Export types
export type { Reminder, CreateReminderRequest, ReminderStats };
