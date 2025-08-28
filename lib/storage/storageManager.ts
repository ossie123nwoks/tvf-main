import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { offlineDownloadService, DownloadItem } from './offline';

export interface StorageUsage {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usagePercentage: number;
  downloadCount: number;
  totalDownloadSize: number;
  lastUpdated: number;
}

export interface ContentTypeUsage {
  type: 'audio' | 'article' | 'image' | 'document';
  count: number;
  totalSize: number;
  averageSize: number;
  lastAccessed: number;
  accessCount: number;
}

export interface StorageAnalytics {
  totalDownloads: number;
  successfulDownloads: number;
  failedDownloads: number;
  averageDownloadSize: number;
  largestDownload: number;
  smallestDownload: number;
  downloadSuccessRate: number;
  storageEfficiency: number;
  cleanupSavings: number;
  lastCleanup: number;
}

export interface StorageRecommendations {
  shouldCleanup: boolean;
  recommendedCleanupSize: number;
  oldContentCount: number;
  rarelyUsedContentCount: number;
  duplicateContentCount: number;
  optimizationSuggestions: string[];
}

export interface CleanupOptions {
  removeOldContent: boolean;
  removeFailedDownloads: boolean;
  removeRarelyUsed: boolean;
  removeDuplicates: boolean;
  ageThreshold: number; // days
  usageThreshold: number; // access count
  sizeThreshold: number; // bytes
}

export class StorageManager {
  private static instance: StorageManager;
  private storageKey = '@storage_analytics';
  private analyticsKey = '@storage_recommendations';
  private usageHistoryKey = '@storage_usage_history';
  private baseDir: string;

  private constructor() {
    this.baseDir = `${FileSystem.documentDirectory}offline/`;
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Get comprehensive storage usage information
   */
  async getStorageUsage(): Promise<StorageUsage> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
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

      const usagePercentage = totalSpace > 0 ? (totalDownloadSize / totalSpace) * 100 : 0;

      return {
        totalSpace,
        usedSpace: totalDownloadSize,
        availableSpace,
        usagePercentage,
        downloadCount: completedDownloads.length,
        totalDownloadSize,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalSpace: 0,
        usedSpace: 0,
        availableSpace: 0,
        usagePercentage: 0,
        downloadCount: 0,
        totalDownloadSize: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Get content type usage breakdown
   */
  async getContentTypeUsage(): Promise<ContentTypeUsage[]> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const completedDownloads = downloads.filter(item => item.status === 'completed');

      const typeMap = new Map<string, ContentTypeUsage>();

      for (const download of completedDownloads) {
        const type = download.type;
        if (!typeMap.has(type)) {
          typeMap.set(type, {
            type: type as any,
            count: 0,
            totalSize: 0,
            averageSize: 0,
            lastAccessed: download.updatedAt,
            accessCount: 1,
          });
        }

        const typeUsage = typeMap.get(type)!;
        typeUsage.count++;

        try {
          const fileInfo = await FileSystem.getInfoAsync(download.localPath);
          if (fileInfo.exists && fileInfo.size) {
            typeUsage.totalSize += fileInfo.size;
          }
        } catch (error) {
          console.error('Failed to get file size:', error);
        }

        typeUsage.lastAccessed = Math.max(typeUsage.lastAccessed, download.updatedAt);
        typeUsage.accessCount++;
      }

      // Calculate averages
      for (const typeUsage of typeMap.values()) {
        typeUsage.averageSize = typeUsage.count > 0 ? typeUsage.totalSize / typeUsage.count : 0;
      }

      return Array.from(typeMap.values()).sort((a, b) => b.totalSize - a.totalSize);
    } catch (error) {
      console.error('Failed to get content type usage:', error);
      return [];
    }
  }

  /**
   * Get storage analytics and performance metrics
   */
  async getStorageAnalytics(): Promise<StorageAnalytics> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const completedDownloads = downloads.filter(item => item.status === 'completed');
      const failedDownloads = downloads.filter(item => item.status === 'failed');

      let totalSize = 0;
      let largestDownload = 0;
      let smallestDownload = Number.MAX_SAFE_INTEGER;

