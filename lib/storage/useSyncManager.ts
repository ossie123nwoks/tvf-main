import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncItem, SyncProgress, SyncOptions, SyncConflict, SyncStats } from './syncManager';

export interface UseSyncManagerReturn {
  syncQueue: SyncItem[];
  activeSyncs: string[];
  syncProgress: SyncProgress;
  syncOptions: SyncOptions | null;
  syncConflicts: SyncConflict[];
  syncStats: SyncStats | null;
  isSyncInProgress: boolean;
  isLoading: boolean;
  addToSyncQueue: (syncItem: Omit<SyncItem, 'id' | 'createdAt' | 'lastAttempt' | 'status' | 'retryCount'>) => Promise<string>;
  startSync: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;
  retryFailedSyncs: () => Promise<void>;
  clearCompletedSyncs: () => Promise<void>;
  updateSyncOptions: (options: Partial<SyncOptions>) => Promise<void>;
  resolveSyncConflict: (conflictId: string, resolution: SyncConflict['resolution']) => Promise<void>;
  triggerOfflineContentSync: () => Promise<void>;
  getSyncStatusSummary: () => {
    totalItems: number;
    pendingItems: number;
    inProgressItems: number;
    completedItems: number;
    failedItems: number;
    offlineContentCount: number;
    lastSyncTime: number;
  };
  refreshData: () => Promise<void>;
}

export const useSyncManager = (): UseSyncManagerReturn => {
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [activeSyncs, setActiveSyncs] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    totalItems: 0,
    completedItems: 0,
    failedItems: 0,
    inProgressItems: 0,
    estimatedTimeRemaining: 0,
    bytesTransferred: 0,
    totalBytes: 0,
  });
  const [syncOptions, setSyncOptions] = useState<SyncOptions | null>(null);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isSyncInProgress, setIsSyncInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [queue, options, conflicts, stats] = await Promise.all([
        syncManager.getSyncQueue(),
        syncManager.getSyncOptions(),
        syncManager.getSyncConflicts(),
        syncManager.getSyncStats(),
      ]);

      setSyncQueue(queue);
      setSyncOptions(options);
      setSyncConflicts(conflicts);
      setSyncStats(stats);
      
      // Update progress and status
      setSyncProgress(syncManager.getSyncProgress());
      setIsSyncInProgress(syncManager.isSyncInProgress());
      setActiveSyncs(syncManager.getActiveSyncs());
      
    } catch (error) {
      console.error('Failed to load initial sync data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (syncItem: Omit<SyncItem, 'id' | 'createdAt' | 'lastAttempt' | 'status' | 'retryCount'>) => {
    try {
      const id = await syncManager.addToSyncQueue(syncItem);
      
      // Refresh data to show new item
      await refreshData();
      
      return id;
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
      throw error;
    }
  }, [refreshData]);

  // Start sync
  const startSync = useCallback(async () => {
    try {
      await syncManager.startSync();
      
      // Refresh data to show updated status
      await refreshData();
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  }, [refreshData]);

  // Pause sync
  const pauseSync = useCallback(() => {
    syncManager.pauseSync();
    setIsSyncInProgress(false);
  }, []);

  // Resume sync
  const resumeSync = useCallback(async () => {
    try {
      syncManager.resumeSync();
      
      // Refresh data to show updated status
      await refreshData();
    } catch (error) {
      console.error('Failed to resume sync:', error);
    }
  }, [refreshData]);

  // Retry failed syncs
  const retryFailedSyncs = useCallback(async () => {
    try {
      await syncManager.retryFailedSyncs();
      
      // Refresh data to show updated status
      await refreshData();
    } catch (error) {
      console.error('Failed to retry failed syncs:', error);
    }
  }, [refreshData]);

  // Clear completed syncs
  const clearCompletedSyncs = useCallback(async () => {
    try {
      await syncManager.clearCompletedSyncs();
      
      // Refresh data to show updated queue
      await refreshData();
    } catch (error) {
      console.error('Failed to clear completed syncs:', error);
    }
  }, [refreshData]);

  // Update sync options
  const updateSyncOptions = useCallback(async (options: Partial<SyncOptions>) => {
    try {
      await syncManager.updateSyncOptions(options);
      
      // Refresh options
      const updatedOptions = await syncManager.getSyncOptions();
      setSyncOptions(updatedOptions);
    } catch (error) {
      console.error('Failed to update sync options:', error);
    }
  }, []);

  // Resolve sync conflict
  const resolveSyncConflict = useCallback(async (conflictId: string, resolution: SyncConflict['resolution']) => {
    try {
      await syncManager.resolveSyncConflict(conflictId, resolution);
      
      // Refresh conflicts and queue
      const [conflicts, queue] = await Promise.all([
        syncManager.getSyncConflicts(),
        syncManager.getSyncQueue(),
      ]);
      
      setSyncConflicts(conflicts);
      setSyncQueue(queue);
      
      // Update progress
      setSyncProgress(syncManager.getSyncProgress());
      
    } catch (error) {
      console.error('Failed to resolve sync conflict:', error);
      throw error;
    }
  }, []);

  // Trigger offline content synchronization
  const triggerOfflineContentSync = useCallback(async () => {
    try {
      await syncManager.triggerOfflineContentSync();
      
      // Refresh data to show updated sync queue
      await refreshData();
    } catch (error) {
      console.error('Failed to trigger offline content sync:', error);
      throw error;
    }
  }, [refreshData]);

  // Get sync status summary
  const getSyncStatusSummary = useCallback(() => {
    return syncManager.getSyncStatusSummary();
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Set up periodic refresh for sync progress
  useEffect(() => {
    let isMounted = true;

    const updateProgress = () => {
      if (isMounted) {
        setSyncProgress(syncManager.getSyncProgress());
        setIsSyncInProgress(syncManager.isSyncInProgress());
        setActiveSyncs(syncManager.getActiveSyncs());
      }
    };

    // Update progress every 2 seconds when sync is in progress
    const interval = setInterval(updateProgress, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Monitor sync queue changes
  useEffect(() => {
    let isMounted = true;

    const checkForUpdates = async () => {
      if (isMounted && !isSyncInProgress) {
        // Check if there are new items or status changes
        const currentQueue = syncManager.getSyncQueue();
        const currentProgress = syncManager.getSyncProgress();
        
        if (JSON.stringify(currentQueue) !== JSON.stringify(syncQueue)) {
          setSyncQueue(currentQueue);
        }
        
        if (JSON.stringify(currentProgress) !== JSON.stringify(syncProgress)) {
          setSyncProgress(currentProgress);
        }
      }
    };

    // Check for updates every 5 seconds
    const interval = setInterval(checkForUpdates, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [syncQueue, syncProgress, isSyncInProgress]);

  return {
    syncQueue,
    activeSyncs,
    syncProgress,
    syncOptions,
    syncConflicts,
    syncStats,
    isSyncInProgress,
    isLoading,
    addToSyncQueue,
    startSync,
    pauseSync,
    resumeSync,
    retryFailedSyncs,
    clearCompletedSyncs,
    updateSyncOptions,
    resolveSyncConflict,
    triggerOfflineContentSync,
    getSyncStatusSummary,
    refreshData,
  };
};
