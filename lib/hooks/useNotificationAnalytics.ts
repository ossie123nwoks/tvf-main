import { useState, useEffect, useCallback } from 'react';
import {
  notificationAnalyticsService,
  NotificationAnalytics,
  NotificationEngagement,
  NotificationCampaign,
  NotificationPerformanceMetrics,
  NotificationDeliveryStatus,
} from '@/lib/notifications/analyticsService';

export interface UseNotificationAnalyticsState {
  analytics: NotificationAnalytics | null;
  engagement: NotificationEngagement[];
  deliveryStatus: NotificationDeliveryStatus[];
  campaigns: NotificationCampaign[];
  performanceMetrics: NotificationPerformanceMetrics | null;
  loading: boolean;
  error: string | null;
}

export interface UseNotificationAnalyticsActions {
  getNotificationAnalytics: (notificationId: string) => Promise<void>;
  getNotificationEngagement: (notificationId: string) => Promise<void>;
  getNotificationDeliveryStatus: (notificationId: string) => Promise<void>;
  getUserEngagementHistory: (userId: string, limit?: number, offset?: number) => Promise<void>;
  getAllCampaigns: () => Promise<void>;
  getPerformanceMetrics: (startDate?: Date, endDate?: Date) => Promise<void>;
  createCampaign: (
    name: string,
    description: string,
    targetAudience: string,
    notificationType: string,
    startDate: Date,
    endDate?: Date
  ) => Promise<NotificationCampaign | null>;
  updateCampaign: (campaignId: string, updates: Partial<NotificationCampaign>) => Promise<void>;
  trackEngagement: (
    notificationId: string,
    userId: string,
    action: NotificationEngagement['action'],
    metadata?: Record<string, any>
  ) => Promise<void>;
  trackDelivery: (
    notificationId: string,
    userId: string,
    status: NotificationDeliveryStatus['status'],
    metadata?: Record<string, any>,
    errorMessage?: string
  ) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useNotificationAnalytics(): UseNotificationAnalyticsState & UseNotificationAnalyticsActions {
  const [state, setState] = useState<UseNotificationAnalyticsState>({
    analytics: null,
    engagement: [],
    deliveryStatus: [],
    campaigns: [],
    performanceMetrics: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const getNotificationAnalytics = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const analytics = await notificationAnalyticsService.getNotificationAnalytics(notificationId);
      setState(prev => ({ ...prev, analytics }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification analytics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getNotificationEngagement = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const engagement = await notificationAnalyticsService.getNotificationEngagement(notificationId);
      setState(prev => ({ ...prev, engagement }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification engagement');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getNotificationDeliveryStatus = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const deliveryStatus = await notificationAnalyticsService.getNotificationDeliveryStatus(notificationId);
      setState(prev => ({ ...prev, deliveryStatus }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification delivery status');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getUserEngagementHistory = useCallback(async (
    userId: string,
    limit = 50,
    offset = 0
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const engagement = await notificationAnalyticsService.getUserNotificationEngagement(
        userId,
        limit,
        offset
      );
      setState(prev => ({ ...prev, engagement }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user engagement history');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getAllCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const campaigns = await notificationAnalyticsService.getAllNotificationCampaigns();
      setState(prev => ({ ...prev, campaigns }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification campaigns');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getPerformanceMetrics = useCallback(async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const performanceMetrics = await notificationAnalyticsService.getNotificationPerformanceMetrics(
        startDate,
        endDate
      );
      setState(prev => ({ ...prev, performanceMetrics }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const createCampaign = useCallback(async (
    name: string,
    description: string,
    targetAudience: string,
    notificationType: string,
    startDate: Date,
    endDate?: Date
  ): Promise<NotificationCampaign | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const campaign = await notificationAnalyticsService.createNotificationCampaign(
        name,
        description,
        targetAudience,
        notificationType,
        startDate,
        endDate
      );
      
      // Refresh campaigns list
      await getAllCampaigns();
      
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification campaign');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getAllCampaigns]);

  const updateCampaign = useCallback(async (
    campaignId: string,
    updates: Partial<NotificationCampaign>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationAnalyticsService.updateNotificationCampaign(campaignId, updates);
      
      // Refresh campaigns list
      await getAllCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification campaign');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getAllCampaigns]);

  const trackEngagement = useCallback(async (
    notificationId: string,
    userId: string,
    action: NotificationEngagement['action'],
    metadata?: Record<string, any>
  ) => {
    try {
      await notificationAnalyticsService.trackNotificationEngagement(
        notificationId,
        userId,
        action,
        metadata
      );
    } catch (err) {
      console.error('Failed to track notification engagement:', err);
    }
  }, []);

  const trackDelivery = useCallback(async (
    notificationId: string,
    userId: string,
    status: NotificationDeliveryStatus['status'],
    metadata?: Record<string, any>,
    errorMessage?: string
  ) => {
    try {
      await notificationAnalyticsService.trackNotificationDelivery(
        notificationId,
        userId,
        status,
        metadata,
        errorMessage
      );
    } catch (err) {
      console.error('Failed to track notification delivery:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Refresh all data
    if (state.analytics) {
      await getNotificationAnalytics(state.analytics.id);
    }
    if (state.engagement.length > 0) {
      const firstEngagement = state.engagement[0];
      if (firstEngagement) {
        await getNotificationEngagement(firstEngagement.notificationId);
      }
    }
    await getAllCampaigns();
    await getPerformanceMetrics();
  }, [
    state.analytics,
    state.engagement,
    getNotificationAnalytics,
    getNotificationEngagement,
    getAllCampaigns,
    getPerformanceMetrics,
  ]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    ...state,
    getNotificationAnalytics,
    getNotificationEngagement,
    getNotificationDeliveryStatus,
    getUserEngagementHistory,
    getAllCampaigns,
    getPerformanceMetrics,
    createCampaign,
    updateCampaign,
    trackEngagement,
    trackDelivery,
    refresh,
    clearError,
  };
}

// Hook for tracking notification engagement in components
export function useNotificationEngagementTracking() {
  const trackEngagement = useCallback(async (
    notificationId: string,
    userId: string,
    action: NotificationEngagement['action'],
    metadata?: Record<string, any>
  ) => {
    try {
      await notificationAnalyticsService.trackNotificationEngagement(
        notificationId,
        userId,
        action,
        metadata
      );
    } catch (err) {
      console.error('Failed to track notification engagement:', err);
    }
  }, []);

  const trackDelivery = useCallback(async (
    notificationId: string,
    userId: string,
    status: NotificationDeliveryStatus['status'],
    metadata?: Record<string, any>,
    errorMessage?: string
  ) => {
    try {
      await notificationAnalyticsService.trackNotificationDelivery(
        notificationId,
        userId,
        status,
        metadata,
        errorMessage
      );
    } catch (err) {
      console.error('Failed to track notification delivery:', err);
    }
  }, []);

  return {
    trackEngagement,
    trackDelivery,
  };
}
