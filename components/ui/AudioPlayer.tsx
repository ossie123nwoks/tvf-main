import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  ProgressBar,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width: screenWidth } = Dimensions.get('window');

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  subtitle?: string;
  onPlayPause?: (isPlaying: boolean) => void;
  onProgress?: (position: number, duration: number) => void;
  onError?: (error: string) => void;
  autoPlay?: boolean;
  showProgress?: boolean;
  showControls?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function AudioPlayer({
  audioUrl,
  title,
  subtitle,
  onPlayPause,
  onProgress,
  onError,
  autoPlay = false,
  showProgress = true,
  showControls = true,
  variant = 'default',
}: AudioPlayerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: variant === 'minimal' ? theme.spacing.sm : theme.spacing.md,
      ...theme.shadows.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: variant === 'minimal' ? theme.spacing.sm : theme.spacing.md,
    },
    title: {
      fontSize: variant === 'minimal' ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.onSurface || theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    subtitle: {
      fontSize: variant === 'minimal' ? 12 : 14,
      color: theme.colors.onSurfaceVariant || theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: variant === 'minimal' ? theme.spacing.sm : theme.spacing.md,
      marginBottom: variant === 'minimal' ? theme.spacing.sm : theme.spacing.md,
    },
    playButton: {
      backgroundColor: theme.colors.audioControl || theme.colors.primary,
      borderRadius: variant === 'minimal' ? 20 : 28,
      width: variant === 'minimal' ? 40 : 56,
      height: variant === 'minimal' ? 40 : 56,
    },
    controlButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 24,
      width: 48,
      height: 48,
    },
    progressContainer: {
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      height: variant === 'minimal' ? 4 : 6,
      borderRadius: variant === 'minimal' ? 2 : 3,
      backgroundColor: theme.colors.audioProgressBackground || theme.colors.surfaceVariant,
    },
    progressFill: {
      backgroundColor: theme.colors.audioProgress || theme.colors.primary,
    },
    timeInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    timeText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant || theme.colors.textSecondary,
    },
    loadingContainer: {
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant || theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    errorContainer: {
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: 'rgba(211, 47, 47, 0.1)',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.error,
    },
  });

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && sound && !isPlaying) {
      handlePlayPause();
    }
  }, [autoPlay, sound]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      if (isMounted.current) {
        setSound(newSound);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load audio');
        setIsLoading(false);
        if (onError) {
          onError('Failed to load audio');
        }
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!isMounted.current) return;

    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);

      if (onProgress) {
        onProgress(status.positionMillis || 0, status.durationMillis || 0);
      }
    } else if (status.error) {
      setError('Playback error occurred');
      if (onError) {
        onError('Playback error occurred');
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      setError('Failed to control playback');
      if (onError) {
        onError('Failed to control playback');
      }
    }
  };

  const handleSeek = async (position: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(position);
    } catch (err) {
      setError('Failed to seek');
      if (onError) {
        onError('Failed to seek');
      }
    }
  };

  const handleSkip = async (direction: 'forward' | 'backward') => {
    if (!sound) return;

    try {
      const skipAmount = direction === 'forward' ? 30000 : -30000; // 30 seconds
      const newPosition = Math.max(0, Math.min(duration, position + skipAmount));
      await sound.setPositionAsync(newPosition);
    } catch (err) {
      setError('Failed to skip');
      if (onError) {
        onError('Failed to skip');
      }
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setError(null);
    loadAudio();
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={24} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={handleRetry}
            style={styles.retryButton}
            textColor="#FFFFFF"
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialIcons
            name="hourglass-empty"
            size={24}
            color={theme.colors.onSurfaceVariant || theme.colors.textSecondary}
          />
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {showControls && (
        <View style={styles.controls}>
          <IconButton
            icon="skip-previous"
            size={variant === 'minimal' ? 20 : 24}
            onPress={() => handleSkip('backward')}
            style={styles.controlButton}
            iconColor={theme.colors.onSurfaceVariant || theme.colors.textSecondary}
          />

          <IconButton
            icon={isPlaying ? 'pause' : 'play-arrow'}
            size={variant === 'minimal' ? 24 : 32}
            onPress={handlePlayPause}
            style={styles.playButton}
            iconColor={theme.colors.onBackground || '#FFFFFF'}
          />

          <IconButton
            icon="skip-next"
            size={variant === 'minimal' ? 20 : 24}
            onPress={() => handleSkip('forward')}
            style={styles.controlButton}
            iconColor={theme.colors.onSurfaceVariant || theme.colors.textSecondary}
          />
        </View>
      )}

      {showProgress && duration > 0 && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={position / duration}
            color={theme.colors.audioProgress || theme.colors.primary}
            style={styles.progressBar}
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.audioProgress || theme.colors.primary,
                surface: theme.colors.audioProgressBackground || theme.colors.surfaceVariant,
              },
            }}
          />

          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
