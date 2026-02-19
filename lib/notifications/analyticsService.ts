import { supabase } from '@/lib/supabase/client';
import { pushNotificationService } from './push';
import { contentNotificationService } from './contentNotifications';
import { reminderService } from './reminderService';

export interface NotificationAnalytics {
  id: string;
  type: 'push' | 'content' | 'reminder' | 'announcement';
  title: string;
  body: string;
  sentAt: Date;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  dismissedCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  engagementRate: number;
  metadata?: Record<string, any>;
}

export interface NotificationEngagement {
  id: string;
  notificationId: string;
  userId: string;
  action: 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  targetAudience: string;
  notificationType: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalDismissed: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  engagementRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPerformanceMetrics {
  totalNotifications: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalDismissed: number;
  totalFailed: number;
  averageDeliveryRate: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageEngagementRate: number;
  byType: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    dismissed: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    engagementRate: number;
  }>;
  byTimeframe: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    dismissed: number;
    failed: number;
  }>;
  topPerformingNotifications: Array<{
    id: string;
    title: string;
    type: string;
    sentCount: number;
    openRate: number;
    clickRate: number;
    engagementRate: number;
  }>;
}

export interface NotificationDeliveryStatus {
  notificationId: string;
  userId: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class NotificationAnalyticsService {
  /**
   * Track notification delivery
   */
  async trackNotificationDelivery(
    notificationId: string,
    userId: string,
    status: NotificationDeliveryStatus['status'],
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_delivery_status')
        .insert({
          notification_id: notificationId,
          user_id: userId,
          status,
          timestamp: new Date().toISOString(),
          error_message: errorMessage,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });

      if (error) {
        // Handle RLS policy errors gracefully - table might not have proper policies set up
        if (error.code === '42501' || error.code === '42P01') {
          // 42501 = insufficient_privilege (RLS policy violation)
          // 42P01 = undefined_table (table doesn't exist)
          // Silently skip - tracking is optional
          return;
        } else {
          // Only log non-RLS errors
          console.error('Error tracking notification delivery:', error);
        }
      }
    } catch (error: any) {
      // Silently fail - tracking is not critical for app functionality
      // Only log if it's not a table/policy error
      if (error?.code !== '42501' && error?.code !== '42P01') {
        console.warn('Notification delivery tracking failed (non-critical):', error);
      }
    }
  }

  /**
   * Track notification engagement
   */
  async trackNotificationEngagement(
    notificationId: string,
    userId: string,
    action: NotificationEngagement['action'],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_engagement')
        .insert({
          notification_id: notificationId,
          user_id: userId,
          action,
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking notification engagement:', error);
      }
    } catch (error) {
      console.error('Error tracking notification engagement:', error);
    }
  }

  /**
   * Create a notification campaign
   */
  async createNotificationCampaign(
    name: string,
    description: string,
    targetAudience: string,
    notificationType: string,
    startDate: Date,
    endDate?: Date
  ): Promise<NotificationCampaign> {
    try {
      const { data, error } = await supabase
        .from('notification_campaigns')
        .insert({
          name,
          description,
          target_audience: targetAudience,
          notification_type: notificationType,
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create notification campaign: ${error.message}`);
      }

      return this.mapDatabaseCampaignToCampaign(data);
    } catch (error) {
      console.error('Error creating notification campaign:', error);
      throw error;
    }
  }

  /**
   * Get notification campaign by ID
   */
  async getNotificationCampaign(campaignId: string): Promise<NotificationCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('notification_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch notification campaign: ${error.message}`);
      }

      return this.mapDatabaseCampaignToCampaign(data);
    } catch (error) {
      console.error('Error fetching notification campaign:', error);
      throw error;
    }
  }

