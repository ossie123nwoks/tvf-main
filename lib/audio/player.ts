import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { backgroundAudioService } from './backgroundPlayback';
import { audioProgressTracker } from './progressTracker';

export interface AudioPlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  position: number;
  duration: number;
  progress: number;
  error: string | null;
}

export interface AudioPlayerCallbacks {
  onPlaybackStatusUpdate?: (status: AudioPlayerState) => void;
  onPlaybackFinished?: () => void;
  onError?: (error: string) => void;
  onBufferingStart?: () => void;
  onBufferingEnd?: () => void;
}

export class AudioPlayerService {
  private sound: Audio.Sound | null = null;
  private callbacks: AudioPlayerCallbacks = {};
  private currentAudioUrl: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the audio player service
   */
  async initialize(): Promise<void> {
    try {
      // Configure background audio session
      await backgroundAudioService.configureAudioSession();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio player:', error);
      throw error;
    }
  }

  /**
   * Load audio from URL
   */
  async loadAudio(audioUrl: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Unload previous audio if exists
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create new audio sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentAudioUrl = audioUrl;

      // Get initial duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const duration = status.durationMillis || 0;
        
        // Start progress tracking
        audioProgressTracker.startTracking(audioUrl, duration);

        // Check if we should resume from previous position
        const shouldResume = await audioProgressTracker.shouldResume(audioUrl);
        if (shouldResume) {
          const resumePosition = await audioProgressTracker.getResumePosition(audioUrl);
          await this.seekTo(resumePosition);
        }

        this.callbacks.onPlaybackStatusUpdate?.({
          isPlaying: false,
          isBuffering: false,
          isLoaded: true,
          position: shouldResume ? await audioProgressTracker.getResumePosition(audioUrl) : 0,
          duration,
          progress: shouldResume ? (await audioProgressTracker.getResumePosition(audioUrl)) / duration : 0,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to load audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  async pause(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.pauseAsync();
    } catch (error) {
      console.error('Failed to pause audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Stop audio and reset position
   */
  async stop(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
    } catch (error) {
      console.error('Failed to stop audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Seek to specific position
   */
  async seekTo(position: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.setPositionAsync(position);
    } catch (error) {
      console.error('Failed to seek audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to seek audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Skip forward or backward by seconds
   */
  async skip(seconds: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.positionMillis !== null) {
        const newPosition = Math.max(0, status.positionMillis + (seconds * 1000));
        await this.sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip audio';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Set playback rate
   */
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.setRateAsync(rate, true);
    } catch (error) {
      console.error('Failed to set playback rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set playback rate';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('Failed to set volume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set volume';
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Get current playback status
   */
  async getStatus(): Promise<AudioPlayerState | null> {
    if (!this.sound) {
      return null;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const position = status.positionMillis || 0;
        const duration = status.durationMillis || 0;
        const progress = duration > 0 ? position / duration : 0;

        return {
          isPlaying: status.isPlaying || false,
          isBuffering: status.isBuffering || false,
          isLoaded: true,
          position,
          duration,
          progress,
          error: null,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get audio status:', error);
      return null;
    }
  }

  /**
   * Check if audio is currently loaded
   */
  isAudioLoaded(): boolean {
    return this.sound !== null && this.currentAudioUrl !== null;
  }

  /**
   * Get current audio URL
   */
  getCurrentAudioUrl(): string | null {
    return this.currentAudioUrl;
  }

  /**
   * Set callbacks for audio events
   */
  setCallbacks(callbacks: AudioPlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Handle playback status updates
   */
  private onPlaybackStatusUpdate(status: any): void {
    if (status.isLoaded) {
      const position = status.positionMillis || 0;
      const duration = status.durationMillis || 0;
      const progress = duration > 0 ? position / duration : 0;

      // Update progress tracking
      if (this.currentAudioUrl) {
        audioProgressTracker.updateProgress(position, duration);
      }

      const playerState: AudioPlayerState = {
        isPlaying: status.isPlaying || false,
        isBuffering: status.isBuffering || false,
        isLoaded: true,
        position,
        duration,
        progress,
        error: null,
      };

      // Handle buffering events
      if (status.isBuffering && !this.lastBufferingState) {
        this.callbacks.onBufferingStart?.();
      } else if (!status.isBuffering && this.lastBufferingState) {
        this.callbacks.onBufferingEnd?.();
      }
      this.lastBufferingState = status.isBuffering;

      // Handle playback finished
      if (status.didJustFinish) {
        if (this.currentAudioUrl) {
          audioProgressTracker.markCompleted(this.currentAudioUrl);
        }
        this.callbacks.onPlaybackFinished?.();
      }

      this.callbacks.onPlaybackStatusUpdate?.(playerState);
    } else if (status.error) {
      const errorMessage = status.error || 'Audio playback error';
      this.callbacks.onError?.(errorMessage);
    }
  }

  private lastBufferingState = false;

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      // Stop progress tracking
      if (this.currentAudioUrl) {
        audioProgressTracker.stopTracking();
      }
      
      this.currentAudioUrl = null;
      this.isInitialized = false;
      
      // Clean up background audio service
      await backgroundAudioService.cleanup();
    } catch (error) {
      console.error('Failed to cleanup audio player:', error);
    }
  }

  /**
   * Resume playback after interruption
   */
  async resumeAfterInterruption(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Failed to resume after interruption:', error);
    }
  }

  /**
   * Handle audio interruptions
   */
  async handleInterruption(interruption: Audio.InterruptionStatus): Promise<void> {
    await backgroundAudioService.handleInterruption(interruption);
  }

  /**
   * Handle audio focus changes (Android)
   */
  async handleAudioFocusChange(focusChange: Audio.AudioFocusChange): Promise<void> {
    await backgroundAudioService.handleAudioFocusChange(focusChange);
  }

  /**
   * Get progress for current audio
   */
  async getProgress(): Promise<any> {
    if (!this.currentAudioUrl) return null;
    return await audioProgressTracker.getProgress(this.currentAudioUrl);
  }

  /**
   * Reset progress for current audio
   */
  async resetProgress(): Promise<void> {
    if (!this.currentAudioUrl) return;
    await audioProgressTracker.resetProgress(this.currentAudioUrl);
  }

  /**
   * Get playback history
   */
  async getPlaybackHistory(): Promise<any> {
    return await audioProgressTracker.getPlaybackHistory();
  }

  /**
   * Get recently played audio
   */
  async getRecentlyPlayed(limit: number = 10): Promise<any[]> {
    return await audioProgressTracker.getRecentlyPlayed(limit);
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(): Promise<any> {
    return await audioProgressTracker.getCompletionStats();
  }
}

// Create singleton instance
export const audioPlayerService = new AudioPlayerService();
