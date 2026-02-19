import { useCallback } from 'react';
import { contentNotificationService, ContentNotificationOptions } from '@/lib/notifications/contentNotifications';
import { Sermon, Article } from '@/types/content';

export interface UseContentNotificationsReturn {
  notifyNewSermon: (sermon: Sermon, options?: ContentNotificationOptions) => Promise<{ sent: number; failed: number }>;
  notifyNewArticle: (article: Article, options?: ContentNotificationOptions) => Promise<{ sent: number; failed: number }>;
  notifyFeaturedContent: (content: Sermon | Article, options?: ContentNotificationOptions) => Promise<{ sent: number; failed: number }>;
  notifySeriesUpdate: (seriesId: string, seriesName: string, newSermonCount: number, options?: ContentNotificationOptions) => Promise<{ sent: number; failed: number }>;
  notifyChurchAnnouncement: (title: string, message: string, options?: ContentNotificationOptions) => Promise<{ sent: number; failed: number }>;
  getNotificationStats: (contentType?: string, contentId?: string) => Promise<{
    totalSent: number;
    totalFailed: number;
    byContentType: Record<string, number>;
    recentNotifications: any[];
  }>;
}

export const useContentNotifications = (): UseContentNotificationsReturn => {
  const notifyNewSermon = useCallback(async (
    sermon: Sermon,
    options?: ContentNotificationOptions
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await contentNotificationService.notifyNewSermon(sermon, options);
    } catch (error) {
      console.error('Error sending new sermon notification:', error);
      return { sent: 0, failed: 0 };
    }
  }, []);

  const notifyNewArticle = useCallback(async (
    article: Article,
    options?: ContentNotificationOptions
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await contentNotificationService.notifyNewArticle(article, options);
    } catch (error) {
      console.error('Error sending new article notification:', error);
      return { sent: 0, failed: 0 };
    }
  }, []);

  const notifyFeaturedContent = useCallback(async (
    content: Sermon | Article,
    options?: ContentNotificationOptions
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await contentNotificationService.notifyFeaturedContent(content, options);
    } catch (error) {
      console.error('Error sending featured content notification:', error);
      return { sent: 0, failed: 0 };
    }
  }, []);

  const notifySeriesUpdate = useCallback(async (
    seriesId: string,
    seriesName: string,
    newSermonCount: number,
    options?: ContentNotificationOptions
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await contentNotificationService.notifySeriesUpdate(seriesId, seriesName, newSermonCount, options);
    } catch (error) {
      console.error('Error sending series update notification:', error);
      return { sent: 0, failed: 0 };
    }
  }, []);

  const notifyChurchAnnouncement = useCallback(async (
    title: string,
    message: string,
    options?: ContentNotificationOptions
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await contentNotificationService.notifyChurchAnnouncement(title, message, options);
    } catch (error) {
      console.error('Error sending church announcement notification:', error);
      return { sent: 0, failed: 0 };
    }
  }, []);

  const getNotificationStats = useCallback(async (
    contentType?: string,
    contentId?: string
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    byContentType: Record<string, number>;
    recentNotifications: any[];
  }> => {
    try {
      return await contentNotificationService.getContentNotificationStats(contentType, contentId);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        byContentType: {},
        recentNotifications: [],
      };
    }
  }, []);

  return {
    notifyNewSermon,
    notifyNewArticle,
    notifyFeaturedContent,
    notifySeriesUpdate,
    notifyChurchAnnouncement,
    getNotificationStats,
  };
};
