import { useState, useCallback, useEffect } from 'react';
import {
  notificationPreferencesService,
  NotificationPreferenceGroup,
  NotificationSchedule,
  NotificationFrequency,
} from '@/lib/notifications/preferencesService';
import { NotificationSettings } from '@/types/user';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UseNotificationPreferencesReturn {
  preferenceGroups: NotificationPreferenceGroup[];
  schedules: NotificationSchedule[];
  frequency: NotificationFrequency | null;
  stats: {
    totalReceived: number;
    totalRead: number;
    readRate: number;
    byType: Record<string, number>;
    byDay: Record<string, number>;
    lastNotification: Date | null;
  } | null;
  loading: boolean;
  error: string | null;
  updatePreference: (category: string, preferenceId: string, enabled: boolean) => Promise<void>;
  updatePreferenceGroup: (groupId: string, enabled: boolean) => Promise<void>;
  saveSchedule: (schedule: Omit<NotificationSchedule, 'id'>) => Promise<NotificationSchedule>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  updateFrequency: (frequency: Partial<NotificationFrequency>) => Promise<NotificationFrequency>;
  resetPreferences: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const { user } = useAuth();
  const [preferenceGroups, setPreferenceGroups] = useState<NotificationPreferenceGroup[]>([]);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [frequency, setFrequency] = useState<NotificationFrequency | null>(null);
  const [stats, setStats] = useState<{
    totalReceived: number;
    totalRead: number;
    readRate: number;
    byType: Record<string, number>;
    byDay: Record<string, number>;
    lastNotification: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setPreferenceGroups([]);
      setSchedules([]);
      setFrequency(null);
      setStats(null);
    }
  }, [user]);

  const loadAllData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [preferences, userSchedules, userFrequency, userStats] = await Promise.all([
        notificationPreferencesService.getUserNotificationPreferences(user.id),
        notificationPreferencesService.getUserNotificationSchedules(user.id),
        notificationPreferencesService.getUserNotificationFrequency(user.id),
        notificationPreferencesService.getUserNotificationStats(user.id),
      ]);

      setPreferenceGroups(preferences);
      setSchedules(userSchedules);
      setFrequency(userFrequency);
      setStats(userStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notification preferences';
      setError(errorMessage);
      console.error('Error loading notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreference = useCallback(async (
    category: string,
    preferenceId: string,
    enabled: boolean
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update preferences');
    }

    setLoading(true);
    setError(null);

    try {
      // Find the preference group and update the specific preference
      const updatedGroups = preferenceGroups.map(group => {
        if (group.id === category) {
          return {
            ...group,
            preferences: group.preferences.map(pref => 
              pref.id === preferenceId ? { ...pref, enabled } : pref
            ),
          };
        }
        return group;
      });

      setPreferenceGroups(updatedGroups);

      // Update the corresponding notification setting
      const notificationUpdate: Partial<NotificationSettings> = {};
      switch (category) {
        case 'content':
          notificationUpdate.newContent = enabled;
          break;
        case 'reminders':
          notificationUpdate.reminders = enabled;
          break;
        case 'updates':
          notificationUpdate.updates = enabled;
          break;
        case 'marketing':
          notificationUpdate.marketing = enabled;
          break;
      }

      await notificationPreferencesService.updateUserNotificationPreferences(
        user.id,
        notificationUpdate
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preference';
      setError(errorMessage);
      console.error('Error updating preference:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, preferenceGroups]);

  const updatePreferenceGroup = useCallback(async (
    groupId: string,
    enabled: boolean
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update preferences');
    }

    setLoading(true);
    setError(null);

    try {
      // Update all preferences in the group
      const updatedGroups = preferenceGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            enabled,
            preferences: group.preferences.map(pref => ({ ...pref, enabled })),
          };
        }
        return group;
      });

      setPreferenceGroups(updatedGroups);

      // Update the corresponding notification setting
      const notificationUpdate: Partial<NotificationSettings> = {};
      switch (groupId) {
        case 'content':
          notificationUpdate.newContent = enabled;
          break;
        case 'reminders':
          notificationUpdate.reminders = enabled;
          break;
        case 'updates':
          notificationUpdate.updates = enabled;
          break;
        case 'marketing':
          notificationUpdate.marketing = enabled;
          break;
      }

      await notificationPreferencesService.updateUserNotificationPreferences(
        user.id,
        notificationUpdate
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preference group';
      setError(errorMessage);
      console.error('Error updating preference group:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, preferenceGroups]);

  const saveSchedule = useCallback(async (
    schedule: Omit<NotificationSchedule, 'id'>
  ): Promise<NotificationSchedule> => {
    if (!user) {
      throw new Error('User must be authenticated to save schedule');
    }

    setLoading(true);
    setError(null);

    try {
      const newSchedule = await notificationPreferencesService.saveNotificationSchedule(
        user.id,
        schedule
      );

      setSchedules(prev => [...prev, newSchedule]);
      return newSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedule';
      setError(errorMessage);
      console.error('Error saving schedule:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete schedule');
    }

    setLoading(true);
    setError(null);

    try {
      await notificationPreferencesService.deleteNotificationSchedule(user.id, scheduleId);
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      setError(errorMessage);
      console.error('Error deleting schedule:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateFrequency = useCallback(async (
    frequencyUpdate: Partial<NotificationFrequency>
  ): Promise<NotificationFrequency> => {
    if (!user) {
      throw new Error('User must be authenticated to update frequency');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedFrequency = await notificationPreferencesService.updateNotificationFrequency(
        user.id,
        frequencyUpdate
      );

      setFrequency(updatedFrequency);
      return updatedFrequency;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update frequency';
      setError(errorMessage);
      console.error('Error updating frequency:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const resetPreferences = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to reset preferences');
    }

    setLoading(true);
    setError(null);

    try {
      await notificationPreferencesService.resetNotificationPreferences(user.id);
      await loadAllData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(errorMessage);
      console.error('Error resetting preferences:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, loadAllData]);

  const refreshData = useCallback(async (): Promise<void> => {
    await loadAllData();
  }, [loadAllData]);

  return {
    preferenceGroups,
    schedules,
    frequency,
    stats,
    loading,
    error,
    updatePreference,
    updatePreferenceGroup,
    saveSchedule,
    deleteSchedule,
    updateFrequency,
    resetPreferences,
    refreshData,
  };
};
