import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions, Pressable, Platform, Image } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  IconButton,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Category } from '@/types/content';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SermonMediaPlayer from '@/components/sermons/SermonMediaPlayer';

const { width: screenWidth } = Dimensions.get('window');

export default function SermonDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Sermon data
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>('idle');

  // Offline downloads
  const {
    addDownload,
    isAvailableOffline,
    getOfflinePath,
    downloads
  } = useOfflineDownloads();

  // Dynamic styles that depend on theme
  const dynamicStyles = React.useMemo(() => ({
    container: { backgroundColor: theme.colors.background },
    header: {
      backgroundColor: theme.colors.surfaceElevated,
      paddingTop: Platform.select({ ios: Math.max(insets.top, 20), android: 0 }),
    },
    playerCard: {
      backgroundColor: theme.colors.audioSurface,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      ...theme.shadows.medium,
    },
    sectionCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      ...theme.shadows.small,
    },
    progressTrack: {
      backgroundColor: theme.colors.audioProgressBackground,
      borderRadius: theme.borderRadius.full,
    },
    progressFill: {
      backgroundColor: theme.colors.audioProgress,
      borderRadius: theme.borderRadius.full,
    },
  }), [theme, insets]);

  // ───── Data Loading ─────

  useEffect(() => {
    if (id) { loadSermon(); }
  }, [id]);

  useEffect(() => {
    if (sermon?.audio_url) { checkDownloadStatus(); }
  }, [sermon]);

  useEffect(() => {
    if (sermon?.id) {
      const downloadItem = downloads.find(d => d.metadata?.contentId === sermon.id);
      if (downloadItem) {
        switch (downloadItem.status) {
          case 'downloading': setDownloadStatus('downloading'); break;
          case 'completed': setDownloadStatus('downloaded'); break;
          case 'failed': setDownloadStatus('error'); break;
          case 'paused': setDownloadStatus('downloading'); break;
        }
      }
    }
  }, [downloads, sermon]);

  const loadSermon = async () => {
    try {
      setLoading(true);
      setError(null);

      const sermonData = await ContentService.getSermonById(id);
      setSermon(sermonData);

      if (sermonData.category_id) {
        try {
          const categoryData = await ContentService.getCategoryById(sermonData.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.warn('Failed to load category:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load sermon:', error);
      setError('Failed to load sermon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ───── Download & Actions ─────

  const checkDownloadStatus = async () => {
    if (!sermon?.audio_url) return;
    try {
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      setDownloadStatus(isDownloaded ? 'downloaded' : 'idle');
    } catch (error) {
      setDownloadStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!sermon) return;
    try {
      setDownloadStatus('checking');
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        setDownloadStatus('downloaded');
        Alert.alert('Already Downloaded', `${sermon.title} is available offline.`);
        return;
      }
      setDownloadStatus('downloading');
      await addDownload('audio', sermon.title, sermon.audio_url, {
        contentId: sermon.id, preacher: sermon.preacher, date: sermon.date,
        duration: sermon.duration, thumbnail_url: sermon.thumbnail_url, description: sermon.description
      });
      setDownloadStatus('downloaded');
      Alert.alert('Download Started', `${sermon.title} is now downloading.`);
    } catch (error) {
      setDownloadStatus('error');
      Alert.alert('Download Failed', 'Please check your connection and try again.', [
        { text: 'OK' },
        { text: 'Retry', onPress: () => handleDownload() },
      ]);
    }
  };

  const handleShare = async () => {
    Alert.alert('Coming Soon', 'Share functionality will be implemented in the next phase.');
  };

  const handleBack = () => {
    router.back();
  };

  // ───── Formatters ─────

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ───── Loading / Error States ─────

  if (loading) {
    return (
      <View style={[staticStyles.centered, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
          Loading sermon...
        </Text>
      </View>
    );
  }

  if (error || !sermon) {
    return (
      <View style={[staticStyles.centered, dynamicStyles.container]}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md, marginHorizontal: theme.spacing.lg }}>
          {error || 'Sermon not found'}
        </Text>
        <Button mode="contained" onPress={handleBack} style={{ marginTop: theme.spacing.md }} buttonColor={theme.colors.primary} textColor="#FFFFFF">
          Go Back
        </Button>
      </View>
    );
  }



  // ───── Main Render ─────

  return (
    <ErrorBoundary>
      <View style={[staticStyles.flex, dynamicStyles.container]}>
        <ScrollView style={staticStyles.flex} showsVerticalScrollIndicator={false}>

          {/* ─── Media Section ─── */}
          <View style={{ paddingTop: Platform.select({ ios: Math.max(insets.top, 20), android: 20 }) }}>
            <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                style={[staticStyles.backBtn, { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.full, ...theme.shadows.small }]}
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={22} color={theme.colors.text} />
              </Pressable>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginLeft: theme.spacing.md }}>
                Sermon
              </Text>
            </View>

            <SermonMediaPlayer sermon={sermon} />
          </View>

          {/* ─── Content ─── */}
          <View style={{ padding: theme.spacing.md }}>
            <View style={{ paddingHorizontal: theme.spacing.sm }}>
              <Text style={{ ...theme.typography.headlineLarge, color: theme.colors.text }}>
                {sermon.title}
              </Text>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.primary, marginTop: theme.spacing.xs }}>
                {sermon.preacher}
              </Text>

              <View style={[staticStyles.metaRow, { marginTop: theme.spacing.sm }]}>
                <View style={staticStyles.metaItem}>
                  <MaterialIcons name="calendar-today" size={14} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginLeft: 4 }}>
                    {formatDate(sermon.date)}
                  </Text>
                </View>
                <View style={[staticStyles.metaDot, { backgroundColor: theme.colors.textTertiary }]} />
                <View style={staticStyles.metaItem}>
                  <MaterialIcons name="access-time" size={14} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginLeft: 4 }}>
                    {formatDuration(sermon.duration)}
                  </Text>
                </View>
                {sermon.is_featured && (
                  <>
                    <View style={[staticStyles.metaDot, { backgroundColor: theme.colors.textTertiary }]} />
                    <View style={[staticStyles.featuredBadge, { backgroundColor: theme.colors.accent + '20', borderRadius: theme.borderRadius.xs }]}>
                      <MaterialIcons name="star" size={12} color={theme.colors.accent} />
                      <Text style={{ ...theme.typography.labelSmall, color: theme.colors.accent, marginLeft: 2 }}>Featured</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Action Bar */}
              <View style={[staticStyles.actionBar, { marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
                <Pressable
                  onPress={handleDownload}
                  disabled={downloadStatus === 'downloading' || downloadStatus === 'checking'}
                  style={staticStyles.actionItem}
                >
                  <MaterialIcons
                    name={downloadStatus === 'downloaded' ? 'check-circle' : downloadStatus === 'error' ? 'error' : 'download'}
                    size={22}
                    color={downloadStatus === 'downloaded' ? theme.colors.success : downloadStatus === 'error' ? theme.colors.error : theme.colors.textSecondary}
                  />
                  <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {downloadStatus === 'downloaded' ? 'Saved' : downloadStatus === 'downloading' ? 'Saving...' : 'Download'}
                  </Text>
                </Pressable>
                <Pressable onPress={handleShare} style={staticStyles.actionItem}>
                  <MaterialIcons name="share" size={22} color={theme.colors.textSecondary} />
                  <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary, marginTop: 2 }}>Share</Text>
                </Pressable>
              </View>
            </View>

            {/* ─── Stats ─── */}
            <View style={[staticStyles.statsRow, dynamicStyles.sectionCard, { padding: theme.spacing.md, marginTop: theme.spacing.md }]}>
              {[
                { value: sermon.views, label: 'Views', icon: 'visibility' as const },
                { value: sermon.downloads, label: 'Downloads', icon: 'download' as const },
                { value: sermon.tags && Array.isArray(sermon.tags) ? sermon.tags.length : 0, label: 'Tags', icon: 'label' as const },
              ].map((stat, i) => (
                <View key={i} style={staticStyles.statItem}>
                  <MaterialIcons name={stat.icon} size={18} color={theme.colors.primary} />
                  <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginTop: 2 }}>{stat.value}</Text>
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* ─── Description ─── */}
            {sermon.description && (
              <View style={[dynamicStyles.sectionCard, { padding: theme.spacing.lg, marginTop: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                  Description
                </Text>
                <Text
                  style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary }}
                  numberOfLines={showFullDescription ? undefined : 5}
                >
                  {sermon.description}
                </Text>
                {sermon.description.length > 200 && (
                  <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                    <Text style={{ ...theme.typography.labelMedium, color: theme.colors.primary, marginTop: theme.spacing.xs }}>
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* ─── Tags ─── */}
            {sermon.tags && Array.isArray(sermon.tags) && sermon.tags.length > 0 && (
              <View style={[dynamicStyles.sectionCard, { padding: theme.spacing.lg, marginTop: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                  Tags
                </Text>
                <View style={staticStyles.tagsWrap}>
                  {sermon.tags.map((tag, index) => (
                    <Chip key={index} style={{ marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs, backgroundColor: theme.colors.primaryContainer }} textStyle={{ ...theme.typography.labelSmall, color: theme.colors.primary }}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* ─── Category ─── */}
            {category && (
              <View style={[dynamicStyles.sectionCard, { padding: theme.spacing.lg, marginTop: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                  Category
                </Text>
                <Chip icon={category.icon} style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }} textStyle={{ ...theme.typography.labelMedium, color: theme.colors.primary }}>
                  {category.name}
                </Chip>
              </View>
            )}

            {/* Bottom spacer */}
            <View style={{ height: theme.spacing.xxl }} />
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ───── Static Styles ─────

const staticStyles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroSection: { paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    position: 'absolute', top: 16, left: 16, zIndex: 10,
  },
  thumbnailContainer: { width: '100%', height: 220, marginTop: 56, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: '100%', height: 220, marginTop: 56, justifyContent: 'center', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 8 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2 },

  // Player
  playerCard: {},
  playerHeader: { flexDirection: 'row', alignItems: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressWrapper: { height: 24, justifyContent: 'center' },
  progressTrack: { height: 6, width: '100%' },
  progressFill: { height: 6, position: 'absolute', left: 0, top: 0 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  controlBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 16 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});