      for (const download of completedDownloads) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(download.localPath);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
            largestDownload = Math.max(largestDownload, fileInfo.size);
            smallestDownload = Math.min(smallestDownload, fileInfo.size);
          }
        } catch (error) {
          console.error('Failed to get file size:', error);
        }
      }

      const averageDownloadSize =
        completedDownloads.length > 0 ? totalSize / completedDownloads.length : 0;
      const downloadSuccessRate =
        downloads.length > 0 ? (completedDownloads.length / downloads.length) * 100 : 0;

      // Calculate storage efficiency (ratio of completed downloads to total attempts)
      const storageEfficiency =
        downloads.length > 0 ? (completedDownloads.length / downloads.length) * 100 : 0;

      // Get cleanup savings from analytics
      const analytics = await this.getStoredAnalytics();
      const cleanupSavings = analytics?.cleanupSavings || 0;
      const lastCleanup = analytics?.lastCleanup || 0;

      return {
        totalDownloads: downloads.length,
        successfulDownloads: completedDownloads.length,
        failedDownloads: failedDownloads.length,
        averageDownloadSize,
        largestDownload,
        smallestDownload: smallestDownload === Number.MAX_SAFE_INTEGER ? 0 : smallestDownload,
        downloadSuccessRate,
        storageEfficiency,
        cleanupSavings,
        lastCleanup,
      };
    } catch (error) {
      console.error('Failed to get storage analytics:', error);
      return {
        totalDownloads: 0,
        successfulDownloads: 0,
        failedDownloads: 0,
        averageDownloadSize: 0,
        largestDownload: 0,
        smallestDownload: 0,
        downloadSuccessRate: 0,
        storageEfficiency: 0,
        cleanupSavings: 0,
        lastCleanup: 0,
      };
    }
  }

  /**
   * Get storage recommendations and optimization suggestions
   */
  async getStorageRecommendations(): Promise<StorageRecommendations> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const completedDownloads = downloads.filter(item => item.status === 'completed');
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      // Analyze old content
      const oldContent = completedDownloads.filter(item => item.updatedAt < thirtyDaysAgo);
      const oldContentSize = await this.calculateContentSize(oldContent);

      // Analyze rarely used content (accessed less than 3 times in last 30 days)
      const rarelyUsedContent = completedDownloads.filter(item => {
        const daysSinceUpdate = (now - item.updatedAt) / (24 * 60 * 60 * 1000);
        return daysSinceUpdate > 30;
      });
      const rarelyUsedSize = await this.calculateContentSize(rarelyUsedContent);

      // Check for potential duplicates (same title, different timestamps)
      const titleGroups = new Map<string, DownloadItem[]>();
      for (const download of completedDownloads) {
        const title = download.title.toLowerCase().trim();
        if (!titleGroups.has(title)) {
          titleGroups.set(title, []);
        }
        titleGroups.get(title)!.push(download);
      }

      const duplicateContent = Array.from(titleGroups.values())
        .filter(group => group.length > 1)
        .flat();
      const duplicateSize = await this.calculateContentSize(duplicateContent);

      // Calculate recommended cleanup size
      const recommendedCleanupSize = oldContentSize + rarelyUsedSize + duplicateSize;

      // Determine if cleanup is recommended
      const shouldCleanup = recommendedCleanupSize > 100 * 1024 * 1024; // 100MB threshold

      // Generate optimization suggestions
      const optimizationSuggestions: string[] = [];

      if (oldContentSize > 50 * 1024 * 1024) {
        // 50MB
        optimizationSuggestions.push('Remove content older than 30 days to free up space');
      }

      if (rarelyUsedSize > 50 * 1024 * 1024) {
        optimizationSuggestions.push('Consider removing rarely accessed content');
      }

      if (duplicateSize > 10 * 1024 * 1024) {
        // 10MB
        optimizationSuggestions.push('Remove duplicate content to optimize storage');
      }

      if (optimizationSuggestions.length === 0) {
        optimizationSuggestions.push('Storage is well optimized. No immediate actions needed.');
      }

      return {
        shouldCleanup,
        recommendedCleanupSize,
        oldContentCount: oldContent.length,
        rarelyUsedContentCount: rarelyUsedContent.length,
        duplicateContentCount: duplicateContent.length,
        optimizationSuggestions,
      };
    } catch (error) {
      console.error('Failed to get storage recommendations:', error);
      return {
        shouldCleanup: false,
        recommendedCleanupSize: 0,
        oldContentCount: 0,
        rarelyUsedContentCount: 0,
        duplicateContentCount: 0,
        optimizationSuggestions: ['Unable to analyze storage. Please try again.'],
      };
    }
  }

  /**
   * Perform intelligent storage cleanup
   */
  async performStorageCleanup(options: CleanupOptions): Promise<{
    removedCount: number;
    freedSpace: number;
    details: string[];
  }> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const completedDownloads = downloads.filter(item => item.status === 'completed');
      const now = Date.now();
      const ageThresholdMs = options.ageThreshold * 24 * 60 * 60 * 1000;

      let removedCount = 0;
      let freedSpace = 0;
      const details: string[] = [];

      // Remove old content
      if (options.removeOldContent) {
        const oldContent = completedDownloads.filter(item => now - item.updatedAt > ageThresholdMs);

        for (const download of oldContent) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(download.localPath);
            if (fileInfo.exists && fileInfo.size) {
              freedSpace += fileInfo.size;
            }
            await offlineDownloadService.cancelDownload(download.id);
            removedCount++;
          } catch (error) {
            console.error('Failed to remove old content:', error);
          }
        }

        if (oldContent.length > 0) {
          details.push(`Removed ${oldContent.length} old items (${this.formatBytes(freedSpace)})`);
        }
      }

      // Remove failed downloads
      if (options.removeFailedDownloads) {
        const failedDownloads = downloads.filter(item => item.status === 'failed');
        for (const download of failedDownloads) {
          try {
            await offlineDownloadService.cancelDownload(download.id);
            removedCount++;
          } catch (error) {
            console.error('Failed to remove failed download:', error);
          }
        }

        if (failedDownloads.length > 0) {
          details.push(`Removed ${failedDownloads.length} failed downloads`);
        }
      }

      // Remove rarely used content
      if (options.removeRarelyUsed) {
        const rarelyUsedContent = completedDownloads.filter(item => {
          const daysSinceUpdate = (now - item.updatedAt) / (24 * 60 * 60 * 1000);
          return daysSinceUpdate > options.ageThreshold;
        });

        for (const download of rarelyUsedContent) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(download.localPath);
            if (fileInfo.exists && fileInfo.size) {
              freedSpace += fileInfo.size;
            }
            await offlineDownloadService.cancelDownload(download.id);
            removedCount++;
          } catch (error) {
            console.error('Failed to remove rarely used content:', error);
          }
        }

        if (rarelyUsedContent.length > 0) {
          details.push(
            `Removed ${rarelyUsedContent.length} rarely used items (${this.formatBytes(freedSpace)})`
          );
        }
      }

      // Update analytics
      await this.updateCleanupAnalytics(freedSpace);

      return {
        removedCount,
        freedSpace,
        details,
      };
    } catch (error) {
      console.error('Failed to perform storage cleanup:', error);
      throw error;
    }
  }

  /**
   * Get storage usage history for trending analysis
   */
  async getStorageUsageHistory(days: number = 30): Promise<
    Array<{
      date: string;
      usedSpace: number;
      downloadCount: number;
    }>
  > {
    try {
      const data = await AsyncStorage.getItem(this.usageHistoryKey);
      if (!data) return [];

      const history = JSON.parse(data);
      const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

      return history
        .filter((entry: any) => entry.timestamp > cutoffDate)
        .map((entry: any) => ({
          date: new Date(entry.timestamp).toLocaleDateString(),
          usedSpace: entry.usedSpace,
          downloadCount: entry.downloadCount,
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Failed to get storage usage history:', error);
      return [];
    }
  }

  /**
   * Track storage usage for analytics
   */
  async trackStorageUsage(): Promise<void> {
    try {
      const usage = await this.getStorageUsage();
      const history = await this.getStorageUsageHistory();

      const newEntry = {
        timestamp: Date.now(),
        usedSpace: usage.usedSpace,
        downloadCount: usage.downloadCount,
      };

      history.push(newEntry);

      // Keep only last 90 days of history
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter((entry: any) => entry.timestamp > ninetyDaysAgo);

      await AsyncStorage.setItem(this.usageHistoryKey, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Failed to track storage usage:', error);
    }
  }

  /**
   * Get storage health score (0-100)
   */
  async getStorageHealthScore(): Promise<number> {
    try {
      const usage = await this.getStorageUsage();
      const analytics = await this.getStorageAnalytics();
      const recommendations = await this.getStorageRecommendations();

      let score = 100;

      // Deduct points for high usage
      if (usage.usagePercentage > 80) {
        score -= 30;
      } else if (usage.usagePercentage > 60) {
        score -= 20;
      } else if (usage.usagePercentage > 40) {
        score -= 10;
      }

      // Deduct points for low success rate
      if (analytics.downloadSuccessRate < 70) {
        score -= 20;
      } else if (analytics.downloadSuccessRate < 85) {
        score -= 10;
      }

      // Deduct points for cleanup recommendations
      if (recommendations.shouldCleanup) {
        score -= 15;
      }

      // Deduct points for many failed downloads
      if (analytics.failedDownloads > 10) {
        score -= 10;
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Failed to calculate storage health score:', error);
      return 50; // Default to middle score on error
    }
  }

  /**
   * Calculate total size of content items
   */
  private async calculateContentSize(downloads: DownloadItem[]): Promise<number> {
    let totalSize = 0;

    for (const download of downloads) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(download.localPath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      } catch (error) {
        console.error('Failed to get file size:', error);
      }
    }

    return totalSize;
  }

  /**
   * Update cleanup analytics
   */
  private async updateCleanupAnalytics(freedSpace: number): Promise<void> {
    try {
      const analytics = await this.getStoredAnalytics();
      const updatedAnalytics = {
        ...analytics,
        cleanupSavings: (analytics?.cleanupSavings || 0) + freedSpace,
        lastCleanup: Date.now(),
      };

      await AsyncStorage.setItem(this.analyticsKey, JSON.stringify(updatedAnalytics));
    } catch (error) {
      console.error('Failed to update cleanup analytics:', error);
    }
  }

  /**
   * Get stored analytics data
   */
  private async getStoredAnalytics(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(this.analyticsKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stored analytics:', error);
      return null;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Cleanup is handled by the offline download service
      // This method is for future cleanup of analytics data if needed
    } catch (error) {
      console.error('Failed to cleanup storage manager:', error);
    }
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();
