import { useState, useEffect, useCallback } from 'react';
import { audioPlayerService } from './player';
import { audioProgressTracker, PlaybackProgress, ResumeOptions } from './progressTracker';

export interface UseAudioProgressReturn {
  currentProgress: PlaybackProgress | null;
  playbackHistory: { [audioUrl: string]: PlaybackProgress };
  recentlyPlayed: PlaybackProgress[];
  completionStats: { total: number; completed: number; inProgress: number };
  shouldResume: (audioUrl: string, options?: ResumeOptions) => Promise<boolean>;
  getResumePosition: (audioUrl: string) => Promise<number>;
  resetProgress: (audioUrl: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

export const useAudioProgress = (): UseAudioProgressReturn => {
  const [currentProgress, setCurrentProgress] = useState<PlaybackProgress | null>(null);
  const [playbackHistory, setPlaybackHistory] = useState<{ [audioUrl: string]: PlaybackProgress }>({});
  const [recentlyPlayed, setRecentlyPlayed] = useState<PlaybackProgress[]>([]);
  const [completionStats, setCompletionStats] = useState<{ total: number; completed: number; inProgress: number }>({
    total: 0,
    completed: 0,
    inProgress: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load all progress data
  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [history, recent, stats] = await Promise.all([
        audioProgressTracker.getPlaybackHistory(),
        audioProgressTracker.getRecentlyPlayed(),
        audioProgressTracker.getCompletionStats(),
      ]);

      setPlaybackHistory(history);
      setRecentlyPlayed(recent);
      setCompletionStats(stats);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if audio should resume
  const shouldResume = useCallback(async (audioUrl: string, options?: ResumeOptions): Promise<boolean> => {
    try {
      return await audioProgressTracker.shouldResume(audioUrl, options);
    } catch (error) {
      console.error('Failed to check resume condition:', error);
      return false;
    }
  }, []);

  // Get resume position for audio
  const getResumePosition = useCallback(async (audioUrl: string): Promise<number> => {
    try {
      return await audioProgressTracker.getResumePosition(audioUrl);
    } catch (error) {
      console.error('Failed to get resume position:', error);
      return 0;
    }
  }, []);

  // Reset progress for specific audio
  const resetProgress = useCallback(async (audioUrl: string): Promise<void> => {
    try {
      await audioProgressTracker.resetProgress(audioUrl);
      await loadProgressData(); // Refresh data after reset
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }, [loadProgressData]);

  // Clear all playback history
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      await audioProgressTracker.clearHistory();
      await loadProgressData(); // Refresh data after clear
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [loadProgressData]);

  // Refresh all progress data
  const refreshData = useCallback(async (): Promise<void> => {
    await loadProgressData();
  }, [loadProgressData]);

  // Update current progress when audio player state changes
  const updateCurrentProgress = useCallback(async () => {
    try {
      const currentUrl = audioPlayerService.getCurrentAudioUrl();
      if (currentUrl) {
        const progress = await audioProgressTracker.getProgress(currentUrl);
        setCurrentProgress(progress);
      } else {
        setCurrentProgress(null);
      }
    } catch (error) {
      console.error('Failed to update current progress:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Set up periodic refresh of current progress
  useEffect(() => {
    const interval = setInterval(updateCurrentProgress, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateCurrentProgress]);

  return {
    currentProgress,
    playbackHistory,
    recentlyPlayed,
    completionStats,
    shouldResume,
    getResumePosition,
    resetProgress,
    clearHistory,
    refreshData,
    isLoading,
  };
};
