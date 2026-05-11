import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useMiniPlayer } from '@/lib/media/MiniPlayerContext';

// ── Tab bar visual height (not including safe area inset) ──
const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 56 }) ?? 56;
// ── Gap between mini player and tab bar ──
const GAP = 8;
// ── Mini player card height ──
const PLAYER_HEIGHT = 68;
// ── Total height including progress strip ──
const TOTAL_HEIGHT = PLAYER_HEIGHT + 3;

export default function MiniPlayer() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const {
    sermon,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    mediaType,
    togglePlayPause,
    dismiss,
  } = useMiniPlayer();

  const translateY = useRef(new Animated.Value(TOTAL_HEIGHT + 20)).current;

  // MUST be before any early return — Rules of Hooks
  // Slide up whenever the mini player becomes visible (sermon loaded + not on sermon page)
  const onSermonPage = pathname.startsWith('/sermon/');
  const shouldShow = !!sermon && !onSermonPage;

  useEffect(() => {
    if (!shouldShow) return;
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
      mass: 0.8,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  // Early returns come AFTER all hooks
  if (!sermon || onSermonPage) return null;

  const progress = durationMillis > 0 ? positionMillis / durationMillis : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const handleCardPress = () => {
    router.push(`/sermon/${sermon.id}` as any);
  };

  // Position the mini player just above the tab bar
  // insets.bottom = home indicator height (0 on Android with software nav, varies on iOS)
  // TAB_BAR_HEIGHT = visual tab bar height (not including inset)
  const bottomPosition = insets.bottom + TAB_BAR_HEIGHT + GAP;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: bottomPosition,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* ── Progress strip (sits above the card) ── */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.audioProgressBackground }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${Math.min(100, progress * 100)}%`,
            },
          ]}
        />
      </View>

      {/* ── Card ── */}
      <Pressable
        onPress={handleCardPress}
        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(22, 22, 28, 0.97)'
              : 'rgba(255, 255, 255, 0.97)',
            borderColor: isDark
              ? 'rgba(255,255,255,0.09)'
              : 'rgba(0,0,0,0.08)',
            shadowColor: '#000',
          },
        ]}
      >
        {/* Thumbnail */}
        <View
          style={[
            styles.thumb,
            { backgroundColor: theme.colors.surfaceVariant, borderRadius: 10 },
          ]}
        >
          {sermon.thumbnail_url ? (
            <Image
              source={{ uri: sermon.thumbnail_url }}
              style={StyleSheet.absoluteFillObject}
              borderRadius={10}
            />
          ) : (
            <MaterialIcons
              name={mediaType === 'video' ? 'videocam' : 'headset'}
              size={22}
              color={theme.colors.primary}
            />
          )}
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text
            numberOfLines={1}
            style={[styles.titleText, { color: theme.colors.text }]}
          >
            {sermon.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.subtitleText, { color: theme.colors.textSecondary }]}
          >
            {sermon.preacher}
            {durationMillis > 0 && (
              <Text style={{ color: theme.colors.textTertiary }}>
                {'  '}
                {formatTime(positionMillis)} / {formatTime(durationMillis)}
              </Text>
            )}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Play/pause (audio only — YouTube controls its own playback) */}
          {mediaType === 'audio' && (
            <Pressable
              onPress={e => {
                e.stopPropagation();
                togglePlayPause();
              }}
              style={[styles.playBtn, { backgroundColor: theme.colors.primary }]}
              hitSlop={12}
            >
              {isLoading ? (
                <ActivityIndicator size={18} color="#fff" />
              ) : (
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={22}
                  color="#fff"
                />
              )}
            </Pressable>
          )}

          {/* Dismiss */}
          <Pressable
            onPress={e => {
              e.stopPropagation();
              dismiss();
            }}
            style={styles.closeBtn}
            hitSlop={12}
          >
            <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 16,
  },
  progressTrack: {
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  card: {
    height: PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    // Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  thumb: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  textBlock: {
    flex: 1,
    gap: 2,
    overflow: 'hidden',
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  subtitleText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
