import { useState, useCallback, useEffect } from 'react';
import { reminderService, Reminder, CreateReminderRequest, ReminderStats } from '@/lib/notifications/reminderService';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UseRemindersReturn {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  stats: ReminderStats | null;
  loading: boolean;
  error: string | null;
  createReminder: (request: CreateReminderRequest) => Promise<Reminder>;
  updateReminder: (reminderId: string, updates: Partial<CreateReminderRequest>) => Promise<Reminder>;
  cancelReminder: (reminderId: string) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  getReminderByContent: (contentType: 'sermon' | 'article', contentId: string) => Promise<Reminder | null>;
  refreshReminders: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useReminders = (): UseRemindersReturn => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reminders on mount and when user changes
  useEffect(() => {
    if (user) {
      loadReminders();
      loadUpcomingReminders();
      loadStats();
    } else {
      setReminders([]);
      setUpcomingReminders([]);
      setStats(null);
    }
  }, [user]);

  const loadReminders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userReminders = await reminderService.getUserReminders(user.id);
      setReminders(userReminders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reminders';
      setError(errorMessage);
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUpcomingReminders = useCallback(async () => {
    if (!user) return;

    try {
      const upcoming = await reminderService.getUpcomingReminders(user.id, 5);
      setUpcomingReminders(upcoming);
    } catch (err) {
      console.error('Error loading upcoming reminders:', err);
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const reminderStats = await reminderService.getReminderStats(user.id);
      setStats(reminderStats);
    } catch (err) {
      console.error('Error loading reminder stats:', err);
    }
  }, [user]);

  const createReminder = useCallback(async (request: CreateReminderRequest): Promise<Reminder> => {
    if (!user) {
      throw new Error('User must be authenticated to create reminders');
    }

    setLoading(true);
    setError(null);

    try {
      const newReminder = await reminderService.createReminder(user.id, request);
      
      // Refresh the lists
      await Promise.all([
        loadReminders(),
        loadUpcomingReminders(),
        loadStats(),
      ]);

      return newReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reminder';
      setError(errorMessage);
      console.error('Error creating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, loadReminders, loadUpcomingReminders, loadStats]);

  const updateReminder = useCallback(async (
    reminderId: string,
    updates: Partial<CreateReminderRequest>
  ): Promise<Reminder> => {
    setLoading(true);
    setError(null);

    try {
      const updatedReminder = await reminderService.updateReminder(reminderId, updates);
      
      // Refresh the lists
      await Promise.all([
        loadReminders(),
        loadUpcomingReminders(),
        loadStats(),
      ]);

      return updatedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reminder';
      setError(errorMessage);
      console.error('Error updating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadReminders, loadUpcomingReminders, loadStats]);

  const cancelReminder = useCallback(async (reminderId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await reminderService.cancelReminder(reminderId);
      
      // Refresh the lists
      await Promise.all([
        loadReminders(),
        loadUpcomingReminders(),
        loadStats(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reminder';
      setError(errorMessage);
      console.error('Error canceling reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadReminders, loadUpcomingReminders, loadStats]);

  const deleteReminder = useCallback(async (reminderId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await reminderService.deleteReminder(reminderId);
      
      // Refresh the lists
      await Promise.all([
        loadReminders(),
        loadUpcomingReminders(),
        loadStats(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reminder';
      setError(errorMessage);
      console.error('Error deleting reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadReminders, loadUpcomingReminders, loadStats]);

  const getReminderByContent = useCallback(async (
    contentType: 'sermon' | 'article',
    contentId: string
  ): Promise<Reminder | null> => {
    if (!user) return null;

    try {
      return await reminderService.getReminderByContent(user.id, contentType, contentId);
    } catch (err) {
      console.error('Error getting reminder by content:', err);
      return null;
    }
  }, [user]);

  const refreshReminders = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadReminders(),
      loadUpcomingReminders(),
    ]);
  }, [loadReminders, loadUpcomingReminders]);

  const refreshStats = useCallback(async (): Promise<void> => {
    await loadStats();
  }, [loadStats]);

  return {
    reminders,
    upcomingReminders,
    stats,
    loading,
    error,
    createReminder,
    updateReminder,
    cancelReminder,
    deleteReminder,
    getReminderByContent,
    refreshReminders,
    refreshStats,
  };
};
