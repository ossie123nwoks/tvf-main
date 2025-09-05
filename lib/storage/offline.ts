import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface DownloadItem {
  id: string;
  type: 'audio' | 'article' | 'image' | 'document';
  title: string;
  url: string;
  localPath: string;
  size: number;
  downloadedSize: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DownloadProgress {
  id: string;
  downloadedSize: number;
  totalSize: number;
  progress: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface StorageInfo {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  downloadCount: number;
  totalDownloadSize: number;
}

export interface DownloadOptions {
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
  timeout?: number;
  chunkSize?: number;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (item: DownloadItem) => void;
  onError?: (error: string) => void;
}

export class OfflineDownloadService {
  private static instance: OfflineDownloadService;
  private downloads: Map<string, DownloadItem> = new Map();
  private activeDownloads: Set<string> = new Set();
  private downloadQueue: string[] = [];
  private maxConcurrentDownloads = 3;
  private storageKey = '@offline_downloads';
  private baseDir: string;

  private constructor() {
    this.baseDir = `${FileSystem.documentDirectory}offline/`;
    this.initializeStorage();
  }

  static getInstance(): OfflineDownloadService {
    if (!OfflineDownloadService.instance) {
      OfflineDownloadService.instance = new OfflineDownloadService();
    }
    return OfflineDownloadService.instance;
  }

  /**
   * Initialize storage and load existing downloads
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Create base directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
      }

      // Load existing downloads from storage
      await this.loadDownloads();
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  /**
   * Add a new download to the queue
   */
  async addDownload(
    type: DownloadItem['type'],
    title: string,
    url: string,
    metadata?: Record<string, any>,
    options: DownloadOptions = {}
  ): Promise<string> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection available');
      }

      // Check available storage space
      const storageInfo = await this.getStorageInfo();
      if (storageInfo.availableSpace < 50 * 1024 * 1024) {
        // 50MB minimum
        throw new Error('Insufficient storage space');
      }

      const id = this.generateDownloadId();
      const localPath = await this.generateLocalPath(type, title, url);

      const downloadItem: DownloadItem = {
        id,
        type,
        title,
        url,
        localPath,
        size: 0,
        downloadedSize: 0,
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata,
      };

      // Add to downloads map
      this.downloads.set(id, downloadItem);
      this.downloadQueue.push(id);

      // Save to storage
      await this.saveDownloads();

      // Start download if possible
      this.processQueue();

      return id;
    } catch (error) {
      console.error('Failed to add download:', error);
      throw error;
    }
  }

  /**
   * Start downloading an item
   */
  private async startDownload(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item || this.activeDownloads.has(id)) return;

    try {
      this.activeDownloads.add(id);
      item.status = 'downloading';
      item.updatedAt = Date.now();

      // Get file size first
      const response = await fetch(item.url, { method: 'HEAD' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const contentLength = response.headers.get('content-length');
      item.size = contentLength ? parseInt(contentLength, 10) : 0;

      // Start the actual download
      await this.downloadFile(item);
    } catch (error) {
      console.error(`Download failed for ${id}:`, error);
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Download failed';
      item.updatedAt = Date.now();
      this.activeDownloads.delete(id);
      await this.saveDownloads();
      this.processQueue();
    }
  }

  /**
   * Download file with progress tracking
   */
  private async downloadFile(item: DownloadItem): Promise<void> {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        item.url,
        item.localPath,
        {},
        downloadProgress => {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          item.progress = progress;
          item.downloadedSize = downloadProgress.totalBytesWritten;
          item.updatedAt = Date.now();
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result && result.status === 200) {
        item.status = 'completed';
        item.progress = 1;
        item.downloadedSize = item.size;
        item.updatedAt = Date.now();
        console.log(`Download completed: ${item.title}`);
      } else {
        throw new Error(`Download failed with status: ${result?.status || 'unknown'}`);
      }
    } catch (error) {
      throw error;
    } finally {
      this.activeDownloads.delete(item.id);
      await this.saveDownloads();
      this.processQueue();
    }
  }

  /**
   * Process download queue
   */
  private processQueue(): void {
    while (
      this.downloadQueue.length > 0 &&
      this.activeDownloads.size < this.maxConcurrentDownloads
    ) {
      const id = this.downloadQueue.shift();
      if (id) {
        this.startDownload(id);
      }
    }
  }

  /**
   * Pause a download
   */
  async pauseDownload(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item || item.status !== 'downloading') return;

    item.status = 'paused';
    item.updatedAt = Date.now();
    this.activeDownloads.delete(id);
    await this.saveDownloads();
    this.processQueue();
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item || item.status !== 'paused') return;

    // Add back to queue
    this.downloadQueue.unshift(id);
    await this.saveDownloads();
    this.processQueue();
  }

  /**
   * Cancel a download
   */
  async cancelDownload(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item) return;

    // Remove from active downloads
    this.activeDownloads.delete(id);

    // Remove from queue
    const queueIndex = this.downloadQueue.indexOf(id);
    if (queueIndex > -1) {
      this.downloadQueue.splice(queueIndex, 1);
    }

    // Remove from downloads map
    this.downloads.delete(id);

    // Delete partial file
    try {
      const fileInfo = await FileSystem.getInfoAsync(item.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(item.localPath);
      }
    } catch (error) {
      console.error('Failed to delete partial file:', error);
    }

    await this.saveDownloads();
    this.processQueue();
  }

  /**
   * Get download by ID
   */
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Get downloads by type
   */
  getDownloadsByType(type: DownloadItem['type']): DownloadItem[] {
    return Array.from(this.downloads.values()).filter(item => item.type === type);
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadItem['status']): DownloadItem[] {
    return Array.from(this.downloads.values()).filter(item => item.status === status);
  }

  /**
   * Get download by content ID
   */
  getDownloadByContentId(contentId: string): DownloadItem | undefined {
    return Array.from(this.downloads.values()).find(
      item => item.metadata?.contentId === contentId || item.id === contentId
    );
  }

  /**
   * Get all completed downloads
   */
  getCompletedDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values()).filter(item => item.status === 'completed');
  }

  /**
   * Check if content is available offline
   */
  async isAvailableOffline(url: string): Promise<boolean> {
    try {
      const downloads = Array.from(this.downloads.values());
      const download = downloads.find(item => item.url === url && item.status === 'completed');

      if (!download) return false;

      // Verify file still exists
      const fileInfo = await FileSystem.getInfoAsync(download.localPath);
      return fileInfo.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get offline content path
   */
  async getOfflinePath(url: string): Promise<string | null> {
    try {
      const downloads = Array.from(this.downloads.values());
      const download = downloads.find(item => item.url === url && item.status === 'completed');

      if (!download) return null;

      // Verify file still exists
      const fileInfo = await FileSystem.getInfoAsync(download.localPath);
      return fileInfo.exists ? download.localPath : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const downloads = Array.from(this.downloads.values());
      const completedDownloads = downloads.filter(item => item.status === 'completed');

      let totalDownloadSize = 0;
      for (const download of completedDownloads) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(download.localPath);
          if (fileInfo.exists && fileInfo.size) {
            totalDownloadSize += fileInfo.size;
          }
        } catch (error) {
          console.error('Failed to get file size:', error);
        }
      }

      // Get device storage info (platform specific)
      let totalSpace = 0;
      let availableSpace = 0;

      if (Platform.OS === 'ios') {
        // iOS doesn't provide direct storage info, use estimated values
        totalSpace = 64 * 1024 * 1024 * 1024; // 64GB estimate
        availableSpace = totalSpace - totalDownloadSize;
      } else {
        // Android - could use react-native-device-info for more accurate info
        totalSpace = 32 * 1024 * 1024 * 1024; // 32GB estimate
        availableSpace = totalSpace - totalDownloadSize;
      }

      return {
        totalSpace,
        usedSpace: totalDownloadSize,
        availableSpace,
        downloadCount: completedDownloads.length,
        totalDownloadSize,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalSpace: 0,
        usedSpace: 0,
        availableSpace: 0,
        downloadCount: 0,
        totalDownloadSize: 0,
      };
    }
  }

  /**
   * Clean up old or failed downloads
   */
  async cleanupDownloads(): Promise<void> {
    try {
      const downloads = Array.from(this.downloads.values());
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      for (const download of downloads) {
        // Remove downloads older than 30 days
        if (download.createdAt < thirtyDaysAgo) {
          await this.cancelDownload(download.id);
        }

        // Remove failed downloads older than 7 days
        if (download.status === 'failed' && download.updatedAt < now - 7 * 24 * 60 * 60 * 1000) {
          await this.cancelDownload(download.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup downloads:', error);
    }
  }

  /**
   * Generate unique download ID
   */
  private generateDownloadId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate local file path
   */
  private async generateLocalPath(
    type: DownloadItem['type'],
    title: string,
    url: string
  ): Promise<string> {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const extension = this.getFileExtension(url, type);
    const filename = `${sanitizedTitle}_${Date.now()}${extension}`;

    // Create type-specific subdirectories
    const typeDir = `${this.baseDir}${type}/`;
    const dirInfo = await FileSystem.getInfoAsync(typeDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(typeDir, { intermediates: true });
    }

    return `${typeDir}${filename}`;
  }

  /**
   * Get file extension from URL or type
   */
  private getFileExtension(url: string, type: DownloadItem['type']): string {
    if (type === 'audio') return '.mp3';
    if (type === 'article') return '.html';
    if (type === 'image') return '.jpg';
    if (type === 'document') return '.pdf';

    // Try to extract from URL
    const urlParts = url.split('.');
    if (urlParts.length > 1) {
      const ext = urlParts[urlParts.length - 1].split('?')[0];
      if (ext && ext.length <= 4) return `.${ext}`;
    }

    return '';
  }

  /**
   * Load downloads from storage
   */
  private async loadDownloads(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        const downloadsArray = JSON.parse(data);
        this.downloads.clear();
        downloadsArray.forEach((item: DownloadItem) => {
          this.downloads.set(item.id, item);
        });
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  }

  /**
   * Save downloads to storage
   */
  async saveDownloads(): Promise<void> {
    try {
      const downloadsArray = Array.from(this.downloads.values());
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(downloadsArray));
    } catch (error) {
      console.error('Failed to save downloads:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Cancel all active downloads
      for (const id of this.activeDownloads) {
        await this.cancelDownload(id);
      }

      // Clear all downloads
      this.downloads.clear();
      this.downloadQueue = [];
      this.activeDownloads.clear();

      // Remove storage
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to cleanup offline service:', error);
    }
  }
}

// Export singleton instance
export const offlineDownloadService = OfflineDownloadService.getInstance();
