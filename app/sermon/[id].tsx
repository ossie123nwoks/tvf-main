import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
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
  FAB
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Category } from '@/types/content';
import { Audio } from 'expo-av';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

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
  
  // UI states
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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
      paddingTop: theme.spacing.xl,
    },
    thumbnail: {
      width: '100%',
      height: 200,
      borderRadius: theme.spacing.md,
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
      
      // Initialize audio
      await initializeAudio();
      
    } catch (error) {
      console.error('Failed to load sermon:', error);
      setError('Failed to load sermon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeAudio = async () => {
    try {
      // Request audio permissions
      const permissionStatus = await Audio.requestPermissionsAsync();
      if (permissionStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Audio playback permission is required to play sermons.');
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

      // Load audio
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: sermon?.audio_url || '' },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(audioSound);
      
      // Get duration
      const audioStatus = await audioSound.getStatusAsync();
      if (audioStatus.isLoaded) {
        setDuration(audioStatus.durationMillis || 0);
      }
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      Alert.alert('Audio Error', 'Failed to initialize audio player.');
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
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', 'Failed to control audio playback.');
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;
    
    try {
      const newPosition = value * duration;
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleSkip = async (seconds: number) => {
    if (!sound) return;
    
    try {
      const newPosition = Math.max(0, position + (seconds * 1000));
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Skip error:', error);
    }
  };

  const handleDownload = async () => {
    // TODO: Implement download functionality
    Alert.alert('Coming Soon', 'Download functionality will be implemented in the next phase.');
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
            }
          }
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
      day: 'numeric'
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
        <MaterialIcons 
          name="error" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={styles.errorText}>
          {error || 'Sermon not found'}
        </Text>
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
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBack}
              style={{ position: 'absolute', top: theme.spacing.md, left: theme.spacing.md, zIndex: 1 }}
            />
            
            {sermon.thumbnail_url && (
              <Card.Cover 
                source={{ uri: sermon.thumbnail_url }} 
                style={styles.thumbnail}
              />
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
            <View style={styles.audioPlayer}>
              <View style={styles.playerHeader}>
                <Text style={styles.playerTitle}>Audio Player</Text>
                {isBuffering && (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                  onTouchEnd={(event) => {
                    const { locationX } = event.nativeEvent;
                    const newProgress = locationX / (screenWidth - 2 * theme.spacing.lg);
                    handleSeek(newProgress);
                  }}
                />
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
                  icon={isPlaying ? "pause" : "play-arrow"}
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
                  icon="download"
                  onPress={handleDownload}
                  style={styles.actionButton}
                  loading={isDownloading}
                >
                  Download
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
            </View>

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
                  <Text style={styles.statNumber}>{sermon.tags && Array.isArray(sermon.tags) ? sermon.tags.length : 0}</Text>
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
                <Chip
                  icon={category.icon}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {category.name}
                </Chip>
              </View>
            )}
          </View>
        </ScrollView>

        {/* FAB for quick actions */}
        <FAB
          icon="more-vert"
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
