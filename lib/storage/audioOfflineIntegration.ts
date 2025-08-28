import { offlineDownloadService } from './offline';
import { audioPlayerService } from '../audio/player';

export interface AudioOfflineIntegration {
  /**
   * Check if audio is available offline and switch to offline mode if possible
   */
  switchToOfflineIfAvailable: (audioUrl: string) => Promise<boolean>;

  /**
   * Download audio for offline playback
   */
  downloadAudioForOffline: (
    title: string,
    audioUrl: string,
    metadata?: Record<string, any>
  ) => Promise<string>;

  /**
   * Check if audio is currently playing from offline storage
   */
  isPlayingOffline: () => boolean;

  /**
   * Get current offline audio path
   */
  getCurrentOfflinePath: () => string | null;

  /**
   * Switch back to online audio if offline version is not available
   */
  switchToOnlineIfNeeded: (originalUrl: string) => Promise<boolean>;
}

export class AudioOfflineIntegrationService implements AudioOfflineIntegration {
  private currentOfflinePath: string | null = null;
  private originalAudioUrl: string | null = null;

  /**
   * Check if audio is available offline and switch to offline mode if possible
   */
  async switchToOfflineIfAvailable(audioUrl: string): Promise<boolean> {
    try {
      // Check if we have an offline version
      const offlinePath = await offlineDownloadService.getOfflinePath(audioUrl);

      if (offlinePath) {
        // Store the original URL for potential fallback
        this.originalAudioUrl = audioUrl;
        this.currentOfflinePath = offlinePath;

        // Load the offline audio
        await audioPlayerService.loadAudio(offlinePath);
        console.log('Switched to offline audio:', offlinePath);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to switch to offline audio:', error);
      return false;
    }
  }

  /**
   * Download audio for offline playback
   */
  async downloadAudioForOffline(
    title: string,
    audioUrl: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Check if already downloaded
      const isAvailable = await offlineDownloadService.isAvailableOffline(audioUrl);
      if (isAvailable) {
        console.log('Audio already available offline:', title);
        return 'already_downloaded';
      }

      // Add to download queue
      const downloadId = await offlineDownloadService.addDownload(
        'audio',
        title,
        audioUrl,
        metadata
      );
      console.log('Started downloading audio for offline:', title, downloadId);

      return downloadId;
    } catch (error) {
      console.error('Failed to download audio for offline:', error);
      throw error;
    }
  }

  /**
   * Check if audio is currently playing from offline storage
   */
  isPlayingOffline(): boolean {
    return this.currentOfflinePath !== null;
  }

  /**
   * Get current offline audio path
   */
  getCurrentOfflinePath(): string | null {
    return this.currentOfflinePath;
  }

  /**
   * Switch back to online audio if offline version is not available
   */
  async switchToOnlineIfNeeded(originalUrl: string): Promise<boolean> {
    try {
      // If we're not currently playing offline, no need to switch
      if (!this.isPlayingOffline()) {
        return false;
      }

      // Check if offline file still exists
      const offlinePath = this.currentOfflinePath;
      if (!offlinePath) {
        return false;
      }

      // Try to load the original online URL
      await audioPlayerService.loadAudio(originalUrl);

      // Clear offline state
      this.currentOfflinePath = null;
      this.originalAudioUrl = null;

      console.log('Switched back to online audio:', originalUrl);
      return true;
    } catch (error) {
      console.error('Failed to switch to online audio:', error);
      return false;
    }
  }

  /**
   * Get download status for audio
   */
  async getAudioDownloadStatus(audioUrl: string): Promise<{
    isDownloaded: boolean;
    isDownloading: boolean;
    downloadProgress?: number;
    localPath?: string;
  }> {
    try {
      const isDownloaded = await offlineDownloadService.isAvailableOffline(audioUrl);

      if (isDownloaded) {
        const localPath = await offlineDownloadService.getOfflinePath(audioUrl);
        return {
          isDownloaded: true,
          isDownloading: false,
          localPath: localPath || undefined,
        };
      }

      // Check if it's currently downloading
      const downloads = offlineDownloadService.getAllDownloads();
      const audioDownload = downloads.find(d => d.url === audioUrl && d.type === 'audio');

      if (audioDownload && audioDownload.status === 'downloading') {
        return {
          isDownloaded: false,
          isDownloading: true,
          downloadProgress: audioDownload.progress,
        };
      }

      return {
        isDownloaded: false,
        isDownloading: false,
      };
    } catch (error) {
      console.error('Failed to get audio download status:', error);
      return {
        isDownloaded: false,
        isDownloading: false,
      };
    }
  }

  /**
   * Remove offline audio file
   */
  async removeOfflineAudio(audioUrl: string): Promise<boolean> {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const audioDownload = downloads.find(d => d.url === audioUrl && d.type === 'audio');

      if (audioDownload) {
        await offlineDownloadService.cancelDownload(audioDownload.id);

        // If this was the currently playing offline audio, switch to online
        if (this.currentOfflinePath === audioDownload.localPath) {
          await this.switchToOnlineIfNeeded(audioUrl);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to remove offline audio:', error);
      return false;
    }
  }

  /**
   * Get all offline audio files
   */
  async getOfflineAudioFiles(): Promise<
    Array<{
      title: string;
      url: string;
      localPath: string;
      size: number;
      downloadedAt: number;
    }>
  > {
    try {
      const downloads = offlineDownloadService.getAllDownloads();
      const audioDownloads = downloads.filter(d => d.type === 'audio' && d.status === 'completed');

      return audioDownloads.map(download => ({
        title: download.title,
        url: download.url,
        localPath: download.localPath,
        size: download.size,
        downloadedAt: download.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to get offline audio files:', error);
      return [];
    }
  }

  /**
   * Clean up offline audio integration
   */
  cleanup(): void {
    this.currentOfflinePath = null;
    this.originalAudioUrl = null;
  }
}

// Export singleton instance
export const audioOfflineIntegration = new AudioOfflineIntegrationService();
