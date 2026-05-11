import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, Image, Pressable } from 'react-native';
import { Text, ActivityIndicator, IconButton, Button } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Sermon } from '@/types/content';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { useMiniPlayer } from '@/lib/media/MiniPlayerContext';

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

  // ── Mini player context (owns the Sound instance) ──
  const {
    activeSermonId,
    loadAudio,
    togglePlayPause,
    seekTo,
    attachFullScreen,
    detachFullScreen,
    registerVideo,
    // Playback state — read directly from context so mini player & full player stay in sync
    isPlaying: ctxIsPlaying,
    isLoading: ctxIsLoading,
    isBuffering: ctxIsBuffering,
    positionMillis: ctxPosition,
    durationMillis: ctxDuration,
    audioError: ctxAudioError,
  } = useMiniPlayer();

  // Is this sermon already loaded in context?
  const isThisSermonActive = activeSermonId === sermon.id;

  // Derive audio display state from context (so returning to this screen stays in sync)
  const isAudioPlaying = isThisSermonActive ? ctxIsPlaying : false;
  const audioLoading = isThisSermonActive ? ctxIsLoading : false;
  const isAudioBuffering = isThisSermonActive ? ctxIsBuffering : false;
  const audioPosition = isThisSermonActive ? ctxPosition : 0;
  const audioDuration = isThisSermonActive ? ctxDuration : 0;
  const audioError = isThisSermonActive ? ctxAudioError : null;

  // ── Video Player States (local — video isn't persisted in mini player) ──
  const videoRef = useRef<Video>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [youtubeReady, setYoutubeReady] = useState(false);

  // ── Full-screen lifecycle ──
  useEffect(() => {
    attachFullScreen();
    return () => {
      // Hand off to mini player — do NOT unload the sound
      detachFullScreen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermon.id]);

  // ── Audio initialization / switching ──
  useEffect(() => {
    if (activeMedia === 'audio' && hasAudio) {
      // Only initialize if this sermon isn't already loaded in context
      if (!isThisSermonActive) {
        initializeAudio();
      }
    }
    // NOTE: Do NOT pause audio when switching to video tab.
    // The full-screen player tabs are independent of the mini player's audio playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMedia]);

  const initializeAudio = async () => {
    try {
      let audioUri = sermon.audio_url;
      const isOffline = await isAvailableOffline(sermon.audio_url);
      if (isOffline) {
        const offlinePath = await getOfflinePath(sermon.audio_url);
        if (offlinePath) audioUri = offlinePath;
      }
      await loadAudio(sermon, audioUri);
    } catch (error) {
      console.error('[SermonMediaPlayer] initializeAudio error:', error);
    }
  };

  // ── Audio controls — delegate to context ──
  const handleAudioPlayPause = () => togglePlayPause();

  const handleAudioSeek = async (value: number) => {
    if (audioDuration === 0) return;
    await seekTo(value * audioDuration);
  };

  // ── Render helpers ──

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
        ...theme.shadows.medium,
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
                  const containerWidth = screenWidth - (theme.spacing.md * 2 + theme.spacing.lg * 2);
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
                onPress={() => seekTo(Math.max(0, audioPosition - 10000))}
              />
              <Pressable
                style={[styles.playButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, ...theme.shadows.small }]}
                onPress={handleAudioPlayPause}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator size={28} color="#FFF" />
                ) : (
                  <MaterialIcons name={isAudioPlaying ? 'pause' : 'play-arrow'} size={32} color="#FFF" />
                )}
              </Pressable>
              <IconButton
                icon="fast-forward-30"
                size={28}
                iconColor={theme.colors.textSecondary}
                onPress={() => seekTo(Math.min(audioDuration, audioPosition + 30000))}
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

      {/* Audio Player */}
      {activeMedia === 'audio' && renderAudioPlayer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 16 },
  videoContainer: {
    width: screenWidth,
    height: screenWidth * (9 / 16),
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  nativeVideo: { width: '100%', height: '100%' },
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
  toggleText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  audioContainer: { padding: 16, marginHorizontal: 16, marginBottom: 16 },
  playerHeader: { flexDirection: 'row', alignItems: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressWrapper: { height: 30, justifyContent: 'center' },
  progressTrack: { height: 6, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%' },
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
  errorContainer: { alignItems: 'center', paddingVertical: 16 },
  thumbnailContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * (9 / 16),
    alignSelf: 'center',
    marginBottom: 16,
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * (9 / 16),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
