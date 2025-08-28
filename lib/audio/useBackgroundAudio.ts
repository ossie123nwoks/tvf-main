import { useEffect, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { backgroundAudioService } from './backgroundPlayback';
import { audioPlayerService } from './player';

export interface UseBackgroundAudioReturn {
  isBackgroundAudioConfigured: boolean;
  configureBackgroundAudio: () => Promise<void>;
  handleInterruption: (interruption: Audio.InterruptionStatus) => Promise<void>;
  handleAudioFocusChange: (focusChange: Audio.AudioFocusChange) => Promise<void>;
  resetAudioSession: () => Promise<void>;
  getAudioSessionStatus: () => Promise<Audio.AudioMode | null>;
}

export const useBackgroundAudio = (): UseBackgroundAudioReturn => {
  const [isBackgroundAudioConfigured, setIsBackgroundAudioConfigured] = useState(false);

  // Configure background audio session
  const configureBackgroundAudio = useCallback(async () => {
    try {
      await backgroundAudioService.configureAudioSession();
      setIsBackgroundAudioConfigured(true);
    } catch (error) {
      console.error('Failed to configure background audio:', error);
      throw error;
    }
  }, []);

  // Handle audio interruptions
  const handleInterruption = useCallback(async (interruption: Audio.InterruptionStatus) => {
    try {
      await backgroundAudioService.handleInterruption(interruption);
    } catch (error) {
      console.error('Failed to handle interruption:', error);
    }
  }, []);

  // Handle audio focus changes (Android)
  const handleAudioFocusChange = useCallback(async (focusChange: Audio.AudioFocusChange) => {
    try {
      await backgroundAudioService.handleAudioFocusChange(focusChange);
    } catch (error) {
      console.error('Failed to handle audio focus change:', error);
    }
  }, []);

  // Reset audio session
  const resetAudioSession = useCallback(async () => {
    try {
      await backgroundAudioService.resetAudioSession();
      setIsBackgroundAudioConfigured(false);
    } catch (error) {
      console.error('Failed to reset audio session:', error);
    }
  }, []);

  // Get audio session status
  const getAudioSessionStatus = useCallback(async () => {
    try {
      return await backgroundAudioService.getAudioSessionStatus();
    } catch (error) {
      console.error('Failed to get audio session status:', error);
      return null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, ensure audio session is configured
        if (!isBackgroundAudioConfigured) {
          try {
            await configureBackgroundAudio();
          } catch (error) {
            console.error('Failed to configure audio session on app activation:', error);
          }
        }
      } else if (nextAppState === 'background') {
        // App went to background, ensure audio can continue playing
        if (isBackgroundAudioConfigured && audioPlayerService.isPlaying()) {
          // Audio will continue playing in background
          console.log('Audio continuing in background');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isBackgroundAudioConfigured, configureBackgroundAudio]);

  // Set up audio interruption listeners
  useEffect(() => {
    const interruptionListener = Audio.addListener('interruption', handleInterruption);
    const audioFocusChangeListener = Audio.addListener('audioFocusChange', handleAudioFocusChange);

    return () => {
      interruptionListener?.remove();
      audioFocusChangeListener?.remove();
    };
  }, [handleInterruption, handleAudioFocusChange]);

  // Initialize background audio on mount
  useEffect(() => {
    const initializeBackgroundAudio = async () => {
      try {
        await configureBackgroundAudio();
      } catch (error) {
        console.error('Failed to initialize background audio on mount:', error);
      }
    };

    initializeBackgroundAudio();

    // Cleanup on unmount
    return () => {
      // Don't cleanup here as other components might still need the audio session
      // The cleanup will be handled by the audio player service when it's cleaned up
    };
  }, [configureBackgroundAudio]);

  return {
    isBackgroundAudioConfigured,
    configureBackgroundAudio,
    handleInterruption,
    handleAudioFocusChange,
    resetAudioSession,
    getAudioSessionStatus,
  };
};
