import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioPlayerService } from './player';

export interface PlaybackProgress {
  audioUrl: string;
  position: number;
  duration: number;
  progress: number;
  lastPlayedAt: number;
  playCount: number;
  isCompleted: boolean;
}

export interface PlaybackHistory {
  [audioUrl: string]: PlaybackProgress;
}

export interface ResumeOptions {
  threshold: number; // Minimum position to resume from (in seconds)
  maxAge: number; // Maximum age of progress data to resume from (in hours)
}

export class AudioProgressTracker {
  private static instance: AudioProgressTracker;
  private storageKey = '@audio_progress';
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private currentProgress: PlaybackProgress | null = null;
  private updateInterval = 5000; // Update progress every 5 seconds

  private constructor() {}

  static getInstance(): AudioProgressTracker {
    if (!AudioProgressTracker.instance) {
      AudioProgressTracker.instance = new AudioProgressTracker();
    }
    return AudioProgressTracker.instance;
  }

  /**
   * Start tracking progress for current audio
   */
  startTracking(audioUrl: string, duration: number): void {
    this.stopTracking(); // Stop any existing tracking

    // Load existing progress or create new
    this.loadProgress(audioUrl).then(progress => {
      this.currentProgress = progress || {
        audioUrl,
        position: 0,
        duration,
        progress: 0,
        lastPlayedAt: Date.now(),
        playCount: 1,
        isCompleted: false,
      };

      // Start progress updates
      this.startProgressUpdates();
    });
  }

  /**
   * Stop tracking progress
   */
  stopTracking(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }

    // Save final progress before stopping
    if (this.currentProgress) {
      this.saveProgress(this.currentProgress);
      this.currentProgress = null;
    }
  }

  /**
   * Update current progress
   */
  updateProgress(position: number, duration: number): void {
    if (this.currentProgress) {
      this.currentProgress.position = position;
      this.currentProgress.duration = duration;
      this.currentProgress.progress = duration > 0 ? position / duration : 0;
      this.currentProgress.lastPlayedAt = Date.now();
      this.currentProgress.isCompleted = position >= duration - 1000; // Within 1 second of end

      // Update play count if this is a new session
      if (this.currentProgress.position === 0) {
        this.currentProgress.playCount++;
      }
    }
  }

  /**
   * Get progress for specific audio
   */
  async getProgress(audioUrl: string): Promise<PlaybackProgress | null> {
    try {
      const history = await this.getPlaybackHistory();
      return history[audioUrl] || null;
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  /**
   * Check if audio should resume from previous position
   */
  async shouldResume(
    audioUrl: string,
    options: ResumeOptions = { threshold: 10, maxAge: 24 }
  ): Promise<boolean> {
    try {
      const progress = await this.getProgress(audioUrl);
      if (!progress) return false;

      // Check if position is above threshold
      if (progress.position < options.threshold * 1000) return false;

      // Check if progress is not too old
      const ageInHours = (Date.now() - progress.lastPlayedAt) / (1000 * 60 * 60);
      if (ageInHours > options.maxAge) return false;

      // Check if audio wasn't completed
      if (progress.isCompleted) return false;

      return true;
    } catch (error) {
      console.error('Failed to check resume condition:', error);
      return false;
    }
  }

  /**
   * Get resume position for audio
   */
  async getResumePosition(audioUrl: string): Promise<number> {
    try {
      const progress = await this.getProgress(audioUrl);
      return progress?.position || 0;
    } catch (error) {
      console.error('Failed to get resume position:', error);
      return 0;
    }
  }

  /**
   * Mark audio as completed
   */
  async markCompleted(audioUrl: string): Promise<void> {
    try {
      const history = await this.getPlaybackHistory();
      if (history[audioUrl]) {
        history[audioUrl].isCompleted = true;
        history[audioUrl].position = history[audioUrl].duration;
        history[audioUrl].progress = 1;
        history[audioUrl].lastPlayedAt = Date.now();
        await this.savePlaybackHistory(history);
      }
    } catch (error) {
      console.error('Failed to mark audio as completed:', error);
    }
  }

  /**
   * Reset progress for specific audio
   */
  async resetProgress(audioUrl: string): Promise<void> {
    try {
      const history = await this.getPlaybackHistory();
      if (history[audioUrl]) {
        delete history[audioUrl];
        await this.savePlaybackHistory(history);
      }
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }

  /**
   * Get playback history for all audio
   */
  async getPlaybackHistory(): Promise<PlaybackHistory> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get playback history:', error);
      return {};
    }
  }

  /**
   * Clear all playback history
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear playback history:', error);
    }
  }

  /**
   * Get recently played audio
   */
  async getRecentlyPlayed(limit: number = 10): Promise<PlaybackProgress[]> {
    try {
      const history = await this.getPlaybackHistory();
      const sorted = Object.values(history)
        .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
        .slice(0, limit);
      return sorted;
    } catch (error) {
      console.error('Failed to get recently played:', error);
      return [];
    }
  }

  /**
   * Get audio completion statistics
   */
  async getCompletionStats(): Promise<{ total: number; completed: number; inProgress: number }> {
    try {
      const history = await this.getPlaybackHistory();
      const total = Object.keys(history).length;
      const completed = Object.values(history).filter(p => p.isCompleted).length;
      const inProgress = total - completed;

      return { total, completed, inProgress };
    } catch (error) {
      console.error('Failed to get completion stats:', error);
      return { total: 0, completed: 0, inProgress: 0 };
    }
  }

  /**
   * Start periodic progress updates
   */
  private startProgressUpdates(): void {
    this.progressUpdateInterval = setInterval(async () => {
      if (this.currentProgress && audioPlayerService.isAudioLoaded()) {
        try {
          const status = await audioPlayerService.getStatus();
          if (status && status.isLoaded) {
            this.updateProgress(status.position, status.duration);
            await this.saveProgress(this.currentProgress);
          }
        } catch (error) {
          console.error('Failed to update progress:', error);
        }
      }
    }, this.updateInterval);
  }

  /**
   * Load progress for specific audio
   */
  private async loadProgress(audioUrl: string): Promise<PlaybackProgress | null> {
    try {
      const history = await this.getPlaybackHistory();
      return history[audioUrl] || null;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }

  /**
   * Save progress for specific audio
   */
  private async saveProgress(progress: PlaybackProgress): Promise<void> {
    try {
      const history = await this.getPlaybackHistory();
      history[progress.audioUrl] = progress;
      await this.savePlaybackHistory(history);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * Save entire playback history
   */
  private async savePlaybackHistory(history: PlaybackHistory): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save playback history:', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopTracking();
  }
}

// Export singleton instance
export const audioProgressTracker = AudioProgressTracker.getInstance();
