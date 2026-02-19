import { supabase } from '@/lib/supabase/client';
import { notificationAnalyticsService } from './analyticsService';

export interface NotificationHistoryItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  sentAt: Date;
  readAt?: Date;
  isRead: boolean;
  categoryId?: string;
  priority?: 'high' | 'normal' | 'low';
  source?: string;
  campaignId?: string;
}

export interface NotificationHistoryFilters {
  type?: string;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: string;
  source?: string;
  campaignId?: string;
}

export interface NotificationHistoryStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  bySource: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface NotificationManagementAction {
  id: string;
  type: 'mark_read' | 'mark_unread' | 'delete' | 'archive' | 'restore';
  notificationIds: string[];
  timestamp: Date;
  userId: string;
}

class NotificationHistoryService {
  /**
   * Get notification history for a user with filters and pagination
   */
  async getNotificationHistory(
    userId: string,
    filters: NotificationHistoryFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationHistoryItem[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('sent_at', filters.dateTo.toISOString());
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.campaignId) {
        query = query.eq('campaign_id', filters.campaignId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification history: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseNotificationToHistoryItem);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  /**
   * Get notification history statistics
   */
  async getNotificationHistoryStats(
    userId: string,
    filters: NotificationHistoryFilters = {}
  ): Promise<NotificationHistoryStats> {
    try {
      let query = supabase
        .from('notifications')
        .select('type, is_read, priority, source, sent_at')
        .eq('user_id', userId);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('sent_at', filters.dateTo.toISOString());
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.campaignId) {
        query = query.eq('campaign_id', filters.campaignId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification history stats: ${error.message}`);
      }

      const total = data?.length || 0;
      const unread = data?.filter(n => !n.is_read).length || 0;

      const byType = data?.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byPriority = data?.reduce((acc, n) => {
        const priority = n.priority || 'normal';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const bySource = data?.reduce((acc, n) => {
        const source = n.source || 'system';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate recent activity (last 7 days)
      const recentActivity = this.calculateRecentActivity(data || []);

      return {
        total,
        unread,
        byType,
        byPriority,
        bySource,
        recentActivity,
      };
    } catch (error) {
      console.error('Error fetching notification history stats:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('mark_read', [notificationId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as unread
   */
  async markNotificationAsUnread(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: false,
          read_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to mark notification as unread: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('mark_unread', [notificationId]);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', notificationIds);

      if (error) {
        throw new Error(`Failed to mark notifications as read: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('mark_read', notificationIds);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as unread
   */
  async markMultipleNotificationsAsUnread(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: false,
          read_at: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', notificationIds);

      if (error) {
        throw new Error(`Failed to mark notifications as unread: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('mark_unread', notificationIds);
    } catch (error) {
      console.error('Error marking notifications as unread:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('delete', [notificationId]);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) {
        throw new Error(`Failed to delete notifications: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('delete', notificationIds);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  /**
   * Archive notification (soft delete)
   */
  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to archive notification: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('archive', [notificationId]);
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  /**
   * Restore archived notification
   */
  async restoreNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_archived: false,
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`Failed to restore notification: ${error.message}`);
      }

      // Log the action
      await this.logManagementAction('restore', [notificationId]);
    } catch (error) {
      console.error('Error restoring notification:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationHistoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch notification: ${error.message}`);
      }

      return this.mapDatabaseNotificationToHistoryItem(data);
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  /**
   * Search notifications
   */
  async searchNotifications(
    userId: string,
    searchTerm: string,
    filters: NotificationHistoryFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationHistoryItem[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,body.ilike.%${searchTerm}%`)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply additional filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }
      if (filters.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('sent_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to search notifications: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseNotificationToHistoryItem);
    } catch (error) {
      console.error('Error searching notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification analytics for a specific notification
   */
  async getNotificationAnalytics(notificationId: string): Promise<any> {
    try {
      return await notificationAnalyticsService.getNotificationAnalytics(notificationId);
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      throw error;
    }
  }

  /**
   * Get notification engagement data
   */
  async getNotificationEngagement(notificationId: string): Promise<any[]> {
    try {
      return await notificationAnalyticsService.getNotificationEngagement(notificationId);
    } catch (error) {
      console.error('Error fetching notification engagement:', error);
      throw error;
    }
  }

  /**
   * Calculate recent activity for the last 7 days
   */
  private calculateRecentActivity(notifications: any[]): Array<{ date: string; count: number }> {
    const now = new Date();
    const activity: Array<{ date: string; count: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = notifications.filter(n => {
        const sentDate = new Date(n.sent_at).toISOString().split('T')[0];
        return sentDate === dateStr;
      }).length;

      activity.push({ date: dateStr, count });
    }

    return activity;
  }

  /**
   * Log management action
   */
  private async logManagementAction(
    actionType: NotificationManagementAction['type'],
    notificationIds: string[]
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_management_actions')
        .insert({
          type: actionType,
          notification_ids: notificationIds,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging management action:', error);
      }
    } catch (error) {
      console.error('Error logging management action:', error);
    }
  }

  /**
   * Map database notification to NotificationHistoryItem
   */
  private mapDatabaseNotificationToHistoryItem(data: any): NotificationHistoryItem {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || {},
      sentAt: new Date(data.sent_at),
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      isRead: data.is_read,
      categoryId: data.category_id,
      priority: data.priority,
      source: data.source,
      campaignId: data.campaign_id,
    };
  }
}

// Export singleton instance
export const notificationHistoryService = new NotificationHistoryService();

// Types are exported inline above
