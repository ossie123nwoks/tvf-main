import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, Alert, Image, Pressable } from 'react-native';
import { Text, ActivityIndicator, IconButton, Button } from 'react-native-paper';
import { Audio, Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Sermon } from '@/types/content';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';

const { width: screenWidth } = Dimensions.get('window');

interface SermonMediaPlayerProps {
  sermon: Sermon;
}

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function SermonMediaPlayer({ sermon }: SermonMediaPlayerProps) {
  const { theme } = useTheme();
  
  const hasVideo = !!sermon.video_url && sermon.video_url.trim() !== '';
  const hasAudio = !!sermon.audio_url && sermon.audio_url.trim() !== '';
  
  // Default to video if available, else audio
  const [activeMedia, setActiveMedia] = useState<'video' | 'audio'>(hasVideo ? 'video' : 'audio');
  
  const youtubeId = getYoutubeId(sermon.video_url);
  const isYoutube = !!youtubeId;
  
  const { isAvailableOffline, getOfflinePath } = useOfflineDownloads();

  // ───── Audio Player States ─────
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioBuffering, setIsAudioBuffering] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // ───── Video Player States ─────
  const videoRef = useRef<Video>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [youtubeReady, setYoutubeReady] = useState(false);

  useEffect(() => {
    // Unload audio when switching to video
    if (activeMedia === 'video' && sound) {
      sound.pauseAsync();
    }
    // Pause video when switching to audio
    if (activeMedia === 'audio' && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [activeMedia]);

  useEffect(() => {
    if (activeMedia === 'audio' && !sound && hasAudio) {
      initializeAudio();
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [activeMedia]);

  const initializeAudio = async () => {
    try {
      setAudioLoading(true);
      setAudioError(null);

      let audioUri = sermon.audio_url;
      const isOffline = await isAvailableOffline(sermon.audio_url);
      if (isOffline) {
        const offlinePath = await getOfflinePath(sermon.audio_url);
        if (offlinePath) {
          audioUri = offlinePath;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, isLooping: false, isMuted: false },
        onAudioPlaybackStatusUpdate
      );

      setSound(audioSound);
      setAudioLoading(false);
    } catch (error) {
      setAudioLoading(false);
      setAudioError('Failed to load audio format.');
      console.error('Audio init error:', error);
    }
  };

  const onAudioPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsAudioPlaying(status.isPlaying);
      setIsAudioBuffering(status.isBuffering);
      if (status.positionMillis !== undefined) setAudioPosition(status.positionMillis);
      if (status.durationMillis !== undefined) setAudioDuration(status.durationMillis);
    }
  };

  const handleAudioPlayPause = async () => {
    if (!sound) return;
    if (isAudioPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleAudioSeek = async (value: number) => {
    if (!sound || audioDuration === 0) return;
    const seekPosition = value * audioDuration;
    await sound.setPositionAsync(seekPosition);
  };

  const renderMediaToggle = () => {
    if (!hasVideo || !hasAudio) return null;
    
    return (
      <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.full }]}>
        <Pressable
          style={[styles.toggleButton, activeMedia === 'video' && { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full }]}
          onPress={() => setActiveMedia('video')}
        >
          <MaterialIcons name="videocam" size={18} color={activeMedia === 'video' ? '#fff' : theme.colors.textSecondary} />
          <Text style={[styles.toggleText, { color: activeMedia === 'video' ? '#fff' : theme.colors.textSecondary }]}>Video</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, activeMedia === 'audio' && { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full }]}
          onPress={() => setActiveMedia('audio')}
        >
          <MaterialIcons name="headset" size={18} color={activeMedia === 'audio' ? '#fff' : theme.colors.textSecondary} />
          <Text style={[styles.toggleText, { color: activeMedia === 'audio' ? '#fff' : theme.colors.textSecondary }]}>Audio</Text>
        </Pressable>
      </View>
    );
  };

  const renderVideoPlayer = () => {
    if (!hasVideo) return null;

    if (isYoutube && youtubeId) {
      return (
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={screenWidth * (9 / 16)}
            play={isVideoPlaying}
            videoId={youtubeId}
            onReady={() => setYoutubeReady(true)}
            onChangeState={(state: string) => {
              if (state === 'playing') setIsVideoPlaying(true);
              if (state === 'paused' || state === 'ended') setIsVideoPlaying(false);
            }}
          />
          {!youtubeReady && (
            <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceVariant }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      );
    }

    // Native Video Player for Supabase storage URLs
    return (
      <View style={[styles.videoContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Video
          ref={videoRef}
          source={{ uri: sermon.video_url! }}
          style={styles.nativeVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsVideoPlaying(status.isPlaying);
              setVideoLoading(false);
            }
          }}
          onLoadStart={() => setVideoLoading(true)}
        />
        {videoLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    );
  };

  const renderAudioPlayer = () => {
    const progress = audioDuration > 0 ? audioPosition / audioDuration : 0;

    return (
      <View style={[styles.audioContainer, { 
        backgroundColor: theme.colors.surfaceElevated, 
        borderRadius: theme.borderRadius.xl,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
        ...theme.shadows.medium
      }]}>
        <View style={styles.playerHeader}>
          <MaterialIcons name="headset" size={20} color={theme.colors.primary} />
          <Text style={{ ...theme.typography.titleSmall, color: theme.colors.text, marginLeft: 8, flex: 1 }}>
            Audio Sermon
          </Text>
          {isAudioBuffering && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {audioError ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error, ...theme.typography.bodySmall }}>{audioError}</Text>
            <Button mode="outlined" compact onPress={initializeAudio} style={{ marginTop: 8 }}>Retry</Button>
          </View>
        ) : (
          <>
            <View style={{ marginTop: theme.spacing.md }}>
              <View style={styles.timeRow}>
                <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textTertiary }}>{formatTime(audioPosition)}</Text>
                <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textTertiary }}>{formatTime(audioDuration)}</Text>
              </View>
              <Pressable
                onPress={event => {
                  const { locationX } = event.nativeEvent;
                  const containerWidth = screenWidth - (theme.spacing.md * 2 + theme.spacing.lg * 2); // approximate
                  handleAudioSeek(Math.max(0, Math.min(1, locationX / containerWidth)));
                }}
                style={styles.progressWrapper}
              >
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.audioProgressBackground, borderRadius: theme.borderRadius.full }]}>
                  <View style={[styles.progressFill, { backgroundColor: theme.colors.audioProgress, borderRadius: theme.borderRadius.full, width: `${progress * 100}%` }]} />
                </View>
              </Pressable>
            </View>

            <View style={styles.controlsRow}>
              <IconButton
                icon="rewind-10"
                size={28}
                iconColor={theme.colors.textSecondary}
                onPress={() => sound?.setPositionAsync(Math.max(0, audioPosition - 10000))}
              />
              <Pressable
                style={[styles.playButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, ...theme.shadows.small }]}
                onPress={handleAudioPlayPause}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator size={28} color="#FFF" />
                ) : (
                  <MaterialIcons name={isAudioPlaying ? "pause" : "play-arrow"} size={32} color="#FFF" />
                )}
              </Pressable>
              <IconButton
                icon="fast-forward-30"
                size={28}
                iconColor={theme.colors.textSecondary}
                onPress={() => sound?.setPositionAsync(Math.min(audioDuration, audioPosition + 30000))}
              />
            </View>
          </>
        )}
      </View>
    );
  };

  const renderThumbnail = () => {
    if (sermon.thumbnail_url) {
      return (
        <View style={[styles.thumbnailContainer, { borderRadius: theme.borderRadius.lg, ...theme.shadows.medium }]}>
          <Image
            source={{ uri: sermon.thumbnail_url }}
            style={[styles.thumbnail, { borderRadius: theme.borderRadius.lg }]}
            resizeMode="cover"
          />
        </View>
      );
    }
    return (
      <View style={[styles.thumbnailPlaceholder, { borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialIcons name="headset" size={64} color={theme.colors.textTertiary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Media Player Area */}
      {activeMedia === 'video' ? renderVideoPlayer() : renderThumbnail()}
      
      {/* Toggle */}
      {renderMediaToggle()}

      {/* Audio Player below toggle if active */}
      {activeMedia === 'audio' && renderAudioPlayer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  videoContainer: {
    width: screenWidth,
    height: screenWidth * (9 / 16),
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    marginBottom: 16,
    width: 200,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  audioContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressWrapper: {
    height: 30,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thumbnailContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * (9 / 16),
    alignSelf: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * (9 / 16),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
