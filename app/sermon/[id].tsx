import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions, Pressable } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
  Badge,
  Avatar,
  ProgressBar,
  FAB,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Category } from '@/types/content';
import { Audio } from 'expo-av';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';

const { width: screenWidth } = Dimensions.get('window');

export default function SermonDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Sermon data
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio player states
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isAudioValid, setIsAudioValid] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);

  // UI states
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>('idle');

  // Offline downloads functionality
  const { 
    addDownload, 
    isAvailableOffline, 
    getOfflinePath,
    downloads 
  } = useOfflineDownloads();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl + 60, // Add extra padding to account for back button
    },
    thumbnail: {
      width: '100%',
      height: 200,
      borderRadius: theme.spacing.md,
      marginTop: theme.spacing.lg, // Add top margin to create space from back button
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 30,
    },
    preacher: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    featuredBadge: {
      marginLeft: 'auto',
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    audioPlayer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      elevation: 4,
    },
    playerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    playerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    controlButton: {
      width: 56,
      height: 56,
    },
    playButton: {
      width: 64,
      height: 64,
    },
    progressContainer: {
      marginBottom: theme.spacing.md,
    },
    progressBarWrapper: {
      height: 40,
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
    },
    timeDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    timeText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
    },
  });

  // Load sermon data
  useEffect(() => {
    if (id) {
      loadSermon();
    }
  }, [id]);

  // Check download status when sermon loads
  useEffect(() => {
    if (sermon?.audio_url) {
      checkDownloadStatus();
    }
  }, [sermon]);

  // Monitor download progress
  useEffect(() => {
    if (sermon?.id) {
      const downloadItem = downloads.find(d => d.metadata?.contentId === sermon.id);
      if (downloadItem) {
        switch (downloadItem.status) {
          case 'downloading':
            setDownloadStatus('downloading');
            break;
          case 'completed':
            setDownloadStatus('downloaded');
            break;
          case 'failed':
            setDownloadStatus('error');
            break;
          case 'paused':
            setDownloadStatus('downloading');
            break;
        }
      }
    }
  }, [downloads, sermon]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSermon = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAudioValid(true);
      setAudioError(null);

      const sermonData = await ContentService.getSermonById(id);
      setSermon(sermonData);

      // Load category information
      if (sermonData.category_id) {
        try {
          const categoryData = await ContentService.getCategoryById(sermonData.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.warn('Failed to load category:', error);
        }
      }

      // Initialize audio with the loaded sermon data
      await initializeAudioWithSermon(sermonData);
    } catch (error) {
      console.error('Failed to load sermon:', error);
      setError('Failed to load sermon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeAudioWithSermon = async (sermonData: Sermon) => {
    try {
      setIsLoading(true);
      
      // Validate audio URL
      if (!sermonData?.audio_url || sermonData.audio_url.trim() === '') {
        console.warn('No audio URL provided for sermon');
        setIsLoading(false);
        setIsAudioValid(false);
        setAudioError('No audio file is available for this sermon.');
        return;
      }

      // Check for placeholder audio URL
      if (sermonData.audio_url.includes('placeholder') || sermonData.audio_url.includes('demo') || sermonData.audio_url.includes('sample')) {
        console.warn('Placeholder audio URL detected:', sermonData.audio_url);
        setIsLoading(false);
        setIsAudioValid(false);
        setAudioError('Audio file is not available. Please upload a real audio file.');
        return;
      }

      // Check if URL is valid
      let audioUrlObj;
      try {
        audioUrlObj = new URL(sermonData.audio_url);
      } catch (urlError) {
        console.error('Invalid audio URL:', sermonData.audio_url);
        setIsLoading(false);
        Alert.alert('Invalid Audio URL', 'The audio file URL is invalid.');
        return;
      }

      // Check if the URL is accessible (basic check)
      if (!audioUrlObj.protocol.startsWith('http')) {
        console.error('Unsupported protocol for audio URL:', audioUrlObj.protocol);
        setIsLoading(false);
        Alert.alert('Unsupported Protocol', 'Audio must be served over HTTP or HTTPS.');
        return;
      }

      // Request audio permissions
      const permissionStatus = await Audio.requestPermissionsAsync();
      if (permissionStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Audio playback permission is required to play sermons.'
        );
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Check if audio is available offline first
      let audioUri = sermonData.audio_url;
      const isOfflineAvailable = await isAvailableOffline(sermonData.audio_url);
      if (isOfflineAvailable) {
        const offlinePath = await getOfflinePath(sermonData.audio_url);
        if (offlinePath) {
          audioUri = offlinePath;
          console.log('Using offline audio:', offlinePath);
        }
      }

      // Load audio with better error handling
      console.log('Loading audio from:', audioUri);
      
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: false,
          isLooping: false,
          isMuted: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate
      );

      setSound(audioSound);

      // Get duration
      const audioStatus = await audioSound.getStatusAsync();
      if (audioStatus.isLoaded && 'durationMillis' in audioStatus) {
        setDuration(audioStatus.durationMillis || 0);
        console.log('Audio loaded successfully. Duration:', audioStatus.durationMillis);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsLoading(false);
      setIsAudioValid(false);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to initialize audio player.';
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.message.includes('Network') || error.message.includes('timeout') || error.message.includes('-1008')) {
          errorMessage = 'Network timeout. The audio file could not be loaded. Please check your internet connection and try again.';
        } else if (error.message.includes('format') || error.message.includes('codec')) {
          errorMessage = 'Audio format not supported. Please contact support.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Audio permission denied. Please enable audio permissions in settings.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'Audio file not found. It may have been removed or moved.';
        } else {
          errorMessage = `Unable to load audio: ${error.message}`;
        }
      }
      
      setAudioError(errorMessage);
      setError(errorMessage);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);

      if (status.positionMillis !== null) {
        setPosition(status.positionMillis);
      }

      if (status.durationMillis !== null) {
        setDuration(status.durationMillis);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      console.error('Sound object is not initialized');
      Alert.alert('Audio Error', 'Audio player is not ready. Please wait for audio to load.');
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Playback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to control audio playback';
      Alert.alert('Playback Error', errorMessage);
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) {
      console.error('Sound object is not initialized');
      return;
    }

    try {
      const newPosition = value * duration;
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Seek error:', error);
      Alert.alert('Seek Error', 'Failed to seek audio position.');
    }
  };

  const handleSkip = async (seconds: number) => {
    if (!sound) {
      console.error('Sound object is not initialized');
      return;
    }

    try {
      const newPosition = Math.max(0, position + seconds * 1000);
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Skip error:', error);
      Alert.alert('Skip Error', 'Failed to skip audio position.');
    }
  };

  const checkDownloadStatus = async () => {
    if (!sermon?.audio_url) return;
    
    try {
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      setDownloadStatus(isDownloaded ? 'downloaded' : 'idle');
    } catch (error) {
      console.error('Failed to check download status:', error);
      setDownloadStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!sermon) return;

    try {
      setDownloadStatus('checking');
      
      // Check if already downloaded
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        setDownloadStatus('downloaded');
        Alert.alert(
          'Already Downloaded', 
          `${sermon.title} is already available offline. You can access it anytime without an internet connection.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'View Downloads', 
              style: 'default',
              onPress: () => {
                // You could navigate to a download manager here if needed
                console.log('Navigate to download manager');
              }
            }
          ]
        );
        return;
      }
      
      setDownloadStatus('downloading');
      
      // Add download
      await addDownload(
        'audio',
        sermon.title,
        sermon.audio_url,
        {
          contentId: sermon.id,
          preacher: sermon.preacher,
          date: sermon.date,
          duration: sermon.duration,
          thumbnail_url: sermon.thumbnail_url,
          description: sermon.description
        }
      );
      
      setDownloadStatus('downloaded');
      Alert.alert('Download Started', `${sermon.title} is now downloading. You can monitor progress in the Download Manager.`);
    } catch (error) {
      console.error('Failed to download sermon:', error);
      setDownloadStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download sermon';
      Alert.alert(
        'Download Failed', 
        `${errorMessage}. Please check your internet connection and try again.`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            style: 'default',
            onPress: () => handleDownload()
          }
        ]
      );
    }
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    Alert.alert('Coming Soon', 'Share functionality will be implemented in the next phase.');
  };

  const handleBack = () => {
    if (sound && isPlaying) {
      Alert.alert(
        'Audio Playing',
        'Audio is currently playing. Do you want to stop it and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop & Go Back',
            onPress: async () => {
              await sound.stopAsync();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.metaText}>Loading sermon...</Text>
      </View>
    );
  }

  if (error || !sermon) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>{error || 'Sermon not found'}</Text>
        <Button mode="contained" onPress={handleBack}>
          Go Back
        </Button>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={{
              position: 'absolute',
              top: theme.spacing.xl + 20, // Move down from top edge
              left: theme.spacing.lg,
              zIndex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: 25,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={handleBack}
                iconColor={theme.colors.text}
                style={{ margin: 0 }}
              />
            </View>

            {sermon.thumbnail_url && (
              <Card.Cover source={{ uri: sermon.thumbnail_url }} style={styles.thumbnail} />
            )}

            <Text style={styles.title}>{sermon.title}</Text>
            <Text style={styles.preacher}>{sermon.preacher}</Text>

            <View style={styles.meta}>
              <MaterialIcons name="calendar-today" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(sermon.date)}</Text>

              <MaterialIcons name="access-time" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{formatDuration(sermon.duration)}</Text>

              {sermon.is_featured && (
                <Badge size={16} style={styles.featuredBadge}>
                  Featured
                </Badge>
              )}
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Audio Player */}
            {sermon?.audio_url && sermon.audio_url.trim() !== '' ? (
              <View style={styles.audioPlayer}>
              {!isAudioValid && audioError ? (
                <View style={{ alignItems: 'center', padding: theme.spacing.lg }}>
                  <MaterialIcons name="warning" size={48} color={theme.colors.error} />
                  <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginTop: theme.spacing.md, textAlign: 'center' }}>
                    {audioError}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setIsAudioValid(true);
                      setAudioError(null);
                      initializeAudioWithSermon(sermon);
                    }}
                    style={{ marginTop: theme.spacing.md }}
                  >
                    Retry
                  </Button>
                </View>
              ) : (
              <>
              <View style={styles.playerHeader}>
                <Text style={styles.playerTitle}>Audio Player</Text>
                {isBuffering && <ActivityIndicator size="small" color={theme.colors.primary} />}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
                <Pressable
                  onPress={event => {
                    const { locationX } = event.nativeEvent;
                    const containerWidth = screenWidth - 2 * theme.spacing.lg;
                    const newProgress = Math.max(0, Math.min(1, locationX / containerWidth));
                    handleSeek(newProgress);
                  }}
                  style={styles.progressBarWrapper}
                >
                  <ProgressBar
                    progress={progress}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                </Pressable>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <IconButton
                  icon="skip-previous"
                  size={32}
                  onPress={() => handleSkip(-30)}
                  style={styles.controlButton}
                />

                <IconButton
                  icon={isPlaying ? 'pause' : 'play'}
                  size={40}
                  onPress={handlePlayPause}
                  style={[styles.controlButton, styles.playButton]}
                  disabled={isLoading}
                />

                <IconButton
                  icon="skip-next"
                  size={32}
                  onPress={() => handleSkip(30)}
                  style={styles.controlButton}
                />
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => handleDownload()}
                  style={styles.actionButton}
                  disabled={downloadStatus === 'downloading' || downloadStatus === 'checking'}
                  icon={() => {
                    switch (downloadStatus) {
                      case 'downloading':
                        return <ActivityIndicator size={20} color={theme.colors.primary} />;
                      case 'downloaded':
                        return <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />;
                      case 'checking':
                        return <ActivityIndicator size={20} color={theme.colors.primary} />;
                      case 'error':
                        return <MaterialIcons name="error" size={20} color={theme.colors.error} />;
                      default:
                        return <MaterialIcons name="download" size={20} color={theme.colors.primary} />;
                    }
                  }}
                >
                  {(() => {
                    switch (downloadStatus) {
                      case 'downloading':
                        return 'Downloading...';
                      case 'downloaded':
                        return 'Downloaded';
                      case 'checking':
                        return 'Checking...';
                      case 'error':
                        return 'Retry';
                      default:
                        return 'Download';
                    }
                  })()}
                </Button>

                <Button
                  mode="outlined"
                  icon="share"
                  onPress={handleShare}
                  style={styles.actionButton}
                >
                  Share
                </Button>
              </View>
              </>
              )}
            </View>
            ) : (
              <View style={styles.audioPlayer}>
                <View style={styles.playerHeader}>
                  <Text style={styles.playerTitle}>Audio Player</Text>
                </View>
                <View style={{ alignItems: 'center', padding: theme.spacing.lg }}>
                  <MaterialIcons name="warning" size={48} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginTop: theme.spacing.md, textAlign: 'center' }}>
                    Audio not available for this sermon.
                  </Text>
                </View>
              </View>
            )}

            {/* Stats Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{sermon.views}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{sermon.downloads}</Text>
                  <Text style={styles.statLabel}>Downloads</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {sermon.tags && Array.isArray(sermon.tags) ? sermon.tags.length : 0}
                  </Text>
                  <Text style={styles.statLabel}>Tags</Text>
                </View>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 6}>
                {sermon.description}
              </Text>
              {sermon.description && sermon.description.length > 200 && (
                <Button
                  mode="text"
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Button>
              )}
            </View>

            {/* Tags Section */}
            {sermon.tags && Array.isArray(sermon.tags) && sermon.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tags}>
                  {sermon.tags.map((tag, index) => (
                    <Chip key={index} style={{ marginBottom: theme.spacing.sm }}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Category Section */}
            {category && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Chip icon={category.icon} style={{ alignSelf: 'flex-start' }}>
                  {category.name}
                </Chip>
              </View>
            )}
          </View>
        </ScrollView>

        {/* FAB for quick actions */}
        <FAB
          icon="dots-vertical"
          style={styles.fab}
          onPress={() => {
            // TODO: Implement quick actions menu
            Alert.alert('Coming Soon', 'Quick actions will be implemented in the next phase.');
          }}
        />
      </View>
    </ErrorBoundary>
  );
}