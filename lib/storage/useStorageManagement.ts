import { useState, useEffect, useCallback } from 'react';
import {
  storageManager,
  StorageUsage,
  ContentTypeUsage,
  StorageAnalytics,
  StorageRecommendations,
  CleanupOptions,
} from './storageManager';

export interface UseStorageManagementReturn {
  storageUsage: StorageUsage | null;
  contentTypeUsage: ContentTypeUsage[];
  storageAnalytics: StorageAnalytics | null;
  storageRecommendations: StorageRecommendations | null;
  storageHealthScore: number;
  usageHistory: Array<{ date: string; usedSpace: number; downloadCount: number }>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  performCleanup: (options: CleanupOptions) => Promise<{
    removedCount: number;
    freedSpace: number;
    details: string[];
  }>;
  trackUsage: () => Promise<void>;
}

export const useStorageManagement = (): UseStorageManagementReturn => {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [contentTypeUsage, setContentTypeUsage] = useState<ContentTypeUsage[]>([]);
  const [storageAnalytics, setStorageAnalytics] = useState<StorageAnalytics | null>(null);
  const [storageRecommendations, setStorageRecommendations] =
    useState<StorageRecommendations | null>(null);
  const [storageHealthScore, setStorageHealthScore] = useState<number>(0);
  const [usageHistory, setUsageHistory] = useState<
    Array<{ date: string; usedSpace: number; downloadCount: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all storage data
  const loadStorageData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [usage, typeUsage, analytics, recommendations, healthScore, history] =
        await Promise.all([
          storageManager.getStorageUsage(),
          storageManager.getContentTypeUsage(),
          storageManager.getStorageAnalytics(),
          storageManager.getStorageRecommendations(),
          storageManager.getStorageHealthScore(),
          storageManager.getStorageUsageHistory(),
        ]);

      setStorageUsage(usage);
      setContentTypeUsage(typeUsage);
      setStorageAnalytics(analytics);
      setStorageRecommendations(recommendations);
      setStorageHealthScore(healthScore);
      setUsageHistory(history);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadStorageData();
  }, [loadStorageData]);

  // Perform storage cleanup
  const performCleanup = useCallback(
    async (options: CleanupOptions) => {
      try {
        const result = await storageManager.performStorageCleanup(options);

        // Refresh data after cleanup
        await loadStorageData();

        return result;
      } catch (error) {
        console.error('Failed to perform storage cleanup:', error);
        throw error;
      }
    },
    [loadStorageData]
  );

  // Track storage usage
  const trackUsage = useCallback(async () => {
    try {
      await storageManager.trackStorageUsage();

      // Refresh data after tracking
      await loadStorageData();
    } catch (error) {
      console.error('Failed to track storage usage:', error);
    }
  }, [loadStorageData]);

  // Load initial data
  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  // Set up periodic usage tracking (every hour)
  useEffect(() => {
    const interval = setInterval(
      () => {
        trackUsage();
      },
      60 * 60 * 1000
    ); // 1 hour

    return () => clearInterval(interval);
  }, [trackUsage]);

  return {
    storageUsage,
    contentTypeUsage,
    storageAnalytics,
    storageRecommendations,
    storageHealthScore,
    usageHistory,
    isLoading,
    refreshData,
    performCleanup,
    trackUsage,
  };
};