  /**
   * Get all notification campaigns
   */
  async getAllNotificationCampaigns(): Promise<NotificationCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notification campaigns: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseCampaignToCampaign);
    } catch (error) {
      console.error('Error fetching notification campaigns:', error);
      throw error;
    }
  }

  /**
   * Update notification campaign
   */
  async updateNotificationCampaign(
    campaignId: string,
    updates: Partial<NotificationCampaign>
  ): Promise<NotificationCampaign> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetAudience) updateData.target_audience = updates.targetAudience;
      if (updates.notificationType) updateData.notification_type = updates.notificationType;
      if (updates.startDate) updateData.start_date = updates.startDate.toISOString();
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate?.toISOString();
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('notification_campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification campaign: ${error.message}`);
      }

      return this.mapDatabaseCampaignToCampaign(data);
    } catch (error) {
      console.error('Error updating notification campaign:', error);
      throw error;
    }
  }

  /**
   * Get notification analytics for a specific notification
   */
  async getNotificationAnalytics(notificationId: string): Promise<NotificationAnalytics | null> {
    try {
      // Get notification details
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (notificationError || !notification) {
        return null;
      }

      // Get delivery status counts
      const { data: deliveryStatus, error: deliveryError } = await supabase
        .from('notification_delivery_status')
        .select('status')
        .eq('notification_id', notificationId);

      if (deliveryError) {
        console.error('Error fetching delivery status:', deliveryError);
        return null;
      }

      // Get engagement counts
      const { data: engagement, error: engagementError } = await supabase
        .from('notification_engagement')
        .select('action')
        .eq('notification_id', notificationId);

      if (engagementError) {
        console.error('Error fetching engagement:', engagementError);
        return null;
      }

      // Calculate metrics
      const sentCount = deliveryStatus?.length || 0;
      const deliveredCount = deliveryStatus?.filter(d => d.status === 'delivered').length || 0;
      const openedCount = engagement?.filter(e => e.action === 'opened').length || 0;
      const clickedCount = engagement?.filter(e => e.action === 'clicked').length || 0;
      const dismissedCount = engagement?.filter(e => e.action === 'dismissed').length || 0;
      const failedCount = deliveryStatus?.filter(d => d.status === 'failed').length || 0;

      const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0;
      const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
      const clickRate = deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0;
      const engagementRate = deliveredCount > 0 ? ((openedCount + clickedCount) / deliveredCount) * 100 : 0;

      return {
        id: notification.id,
        type: notification.type as any,
        title: notification.title,
        body: notification.body,
        sentAt: new Date(notification.sent_at),
        sentCount,
        deliveredCount,
        openedCount,
        clickedCount,
        dismissedCount,
        failedCount,
        deliveryRate,
        openRate,
        clickRate,
        engagementRate,
        metadata: notification.data,
      };
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      return null;
    }
  }

  /**
   * Get notification performance metrics
   */
  async getNotificationPerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<NotificationPerformanceMetrics> {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          sent_at,
          notification_delivery_status(status),
          notification_engagement(action)
        `);

      if (startDate) {
        query = query.gte('sent_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sent_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification performance metrics: ${error.message}`);
      }

      // Process the data to calculate metrics
      const metrics = this.calculatePerformanceMetrics(data || []);

      return metrics;
    } catch (error) {
      console.error('Error fetching notification performance metrics:', error);
      return {
        totalNotifications: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDismissed: 0,
        totalFailed: 0,
        averageDeliveryRate: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        averageEngagementRate: 0,
        byType: {},
        byTimeframe: [],
        topPerformingNotifications: [],
      };
    }
  }

  /**
   * Get notification delivery status for a specific notification
   */
  async getNotificationDeliveryStatus(notificationId: string): Promise<NotificationDeliveryStatus[]> {
    try {
      const { data, error } = await supabase
        .from('notification_delivery_status')
        .select('*')
        .eq('notification_id', notificationId)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notification delivery status: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseDeliveryStatusToDeliveryStatus);
    } catch (error) {
      console.error('Error fetching notification delivery status:', error);
      return [];
    }
  }

  /**
   * Get notification engagement for a specific notification
   */
  async getNotificationEngagement(notificationId: string): Promise<NotificationEngagement[]> {
    try {
      const { data, error } = await supabase
        .from('notification_engagement')
        .select('*')
        .eq('notification_id', notificationId)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notification engagement: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseEngagementToEngagement);
    } catch (error) {
      console.error('Error fetching notification engagement:', error);
      return [];
    }
  }

  /**
   * Get user notification engagement history
   */
  async getUserNotificationEngagement(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<NotificationEngagement[]> {
    try {
      const { data, error } = await supabase
        .from('notification_engagement')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch user notification engagement: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseEngagementToEngagement);
    } catch (error) {
      console.error('Error fetching user notification engagement:', error);
      return [];
    }
  }

  /**
   * Calculate performance metrics from raw data
   */
  private calculatePerformanceMetrics(data: any[]): NotificationPerformanceMetrics {
    const totalNotifications = data.length;
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalDismissed = 0;
    let totalFailed = 0;

    const byType: Record<string, any> = {};
    const byTimeframe: Array<any> = [];
    const topPerformingNotifications: Array<any> = [];

    // Process each notification
    data.forEach(notification => {
      const deliveryStatus = notification.notification_delivery_status || [];
      const engagement = notification.notification_engagement || [];

      const sent = deliveryStatus.length;
      const delivered = deliveryStatus.filter((d: any) => d.status === 'delivered').length;
      const opened = engagement.filter((e: any) => e.action === 'opened').length;
      const clicked = engagement.filter((e: any) => e.action === 'clicked').length;
      const dismissed = engagement.filter((e: any) => e.action === 'dismissed').length;
      const failed = deliveryStatus.filter((d: any) => d.status === 'failed').length;

      totalSent += sent;
      totalDelivered += delivered;
      totalOpened += opened;
      totalClicked += clicked;
      totalDismissed += dismissed;
      totalFailed += failed;

      // By type
      if (!byType[notification.type]) {
        byType[notification.type] = {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          dismissed: 0,
          failed: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          engagementRate: 0,
        };
      }

      byType[notification.type].sent += sent;
      byType[notification.type].delivered += delivered;
      byType[notification.type].opened += opened;
      byType[notification.type].clicked += clicked;
      byType[notification.type].dismissed += dismissed;
      byType[notification.type].failed += failed;

      // Top performing notifications
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
      const engagementRate = delivered > 0 ? ((opened + clicked) / delivered) * 100 : 0;

      topPerformingNotifications.push({
        id: notification.id,
        title: notification.title,
        type: notification.type,
        sentCount: sent,
        openRate,
        clickRate,
        engagementRate,
      });
    });

    // Calculate rates for byType
    Object.keys(byType).forEach(type => {
      const typeData = byType[type];
      typeData.deliveryRate = typeData.sent > 0 ? (typeData.delivered / typeData.sent) * 100 : 0;
      typeData.openRate = typeData.delivered > 0 ? (typeData.opened / typeData.delivered) * 100 : 0;
      typeData.clickRate = typeData.delivered > 0 ? (typeData.clicked / typeData.delivered) * 100 : 0;
      typeData.engagementRate = typeData.delivered > 0 ? ((typeData.opened + typeData.clicked) / typeData.delivered) * 100 : 0;
    });

    // Sort top performing notifications
    topPerformingNotifications.sort((a, b) => b.engagementRate - a.engagementRate);

    // Calculate averages
    const averageDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const averageOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const averageClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    const averageEngagementRate = totalDelivered > 0 ? ((totalOpened + totalClicked) / totalDelivered) * 100 : 0;

    return {
      totalNotifications,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalDismissed,
      totalFailed,
      averageDeliveryRate,
      averageOpenRate,
      averageClickRate,
      averageEngagementRate,
      byType,
      byTimeframe,
      topPerformingNotifications: topPerformingNotifications.slice(0, 10),
    };
  }

  /**
   * Map database campaign to Campaign interface
   */
  private mapDatabaseCampaignToCampaign(data: any): NotificationCampaign {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      targetAudience: data.target_audience,
      notificationType: data.notification_type,
      totalSent: data.total_sent || 0,
      totalDelivered: data.total_delivered || 0,
      totalOpened: data.total_opened || 0,
      totalClicked: data.total_clicked || 0,
      totalDismissed: data.total_dismissed || 0,
      totalFailed: data.total_failed || 0,
      deliveryRate: data.delivery_rate || 0,
      openRate: data.open_rate || 0,
      clickRate: data.click_rate || 0,
      engagementRate: data.engagement_rate || 0,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map database delivery status to DeliveryStatus interface
   */
  private mapDatabaseDeliveryStatusToDeliveryStatus(data: any): NotificationDeliveryStatus {
    return {
      notificationId: data.notification_id,
      userId: data.user_id,
      status: data.status,
      timestamp: new Date(data.timestamp),
      errorMessage: data.error_message,
      metadata: data.metadata,
    };
  }

  /**
   * Map database engagement to Engagement interface
   */
  private mapDatabaseEngagementToEngagement(data: any): NotificationEngagement {
    return {
      id: data.id,
      notificationId: data.notification_id,
      userId: data.user_id,
      action: data.action,
      timestamp: new Date(data.timestamp),
      metadata: data.metadata,
    };
  }
}

// Export singleton instance
export const notificationAnalyticsService = new NotificationAnalyticsService();

// Types are exported inline above
