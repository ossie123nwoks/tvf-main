import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { offlineDownloadService, DownloadItem } from './offline';
import { audioQualityManager } from '../audio/qualityManager';
import { ContentService } from '../supabase/content';

export interface SyncItem {
  id: string;
  type: 'download' | 'upload' | 'update' | 'delete';
  contentType: 'sermon' | 'article' | 'audio' | 'image' | 'document';
  contentId: string;
  localPath?: string;
  remoteUrl?: string;
  metadata: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  lastAttempt: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflict';
  errorMessage?: string;
}

export interface SyncProgress {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  inProgressItems: number;
  currentItem?: SyncItem;
  estimatedTimeRemaining: number; // seconds
  bytesTransferred: number;
  totalBytes: number;
}

export interface SyncOptions {
  autoSync: boolean;
  syncOnWifi: boolean;
  syncOnCellular: boolean;
  maxConcurrentSyncs: number;
  retryFailedItems: boolean;
  maxRetryAttempts: number;
  syncInterval: number; // minutes
  priorityOrder: boolean;
  conflictResolution: 'local' | 'remote' | 'manual' | 'newest';
}

export interface SyncConflict {
  syncItem: SyncItem;
  localVersion: any;
  remoteVersion: any;
  conflictType: 'content_mismatch' | 'version_mismatch' | 'deletion_conflict' | 'permission_denied';
  resolution: 'local' | 'remote' | 'manual' | 'newest' | 'unresolved';
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalItemsSynced: number;
  totalBytesTransferred: number;
  averageSyncTime: number; // seconds
  lastSyncTime: number;
  conflictsResolved: number;
  retryAttempts: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private storageKey = '@sync_queue';
  private statsKey = '@sync_stats';
  private optionsKey = '@sync_options';
  private conflictsKey = '@sync_conflicts';

  private syncQueue: SyncItem[] = [];
  private activeSyncs: Set<string> = new Set();
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkListener: (() => void) | null = null;

  private defaultOptions: SyncOptions = {
    autoSync: true,
    syncOnWifi: true,
    syncOnCellular: false,
    maxConcurrentSyncs: 3,
    retryFailedItems: true,
    maxRetryAttempts: 3,
    syncInterval: 30, // 30 minutes
    priorityOrder: true,
    conflictResolution: 'newest',
  };

  private constructor() {
    this.initializeSync();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager
   */
  private async initializeSync(): Promise<void> {
    try {
      // Load saved data
      await this.loadSyncQueue();
      await this.loadSyncStats();
      await this.loadSyncOptions();

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Set up periodic sync
      this.setupPeriodicSync();

      // Start initial sync if auto-sync is enabled
      if (this.defaultOptions.autoSync) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
    }
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    this.networkListener = NetInfo.addEventListener(state => {
      if (state.isConnected && this.defaultOptions.autoSync) {
        // Check if we should sync based on connection type
        if (
          (state.type === 'wifi' && this.defaultOptions.syncOnWifi) ||
          (state.type === 'cellular' && this.defaultOptions.syncOnCellular)
        ) {
          // First, sync offline content that was downloaded while offline
          this.syncOfflineContent();

          // Then check for content updates
          this.checkForContentUpdates();

          // Finally, start the regular sync process
          this.startSync();
        }
      }
    });
  }

  /**
   * Set up periodic sync
   */
  private setupPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(
      () => {
        if (this.defaultOptions.autoSync) {
          this.startSync();
        }
      },
      this.defaultOptions.syncInterval * 60 * 1000
    );
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    syncItem: Omit<SyncItem, 'id' | 'createdAt' | 'lastAttempt' | 'status' | 'retryCount'>
  ): Promise<string> {
    try {
      const item: SyncItem = {
        ...syncItem,
        id: this.generateSyncId(),
        createdAt: Date.now(),
        lastAttempt: 0,
        status: 'pending',
        retryCount: 0,
      };

      this.syncQueue.push(item);
      await this.saveSyncQueue();

      // Start sync if auto-sync is enabled
      if (this.defaultOptions.autoSync && !this.syncInProgress) {
        this.startSync();
      }

      return item.id;
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
      throw error;
    }
  }

