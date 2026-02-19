import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Platform } from 'react-native';
import { audioPlayerService } from './player';

export interface BackgroundAudioConfig {
  allowsRecordingIOS: boolean;
  staysActiveInBackground: boolean;
  interruptionModeIOS: InterruptionModeIOS;
  interruptionModeAndroid: InterruptionModeAndroid;
  shouldDuckAndroid: boolean;
  playThroughEarpieceAndroid: boolean;
}

export class BackgroundAudioService {
  private static instance: BackgroundAudioService;
  private isConfigured = false;
  private audioSession: Audio.SoundObject | null = null;

  private constructor() { }

  static getInstance(): BackgroundAudioService {
    if (!BackgroundAudioService.instance) {
      BackgroundAudioService.instance = new BackgroundAudioService();
    }
    return BackgroundAudioService.instance;
  }

  /**
   * Configure audio session for background playback
   */
  async configureAudioSession(config?: Partial<BackgroundAudioConfig>): Promise<void> {
    try {
      const defaultConfig: BackgroundAudioConfig = {
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        ...config,
      };

      // Request audio permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: defaultConfig.allowsRecordingIOS,
        staysActiveInBackground: defaultConfig.staysActiveInBackground,
        interruptionModeIOS: defaultConfig.interruptionModeIOS,
        interruptionModeAndroid: defaultConfig.interruptionModeAndroid,
        shouldDuckAndroid: defaultConfig.shouldDuckAndroid,
        playThroughEarpieceAndroid: defaultConfig.playThroughEarpieceAndroid,
      });

      // Set up audio session for iOS
      if (Platform.OS === 'ios') {
        this.audioSession = await Audio.Sound.createAsync(
          {
            uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
          },
          { shouldPlay: false }
        );

        // Configure audio session properties
        await this.audioSession.sound.setStatusAsync({
          progressUpdateIntervalMillis: 100,
          shouldPlay: false,
        });
      }

      this.isConfigured = true;
      console.log('Background audio session configured successfully');
    } catch (error) {
      console.error('Failed to configure background audio session:', error);
      throw error;
    }
  }

  /**
   * Handle audio interruptions (phone calls, notifications, etc.)
   */
  async handleInterruption(interruption: any): Promise<void> {
    try {
      if (interruption.shouldPlay) {
        // Resume playback after interruption
        const status = await audioPlayerService.getStatus();
        if (status && !status.isPlaying) {
          await audioPlayerService.play();
        }
      } else {
        // Pause playback during interruption
        const status = await audioPlayerService.getStatus();
        if (status && status.isPlaying) {
          await audioPlayerService.pause();
        }
      }
    } catch (error) {
      console.error('Error handling audio interruption:', error);
    }
  }

  /**
   * Handle audio focus changes on Android
   */
  async handleAudioFocusChange(focusChange: any): Promise<void> {
    try {
      const status = await audioPlayerService.getStatus();
      if (focusChange === 'gain') {
        // Audio focus gained, resume playback
        if (status && !status.isPlaying) {
          await audioPlayerService.play();
        }
      } else if (focusChange === 'loss' || focusChange === 'loss_transient') {
        // Audio focus lost, pause playback
        if (status && status.isPlaying) {
          await audioPlayerService.pause();
        }
      } else if (focusChange === 'loss_transient_can_duck') {
        // Lower volume temporarily
        await audioPlayerService.setVolume(0.3);
      }
    } catch (error) {
      console.error('Error handling audio focus change:', error);
    }
  }

  /**
   * Configure audio session for different playback scenarios
   */
  async configureForPlayback(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to configure audio for playback:', error);
    }
  }

  /**
   * Configure audio session for voice calls
   */
  async configureForVoiceCall(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
      });
    } catch (error) {
      console.error('Failed to configure audio for voice call:', error);
    }
  }

  /**
   * Reset audio session to default state
   */
  async resetAudioSession(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (this.audioSession) {
        await this.audioSession.sound.unloadAsync();
        this.audioSession = null;
      }

      this.isConfigured = false;
    } catch (error) {
      console.error('Failed to reset audio session:', error);
    }
  }

  /**
   * Check if background audio is configured
   */
  isBackgroundAudioConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get current audio session status
   */
  async getAudioSessionStatus(): Promise<any | null> {
    try {
      // getAudioModeAsync was removed in newer expo-av; return configured state
      return { staysActiveInBackground: this.isConfigured };
    } catch (error) {
      console.error('Failed to get audio session status:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.resetAudioSession();
    } catch (error) {
      console.error('Error during background audio cleanup:', error);
    }
  }
}

// Export singleton instance
export const backgroundAudioService = BackgroundAudioService.getInstance();
