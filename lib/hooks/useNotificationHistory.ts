import { useState, useEffect, useCallback } from 'react';
import {
  notificationHistoryService,
  NotificationHistoryItem,
  NotificationHistoryFilters,
  NotificationHistoryStats,
} from '@/lib/notifications/historyService';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UseNotificationHistoryState {
  notifications: NotificationHistoryItem[];
  stats: NotificationHistoryStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface UseNotificationHistoryActions {
  loadNotifications: (filters?: NotificationHistoryFilters, reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  markMultipleAsUnread: (notificationIds: string[]) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultipleNotifications: (notificationIds: string[]) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  restoreNotification: (notificationId: string) => Promise<void>;
  searchNotifications: (searchTerm: string, filters?: NotificationHistoryFilters) => Promise<void>;
  getNotificationAnalytics: (notificationId: string) => Promise<any>;
  getNotificationEngagement: (notificationId: string) => Promise<any[]>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useNotificationHistory(): UseNotificationHistoryState & UseNotificationHistoryActions {
  const { user } = useAuth();
  const [state, setState] = useState<UseNotificationHistoryState>({
    notifications: [],
    stats: null,
    loading: false,
    error: null,
    hasMore: true,
    totalCount: 0,
  });

  const [currentFilters, setCurrentFilters] = useState<NotificationHistoryFilters>({});
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const loadNotifications = useCallback(async (
    filters: NotificationHistoryFilters = {},
    reset: boolean = true
  ) => {
    if (!user) {
      setError('User must be authenticated to load notifications');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = reset ? 0 : currentOffset;
      const limit = 20;

      let notifications: NotificationHistoryItem[];
      
      if (currentSearchTerm) {
        notifications = await notificationHistoryService.searchNotifications(
          user.id,
          currentSearchTerm,
          filters,
          limit,
          offset
        );
      } else {
        notifications = await notificationHistoryService.getNotificationHistory(
          user.id,
          filters,
          limit,
          offset
        );
      }

      const stats = await notificationHistoryService.getNotificationHistoryStats(
        user.id,
        filters
      );

      setState(prev => ({
        ...prev,
        notifications: reset ? notifications : [...prev.notifications, ...notifications],
        stats,
        hasMore: notifications.length === limit,
        totalCount: stats.total,
      }));

      setCurrentFilters(filters);
      setCurrentOffset(reset ? limit : currentOffset + limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, currentOffset, currentSearchTerm, setLoading, setError]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    await loadNotifications(currentFilters, false);
  }, [state.hasMore, state.loading, loadNotifications, currentFilters]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.markNotificationAsRead(notificationId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        ),
        stats: prev.stats ? {
          ...prev.stats,
          unread: Math.max(0, prev.stats.unread - 1),
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const markAsUnread = useCallback(async (notificationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.markNotificationAsUnread(notificationId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: false, readAt: undefined } : n
        ),
        stats: prev.stats ? {
          ...prev.stats,
          unread: prev.stats.unread + 1,
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as unread');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.markMultipleNotificationsAsRead(notificationIds);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true, readAt: new Date() } : n
        ),
        stats: prev.stats ? {
          ...prev.stats,
          unread: Math.max(0, prev.stats.unread - notificationIds.length),
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const markMultipleAsUnread = useCallback(async (notificationIds: string[]) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.markMultipleNotificationsAsUnread(notificationIds);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: false, readAt: undefined } : n
        ),
        stats: prev.stats ? {
          ...prev.stats,
          unread: prev.stats.unread + notificationIds.length,
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as unread');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.deleteNotification(notificationId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        stats: prev.stats ? {
          ...prev.stats,
          total: prev.stats.total - 1,
          unread: prev.notifications.find(n => n.id === notificationId)?.isRead === false 
            ? prev.stats.unread - 1 
            : prev.stats.unread,
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const deleteMultipleNotifications = useCallback(async (notificationIds: string[]) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.deleteMultipleNotifications(notificationIds);
      
      // Update local state
      const deletedNotifications = state.notifications.filter(n => notificationIds.includes(n.id));
      const deletedUnreadCount = deletedNotifications.filter(n => !n.isRead).length;
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => !notificationIds.includes(n.id)),
        stats: prev.stats ? {
          ...prev.stats,
          total: prev.stats.total - notificationIds.length,
          unread: Math.max(0, prev.stats.unread - deletedUnreadCount),
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notifications');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, state.notifications]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.archiveNotification(notificationId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        stats: prev.stats ? {
          ...prev.stats,
          total: prev.stats.total - 1,
          unread: prev.notifications.find(n => n.id === notificationId)?.isRead === false 
            ? prev.stats.unread - 1 
            : prev.stats.unread,
        } : null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError]);

  const restoreNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await notificationHistoryService.restoreNotification(notificationId);
      
      // Refresh notifications to include restored notification
      await loadNotifications(currentFilters, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore notification');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, loadNotifications, currentFilters]);

  const searchNotifications = useCallback(async (
    searchTerm: string,
    filters: NotificationHistoryFilters = {}
  ) => {
    setCurrentSearchTerm(searchTerm);
    await loadNotifications(filters, true);
  }, [loadNotifications]);

  const getNotificationAnalytics = useCallback(async (notificationId: string) => {
    try {
      return await notificationHistoryService.getNotificationAnalytics(notificationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get notification analytics');
      return null;
    }
  }, [setError]);

  const getNotificationEngagement = useCallback(async (notificationId: string) => {
    try {
      return await notificationHistoryService.getNotificationEngagement(notificationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get notification engagement');
      return [];
    }
  }, [setError]);

  const refresh = useCallback(async () => {
    setCurrentOffset(0);
    await loadNotifications(currentFilters, true);
  }, [loadNotifications, currentFilters]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Load initial notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  return {
    ...state,
    loadNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    markMultipleAsRead,
    markMultipleAsUnread,
    deleteNotification,
    deleteMultipleNotifications,
    archiveNotification,
    restoreNotification,
    searchNotifications,
    getNotificationAnalytics,
    getNotificationEngagement,
    refresh,
    clearError,
  };
}