  /**
   * Add offline content to sync queue for synchronization
   */
  async addOfflineContentToSync(
    contentType: 'sermon' | 'article' | 'audio' | 'image' | 'document',
    contentId: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    try {
      // Check if content is already in sync queue
      const existingItem = this.syncQueue.find(
        item => item.contentType === contentType && item.contentId === contentId
      );

      if (existingItem) {
        // Update priority if different
        if (existingItem.priority !== priority) {
          existingItem.priority = priority;
          await this.saveSyncQueue();
        }
        return existingItem.id;
      }

      // Add new sync item for offline content
      return await this.addToSyncQueue({
        type: 'download',
        contentType,
        contentId,
        priority,
        maxRetries: 3,
        metadata: {
          syncReason: 'offline_content_sync',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Failed to add offline content to sync:', error);
      throw error;
    }
  }

  /**
   * Sync all offline content when coming back online
   */
  async syncOfflineContent(): Promise<void> {
    try {
      // Get all completed offline downloads that need syncing
      const completedDownloads = offlineDownloadService.getCompletedDownloads();

      for (const download of completedDownloads) {
        // Add to sync queue for metadata updates
        await this.addOfflineContentToSync(
          download.type as any,
          download.id,
          'low' // Low priority for background sync
        );
      }

      // Start sync if not already running
      if (!this.syncInProgress) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to sync offline content:', error);
    }
  }

  /**
   * Check for content updates and add to sync queue
   */
  async checkForContentUpdates(): Promise<void> {
    try {
      // This would typically check with the server for content updates
      // For now, we'll add a placeholder sync item
      const updateItem = await this.addToSyncQueue({
        type: 'update',
        contentType: 'sermon',
        contentId: 'content_update_check',
        priority: 'low',
        maxRetries: 2,
        metadata: {
          syncReason: 'content_update_check',
          timestamp: Date.now(),
        },
      });

      console.log('Added content update check to sync queue:', updateItem);
    } catch (error) {
      console.error('Failed to check for content updates:', error);
    }
  }

  /**
   * Start sync process
   */
  async startSync(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    try {
      this.syncInProgress = true;

      // Sort queue by priority and creation time
      if (this.defaultOptions.priorityOrder) {
        this.syncQueue.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.createdAt - b.createdAt;
        });
      }

      // Process sync items
      await this.processSyncQueue();
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    const pendingItems = this.syncQueue.filter(
      item =>
        item.status === 'pending' ||
        (item.status === 'failed' &&
          this.defaultOptions.retryFailedItems &&
          item.retryCount < this.defaultOptions.maxRetryAttempts)
    );

    if (pendingItems.length === 0) return;

    // Process items with concurrency limit
    const chunks = this.chunkArray(pendingItems, this.defaultOptions.maxConcurrentSyncs);

    for (const chunk of chunks) {
      const promises = chunk.map(item => this.processSyncItem(item));
      await Promise.allSettled(promises);
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncItem): Promise<void> {
    if (this.activeSyncs.has(item.id)) return;

    try {
      this.activeSyncs.add(item.id);
      item.status = 'in_progress';
      item.lastAttempt = Date.now();

      await this.saveSyncQueue();

      switch (item.type) {
        case 'download':
          await this.syncDownload(item);
          break;
        case 'upload':
          await this.syncUpload(item);
          break;
        case 'update':
          await this.syncUpdate(item);
          break;
        case 'delete':
          await this.syncDelete(item);
          break;
      }

      item.status = 'completed';
      await this.updateSyncStats('success');
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);

      item.status = 'failed';
      item.retryCount++;
      item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.updateSyncStats('failure');

      // Handle conflicts
      if (this.isConflictError(error)) {
        await this.handleSyncConflict(item, error);
      }
    } finally {
      this.activeSyncs.delete(item.id);
      await this.saveSyncQueue();
    }
  }

  /**
   * Sync download item
   */
  private async syncDownload(item: SyncItem): Promise<void> {
    try {
      // Check if content exists remotely
      const remoteContent = await this.getRemoteContent(item.contentType, item.contentId);
      if (!remoteContent) {
        throw new Error('Remote content not found');
      }

      // Check if this is an offline content sync
      if (item.metadata?.syncReason === 'offline_content_sync') {
        // For offline content sync, we just need to update metadata
        // The content is already downloaded locally
        await this.updateOfflineContentMetadata(item.contentType, item.contentId, remoteContent);
        return;
      }

      // Get recommended quality for download
      const duration = remoteContent.duration || 0;
      const recommendation = await audioQualityManager.getRecommendedQuality(
        item.remoteUrl || '',
        duration
      );

      // Add to offline download service
      await offlineDownloadService.addDownload(
        item.contentType === 'sermon' ? 'audio' : item.contentType as 'audio' | 'article' | 'image' | 'document',
        remoteContent.title || 'Unknown',
        recommendation.recommendedQuality.url,
        {
          ...item.metadata,
          quality: recommendation.recommendedQuality.id,
          originalUrl: item.remoteUrl,
        }
      );
    } catch (error) {
      throw new Error(
        `Download sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update metadata for offline content
   */
  private async updateOfflineContentMetadata(
    contentType: string,
    contentId: string,
    remoteContent: any
  ): Promise<void> {
    try {
      // Update local metadata with remote information
      // This ensures offline content has the latest metadata
      const offlineDownload = offlineDownloadService.getDownloadByContentId(contentId);

      if (offlineDownload) {
        // Update metadata with remote content information
        offlineDownload.metadata = {
          ...offlineDownload.metadata,
          lastSynced: Date.now(),
          remoteTitle: remoteContent.title,
          remoteDescription: remoteContent.description,
          remoteUpdatedAt: remoteContent.updatedAt,
          remoteVersion: remoteContent.version,
        };

        // Save updated download information
        await offlineDownloadService.saveDownloads();
      }
    } catch (error) {
      console.error('Failed to update offline content metadata:', error);
    }
  }

  /**
   * Sync upload item
   */
  private async syncUpload(item: SyncItem): Promise<void> {
    try {
      // Check if local file exists
      if (!item.localPath) {
        throw new Error('Local file path not specified');
      }

      // Upload content to remote server
      const uploadResult = await this.uploadContentToRemote(
        item.contentType,
        item.contentId,
        item.localPath,
        item.metadata
      );

      // Update local metadata with remote information
      if (uploadResult.remoteUrl) {
        item.remoteUrl = uploadResult.remoteUrl;
      }
    } catch (error) {
      throw new Error(
        `Upload sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync update item
   */
  private async syncUpdate(item: SyncItem): Promise<void> {
    try {
      // Update remote content
      await this.updateRemoteContent(item.contentType, item.contentId, item.metadata);
    } catch (error) {
      throw new Error(
        `Update sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync delete item
   */
  private async syncDelete(item: SyncItem): Promise<void> {
    try {
      // Delete from remote server
      await this.deleteRemoteContent(item.contentType, item.contentId);

      // Remove from local storage if exists
      if (item.localPath) {
        await offlineDownloadService.cancelDownload(item.id);
      }
    } catch (error) {
      throw new Error(
        `Delete sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleSyncConflict(item: SyncItem, error: any): Promise<void> {
    try {
      const conflict: SyncConflict = {
        syncItem: item,
        localVersion: item.metadata,
        remoteVersion: await this.getRemoteContent(item.contentType, item.contentId),
        conflictType: this.determineConflictType(error),
        resolution: 'unresolved',
      };

      // Apply automatic resolution if configured
      if (this.defaultOptions.conflictResolution !== 'manual') {
        conflict.resolution = this.resolveConflict(conflict);
        conflict.resolvedAt = Date.now();
        conflict.resolvedBy = 'auto';

        // Retry sync with resolved conflict
        item.status = 'pending';
        item.retryCount = 0;
        item.errorMessage = undefined;
      }

      // Save conflict for manual resolution if needed
      await this.saveSyncConflict(conflict);
    } catch (conflictError) {
      console.error('Failed to handle sync conflict:', conflictError);
    }
  }

  /**
   * Determine conflict type from error
   */
  private determineConflictType(error: any): SyncConflict['conflictType'] {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('version')) return 'version_mismatch';
    if (errorMessage.includes('content')) return 'content_mismatch';
    if (errorMessage.includes('delete')) return 'deletion_conflict';
    if (errorMessage.includes('permission')) return 'permission_denied';

    return 'content_mismatch';
  }

  /**
   * Resolve conflict automatically
   */
  private resolveConflict(conflict: SyncConflict): SyncConflict['resolution'] {
    switch (this.defaultOptions.conflictResolution) {
      case 'local':
        return 'local';
      case 'remote':
        return 'remote';
      case 'newest':
        const localTime = conflict.localVersion?.updatedAt || 0;
        const remoteTime = conflict.remoteVersion?.updatedAt || 0;
        return localTime > remoteTime ? 'local' : 'remote';
      default:
        return 'manual';
    }
  }

  /**
   * Get sync progress
   */
  getSyncProgress(): SyncProgress {
    const totalItems = this.syncQueue.length;
    const completedItems = this.syncQueue.filter(item => item.status === 'completed').length;
    const failedItems = this.syncQueue.filter(item => item.status === 'failed').length;
    const inProgressItems = this.activeSyncs.size;
    const currentItem = this.syncQueue.find(item => this.activeSyncs.has(item.id));

    // Calculate estimated time remaining
    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining();

    // Calculate bytes transferred
    const bytesTransferred = this.calculateBytesTransferred();
    const totalBytes = this.calculateTotalBytes();

    return {
      totalItems,
      completedItems,
      failedItems,
      inProgressItems,
      currentItem,
      estimatedTimeRemaining,
      bytesTransferred,
      totalBytes,
    };
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    try {
      const data = await AsyncStorage.getItem(this.statsKey);
      return data ? JSON.parse(data) : this.getDefaultSyncStats();
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return this.getDefaultSyncStats();
    }
  }

  /**
   * Get sync options
   */
  async getSyncOptions(): Promise<SyncOptions> {
    try {
      const data = await AsyncStorage.getItem(this.optionsKey);
      if (data) {
        const stored = JSON.parse(data);
        return { ...this.defaultOptions, ...stored };
      }
      return { ...this.defaultOptions };
    } catch (error) {
      console.error('Failed to get sync options:', error);
      return { ...this.defaultOptions };
    }
  }

  /**
   * Update sync options
   */
  async updateSyncOptions(options: Partial<SyncOptions>): Promise<void> {
    try {
      const current = await this.getSyncOptions();
      const updated = { ...current, ...options };
      await AsyncStorage.setItem(this.optionsKey, JSON.stringify(updated));

      // Update local options
      Object.assign(this.defaultOptions, updated);

      // Reconfigure sync if needed
      this.setupPeriodicSync();
    } catch (error) {
      console.error('Failed to update sync options:', error);
    }
  }

  /**
   * Get sync conflicts
   */
  async getSyncConflicts(): Promise<SyncConflict[]> {
    try {
      const data = await AsyncStorage.getItem(this.conflictsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get sync conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve sync conflict manually
   */
  async resolveSyncConflict(
    conflictId: string,
    resolution: SyncConflict['resolution']
  ): Promise<void> {
    try {
      const conflicts = await this.getSyncConflicts();
      const conflict = conflicts.find(c => c.syncItem.id === conflictId);

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      conflict.resolution = resolution;
      conflict.resolvedAt = Date.now();
      conflict.resolvedBy = 'manual';

      // Update conflict in storage
      await this.saveSyncConflicts(conflicts);

      // Retry sync with resolved conflict
      const syncItem = conflict.syncItem;
      syncItem.status = 'pending';
      syncItem.retryCount = 0;
      syncItem.errorMessage = undefined;

      await this.saveSyncQueue();

      // Start sync if not already running
      if (!this.syncInProgress) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to resolve sync conflict:', error);
      throw error;
    }
  }

  /**
   * Clear completed sync items
   */
  async clearCompletedSyncs(): Promise<void> {
    try {
      this.syncQueue = this.syncQueue.filter(item => item.status !== 'completed');
      await this.saveSyncQueue();
    } catch (error) {
      console.error('Failed to clear completed syncs:', error);
    }
  }

  /**
   * Retry failed sync items
   */
  async retryFailedSyncs(): Promise<void> {
    try {
      const failedItems = this.syncQueue.filter(item => item.status === 'failed');

      for (const item of failedItems) {
        item.status = 'pending';
        item.retryCount = 0;
        item.errorMessage = undefined;
      }

      await this.saveSyncQueue();

      // Start sync if not already running
      if (!this.syncInProgress) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to retry failed syncs:', error);
    }
  }

  /**
   * Pause sync
   */
  pauseSync(): void {
    this.syncInProgress = false;
  }

  /**
   * Resume sync
   */
  resumeSync(): void {
    if (!this.syncInProgress && this.syncQueue.length > 0) {
      this.startSync();
    }
  }

  /**
   * Manually trigger offline content synchronization
   */
  async triggerOfflineContentSync(): Promise<void> {
    try {
      console.log('Triggering offline content synchronization...');
      await this.syncOfflineContent();
    } catch (error) {
      console.error('Failed to trigger offline content sync:', error);
      throw error;
    }
  }

  /**
   * Get sync status summary
   */
  getSyncStatusSummary(): {
    totalItems: number;
    pendingItems: number;
    inProgressItems: number;
    completedItems: number;
    failedItems: number;
    offlineContentCount: number;
    lastSyncTime: number;
  } {
    const totalItems = this.syncQueue.length;
    const pendingItems = this.syncQueue.filter(item => item.status === 'pending').length;
    const inProgressItems = this.activeSyncs.size;
    const completedItems = this.syncQueue.filter(item => item.status === 'completed').length;
    const failedItems = this.syncQueue.filter(item => item.status === 'failed').length;

    // Get offline content count
    const offlineContentCount = offlineDownloadService.getCompletedDownloads().length;

    return {
      totalItems,
      pendingItems,
      inProgressItems,
      completedItems,
      failedItems,
      offlineContentCount,
      lastSyncTime: Date.now(),
    };
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): SyncItem[] {
    return [...this.syncQueue];
  }

  /**
   * Get active syncs
   */
  getActiveSyncs(): string[] {
    return Array.from(this.activeSyncs);
  }

  // Private helper methods

  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      this.syncQueue = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private async loadSyncStats(): Promise<void> {
    // Stats are loaded on demand
  }

  private async loadSyncOptions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.optionsKey);
      if (data) {
        const stored = JSON.parse(data);
        Object.assign(this.defaultOptions, stored);
      }
    } catch (error) {
      console.error('Failed to load sync options:', error);
    }
  }

  private async saveSyncConflict(conflict: SyncConflict): Promise<void> {
    try {
      const conflicts = await this.getSyncConflicts();
      conflicts.push(conflict);
      await this.saveSyncConflicts(conflicts);
    } catch (error) {
      console.error('Failed to save sync conflict:', error);
    }
  }

  private async saveSyncConflicts(conflicts: SyncConflict[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.conflictsKey, JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to save sync conflicts:', error);
    }
  }

  private async updateSyncStats(result: 'success' | 'failure'): Promise<void> {
    try {
      const stats = await this.getSyncStats();

      if (result === 'success') {
        stats.successfulSyncs++;
        stats.totalItemsSynced++;
      } else {
        stats.failedSyncs++;
        stats.retryAttempts++;
      }

      stats.totalSyncs++;
      stats.lastSyncTime = Date.now();

      await AsyncStorage.setItem(this.statsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to update sync stats:', error);
    }
  }

  private getDefaultSyncStats(): SyncStats {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalItemsSynced: 0,
      totalBytesTransferred: 0,
      averageSyncTime: 0,
      lastSyncTime: 0,
      conflictsResolved: 0,
      retryAttempts: 0,
    };
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private calculateEstimatedTimeRemaining(): number {
    // Simple estimation based on completed vs remaining items
    const completedItems = this.syncQueue.filter(item => item.status === 'completed').length;
    const remainingItems = this.syncQueue.length - completedItems;

    if (remainingItems === 0) return 0;

    // Assume average 5 seconds per item
    return remainingItems * 5;
  }

  private calculateBytesTransferred(): number {
    // Calculate based on completed downloads
    const completedDownloads = this.syncQueue.filter(
      item => item.type === 'download' && item.status === 'completed'
    );

    return completedDownloads.reduce((total, item) => {
      return total + (item.metadata?.fileSize || 0);
    }, 0);
  }

  private calculateTotalBytes(): number {
    // Calculate total bytes for all pending and in-progress items
    return this.syncQueue.reduce((total, item) => {
      if (item.status === 'pending' || item.status === 'in_progress') {
        return total + (item.metadata?.fileSize || 0);
      }
      return total;
    }, 0);
  }

  private isConflictError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      errorMessage.includes('conflict') ||
      errorMessage.includes('version') ||
      errorMessage.includes('already exists') ||
      errorMessage.includes('permission denied')
    );
  }

  // Placeholder methods for remote operations
  private async getRemoteContent(contentType: string, contentId: string): Promise<any> {
          // This would integrate with your content service
      try {
        if (contentType === 'sermon') {
          return await ContentService.getSermonById(contentId);
        } else if (contentType === 'article') {
          return await ContentService.getArticleById(contentId);
        } else {
          console.error('Unsupported content type:', contentType);
          return null;
        }
      } catch (error) {
        console.error('Failed to get remote content:', error);
        return null;
      }
  }

  private async uploadContentToRemote(
    contentType: string,
    contentId: string,
    localPath: string,
    metadata: any
  ): Promise<any> {
    // This would integrate with your upload service
    // For now, return a mock result
    return {
      remoteUrl: `https://example.com/${contentType}/${contentId}`,
      success: true,
    };
  }

  private async updateRemoteContent(
    contentType: string,
    contentId: string,
    metadata: any
  ): Promise<void> {
    // This would integrate with your update service
    // For now, just log the operation
    console.log(`Updating remote ${contentType} ${contentId} with metadata:`, metadata);
  }

  private async deleteRemoteContent(contentType: string, contentId: string): Promise<void> {
    // This would integrate with your delete service
    // For now, just log the operation
    console.log(`Deleting remote ${contentType} ${contentId}`);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      if (this.networkListener) {
        this.networkListener();
        this.networkListener = null;
      }

      this.syncInProgress = false;
      this.activeSyncs.clear();
    } catch (error) {
      console.error('Failed to cleanup sync manager:', error);
    }
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
