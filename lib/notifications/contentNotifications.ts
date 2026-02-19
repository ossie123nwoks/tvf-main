import { pushNotificationService, PushNotificationData } from './push';
import { Sermon, Article } from '@/types/content';
import { supabase } from '@/lib/supabase/client';

export interface ContentNotificationOptions {
  sendToAllUsers?: boolean;
  sendToSubscribers?: boolean;
  sendToCategorySubscribers?: boolean;
  categoryId?: string;
  delay?: number; // Delay in milliseconds before sending
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationTemplate {
  title: string;
  body: string;
  categoryId: string;
  data?: Record<string, any>;
}

class ContentNotificationService {
  /**
   * Send notification for new sermon
   */
  async notifyNewSermon(
    sermon: Sermon,
    options: ContentNotificationOptions = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      const template = this.createSermonNotificationTemplate(sermon);
      const notification = this.buildNotificationFromTemplate(template, sermon.id, 'sermon');

      // Apply delay if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Determine target audience
      const preferences = this.getSermonNotificationPreferences(options);
      
      // Send notifications
      const result = await pushNotificationService.sendNotificationToAllUsers(
        notification,
        preferences
      );

      // Log the notification for analytics
      await this.logContentNotification('sermon', sermon.id, result);

      return result;
    } catch (error) {
      console.error('Error sending sermon notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification for new article
   */
  async notifyNewArticle(
    article: Article,
    options: ContentNotificationOptions = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      const template = this.createArticleNotificationTemplate(article);
      const notification = this.buildNotificationFromTemplate(template, article.id, 'article');

      // Apply delay if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Determine target audience
      const preferences = this.getArticleNotificationPreferences(options);
      
      // Send notifications
      const result = await pushNotificationService.sendNotificationToAllUsers(
        notification,
        preferences
      );

      // Log the notification for analytics
      await this.logContentNotification('article', article.id, result);

      return result;
    } catch (error) {
      console.error('Error sending article notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification for featured content
   */
  async notifyFeaturedContent(
    content: Sermon | Article,
    options: ContentNotificationOptions = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      const isSermon = 'audio_url' in content;
      const template = this.createFeaturedContentNotificationTemplate(content, isSermon);
      const notification = this.buildNotificationFromTemplate(
        template,
        content.id,
        isSermon ? 'sermon' : 'article'
      );

      // Apply delay if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // For featured content, send to all users with content notifications enabled
      const preferences = { newContent: true };
      
      const result = await pushNotificationService.sendNotificationToAllUsers(
        notification,
        preferences
      );

      // Log the notification for analytics
      await this.logContentNotification(
        isSermon ? 'sermon' : 'article',
        content.id,
        result
      );

      return result;
    } catch (error) {
      console.error('Error sending featured content notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification for series update
   */
  async notifySeriesUpdate(
    seriesId: string,
    seriesName: string,
    newSermonCount: number,
    options: ContentNotificationOptions = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      const template: NotificationTemplate = {
        title: `New ${newSermonCount > 1 ? 'Sermons' : 'Sermon'} in ${seriesName}`,
        body: `Check out the latest ${newSermonCount > 1 ? 'sermons' : 'sermon'} from the ${seriesName} series.`,
        categoryId: 'content',
        data: {
          type: 'series_update',
          seriesId,
          seriesName,
          newSermonCount,
        },
      };

      const notification = this.buildNotificationFromTemplate(template, seriesId, 'series');

      // Apply delay if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Send to users interested in content notifications
      const preferences = { newContent: true };
      
      const result = await pushNotificationService.sendNotificationToAllUsers(
        notification,
        preferences
      );

      // Log the notification for analytics
      await this.logContentNotification('series', seriesId, result);

      return result;
    } catch (error) {
      console.error('Error sending series update notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send notification for church announcement
   */
  async notifyChurchAnnouncement(
    title: string,
    message: string,
    options: ContentNotificationOptions = {}
  ): Promise<{ sent: number; failed: number }> {
    try {
      const template: NotificationTemplate = {
        title: `Church Announcement: ${title}`,
        body: message,
        categoryId: 'update',
        data: {
          type: 'announcement',
          title,
          message,
        },
      };

      const notification = this.buildNotificationFromTemplate(template, 'announcement', 'announcement');

      // Apply delay if specified
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Send to all users with update notifications enabled
      const preferences = { updates: true };
      
      const result = await pushNotificationService.sendNotificationToAllUsers(
        notification,
        preferences
      );

      // Log the notification for analytics
      await this.logContentNotification('announcement', 'announcement', result);

      return result;
    } catch (error) {
      console.error('Error sending church announcement notification:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Create notification template for new sermon
   */
  private createSermonNotificationTemplate(sermon: Sermon): NotificationTemplate {
    const seriesText = sermon.series_name ? ` from "${sermon.series_name}"` : '';
    const preacherText = sermon.preacher ? ` by ${sermon.preacher}` : '';

    return {
      title: `New Sermon: ${sermon.title}`,
      body: `Listen to the latest sermon${seriesText}${preacherText}. ${this.truncateText(sermon.description, 100)}`,
      categoryId: 'content',
      data: {
        type: 'new_sermon',
        sermonId: sermon.id,
        seriesId: sermon.series_id,
        categoryId: sermon.category_id,
        preacher: sermon.preacher,
      },
    };
  }

  /**
   * Create notification template for new article
   */
  private createArticleNotificationTemplate(article: Article): NotificationTemplate {
    const authorText = article.author ? ` by ${article.author}` : '';
    const excerpt = article.excerpt || this.truncateText(article.content, 100);

    return {
      title: `New Article: ${article.title}`,
      body: `${excerpt}${authorText}`,
      categoryId: 'content',
      data: {
        type: 'new_article',
        articleId: article.id,
        categoryId: article.category_id,
        author: article.author,
      },
    };
  }

  /**
   * Create notification template for featured content
   */
  private createFeaturedContentNotificationTemplate(
    content: Sermon | Article,
    isSermon: boolean
  ): NotificationTemplate {
    const contentType = isSermon ? 'Sermon' : 'Article';
    const actionText = isSermon ? 'Listen' : 'Read';
    const description = isSermon 
      ? (content as Sermon).description 
      : (content as Article).excerpt || (content as Article).content;

    return {
      title: `Featured ${contentType}: ${content.title}`,
      body: `${actionText} this featured ${contentType.toLowerCase()}. ${this.truncateText(description, 100)}`,
      categoryId: 'content',
      data: {
        type: 'featured_content',
        contentType: isSermon ? 'sermon' : 'article',
        contentId: content.id,
        categoryId: content.category_id,
      },
    };
  }

  /**
   * Build notification from template
   */
  private buildNotificationFromTemplate(
    template: NotificationTemplate,
    contentId: string,
    contentType: string
  ): PushNotificationData {
    return {
      title: template.title,
      body: template.body,
      categoryId: template.categoryId,
      data: {
        ...template.data,
        contentId,
        contentType,
        deepLink: `tvf-app://${contentType}/${contentId}`,
        timestamp: new Date().toISOString(),
      },
      sound: true,
      badge: 1,
    };
  }

  /**
   * Get notification preferences for sermon notifications
   */
  private getSermonNotificationPreferences(options: ContentNotificationOptions) {
    const preferences: any = {};

    if (options.sendToAllUsers) {
      preferences.newContent = true;
    } else {
      // Default: send to users with new content notifications enabled
      preferences.newContent = true;
    }

    return preferences;
  }

  /**
   * Get notification preferences for article notifications
   */
  private getArticleNotificationPreferences(options: ContentNotificationOptions) {
    const preferences: any = {};

    if (options.sendToAllUsers) {
      preferences.newContent = true;
    } else {
      // Default: send to users with new content notifications enabled
      preferences.newContent = true;
    }

    return preferences;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Log content notification for analytics
   */
  private async logContentNotification(
    contentType: string,
    contentId: string,
    result: { sent: number; failed: number }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          type: 'content_notification',
          content_type: contentType,
          content_id: contentId,
          sent_count: result.sent,
          failed_count: result.failed,
          sent_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging content notification:', error);
      }
    } catch (error) {
      console.error('Error logging content notification:', error);
    }
  }

  /**
   * Get notification statistics for content
   */
  async getContentNotificationStats(
    contentType?: string,
    contentId?: string
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    byContentType: Record<string, number>;
    recentNotifications: any[];
  }> {
    try {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .eq('type', 'content_notification');

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      const { data, error } = await query.order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching notification stats:', error);
        return {
          totalSent: 0,
          totalFailed: 0,
          byContentType: {},
          recentNotifications: [],
        };
      }

      const totalSent = data?.reduce((sum, log) => sum + log.sent_count, 0) || 0;
      const totalFailed = data?.reduce((sum, log) => sum + log.failed_count, 0) || 0;

      const byContentType = data?.reduce((acc, log) => {
        acc[log.content_type] = (acc[log.content_type] || 0) + log.sent_count;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalSent,
        totalFailed,
        byContentType,
        recentNotifications: data?.slice(0, 10) || [],
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        byContentType: {},
        recentNotifications: [],
      };
    }
  }
}

// Export singleton instance
export const contentNotificationService = new ContentNotificationService();

// Export types
export type { ContentNotificationOptions, NotificationTemplate };
