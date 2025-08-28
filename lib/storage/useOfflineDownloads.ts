import { useState, useEffect, useCallback } from 'react';
import { offlineDownloadService, DownloadItem, DownloadOptions, StorageInfo } from './offline';

export interface UseOfflineDownloadsReturn {
  downloads: DownloadItem[];
  activeDownloads: DownloadItem[];
  completedDownloads: DownloadItem[];
  pendingDownloads: DownloadItem[];
  failedDownloads: DownloadItem[];
  storageInfo: StorageInfo;
  addDownload: (
    type: DownloadItem['type'],
    title: string,
    url: string,
    metadata?: Record<string, any>,
    options?: DownloadOptions
  ) => Promise<string>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  isAvailableOffline: (url: string) => Promise<boolean>;
  getOfflinePath: (url: string) => Promise<string | null>;
  cleanupDownloads: () => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

export const useOfflineDownloads = (): UseOfflineDownloadsReturn => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSpace: 0,
    usedSpace: 0,
    availableSpace: 0,
    downloadCount: 0,
    totalDownloadSize: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load downloads and storage info
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [downloadsData, storageData] = await Promise.all([
        Promise.resolve(offlineDownloadService.getAllDownloads()),
        offlineDownloadService.getStorageInfo(),
      ]);

      setDownloads(downloadsData);
      setStorageInfo(storageData);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new download
  const addDownload = useCallback(
    async (
      type: DownloadItem['type'],
      title: string,
      url: string,
      metadata?: Record<string, any>,
      options?: DownloadOptions
    ): Promise<string> => {
      try {
        const id = await offlineDownloadService.addDownload(type, title, url, metadata, options);
        await loadData(); // Refresh data after adding download
        return id;
      } catch (error) {
        console.error('Failed to add download:', error);
        throw error;
      }
    },
    [loadData]
  );

  // Pause download
  const pauseDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await offlineDownloadService.pauseDownload(id);
        await loadData(); // Refresh data after pausing
      } catch (error) {
        console.error('Failed to pause download:', error);
      }
    },
    [loadData]
  );

  // Resume download
  const resumeDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await offlineDownloadService.resumeDownload(id);
        await loadData(); // Refresh data after resuming
      } catch (error) {
        console.error('Failed to resume download:', error);
      }
    },
    [loadData]
  );

  // Cancel download
  const cancelDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await offlineDownloadService.cancelDownload(id);
        await loadData(); // Refresh data after canceling
      } catch (error) {
        console.error('Failed to cancel download:', error);
      }
    },
    [loadData]
  );

  // Check if content is available offline
  const isAvailableOffline = useCallback(async (url: string): Promise<boolean> => {
    try {
      return await offlineDownloadService.isAvailableOffline(url);
    } catch (error) {
      console.error('Failed to check offline availability:', error);
      return false;
    }
  }, []);

  // Get offline content path
  const getOfflinePath = useCallback(async (url: string): Promise<string | null> => {
    try {
      return await offlineDownloadService.getOfflinePath(url);
    } catch (error) {
      console.error('Failed to get offline path:', error);
      return null;
    }
  }, []);

  // Clean up old downloads
  const cleanupDownloads = useCallback(async (): Promise<void> => {
    try {
      await offlineDownloadService.cleanupDownloads();
      await loadData(); // Refresh data after cleanup
    } catch (error) {
      console.error('Failed to cleanup downloads:', error);
    }
  }, [loadData]);

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  // Computed properties for different download states
  const activeDownloads = downloads.filter(item => item.status === 'downloading');
  const completedDownloads = downloads.filter(item => item.status === 'completed');
  const pendingDownloads = downloads.filter(item => item.status === 'pending');
  const failedDownloads = downloads.filter(item => item.status === 'failed');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up periodic refresh for active downloads
  useEffect(() => {
    if (activeDownloads.length > 0) {
      const interval = setInterval(() => {
        loadData();
      }, 2000); // Update every 2 seconds for active downloads

      return () => clearInterval(interval);
    }
  }, [activeDownloads.length, loadData]);

  return {
    downloads,
    activeDownloads,
    completedDownloads,
    pendingDownloads,
    failedDownloads,
    storageInfo,
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    isAvailableOffline,
    getOfflinePath,
    cleanupDownloads,
    refreshData,
    isLoading,
  };
};
