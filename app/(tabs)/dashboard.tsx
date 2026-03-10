import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, useTheme as usePaperTheme, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentGuard } from '@/components/auth/ContentGuard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileModal from '@/components/ui/ProfileModal';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Article } from '@/types/content';
import { QuickShareButton } from '@/components/ui/QuickShareButton';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { useSavedContent } from '@/lib/hooks/useSavedContent';
// New design system components
import FeaturedBanner from '@/components/ui/FeaturedBanner';
import SectionHeader from '@/components/ui/SectionHeader';
import SermonCard from '@/components/ui/SermonCard';
import BlogCard from '@/components/ui/BlogCard';
import FilterModal from '@/components/ui/FilterModal';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  // Sermon filter state
  const [sermonFilter, setSermonFilter] = useState<'all' | 'this_week' | 'last_week' | 'last_2_months'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Article filter state
  const [articleFilter, setArticleFilter] = useState<'all' | 'this_week' | 'last_week' | 'last_2_months'>('all');
  const [showArticleFilterModal, setShowArticleFilterModal] = useState(false);

  // Offline downloads functionality
  const {
    addDownload,
    isAvailableOffline,
    downloads,
    isLoading: downloadsLoading
  } = useOfflineDownloads();

  // Saved content functionality
  const {
    isContentSaved,
    toggleSave,
    isLoading: saveLoading
  } = useSavedContent();

  const userInitials = React.useMemo(() => {
    const firstInitial = user?.firstName?.trim()?.charAt(0) || '';
    const lastInitial = user?.lastName?.trim()?.charAt(0) || '';

    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }

    if (firstInitial) return firstInitial.toUpperCase();
    if (lastInitial) return lastInitial.toUpperCase();

    const emailInitial = user?.email?.trim()?.charAt(0);
    return emailInitial ? emailInitial.toUpperCase() : 'U';
  }, [user?.firstName, user?.lastName, user?.email]);

  // State to track download status for each sermon
  const [sermonDownloadStatus, setSermonDownloadStatus] = useState<Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>>({});

  // Carousel state
  const [carouselData, setCarouselData] = useState<Array<{
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
  }>>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);

  // Responsive breakpoints
  const isTablet = screenWidth >= 768;

  // ============================================================================
  // Business Logic (preserved from original)
  // ============================================================================

  const checkSermonDownloadStatus = async (sermonsList: Sermon[]) => {
    const statusMap: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};

    for (const sermon of sermonsList) {
      try {
        const isDownloaded = await isAvailableOffline(sermon.audio_url);
        statusMap[sermon.id] = isDownloaded ? 'downloaded' : 'idle';
      } catch (err) {
        console.error(`Failed to check download status for sermon ${sermon.id}:`, err);
        statusMap[sermon.id] = 'error';
      }
    }

    setSermonDownloadStatus(statusMap);
  };

  const handleArticleSave = async (article: Article) => {
    try {
      await toggleSave('article', article.id);
    } catch (err) {
      console.error('Failed to save/unsave article:', err);
      Alert.alert('Error', 'Failed to save article. Please try again.', [{ text: 'OK', style: 'default' }]);
    }
  };

  const handleSermonSave = async (sermon: Sermon) => {
    try {
      await toggleSave('sermon', sermon.id);
    } catch (err) {
      console.error('Failed to save/unsave sermon:', err);
      Alert.alert('Error', 'Failed to save sermon. Please try again.', [{ text: 'OK', style: 'default' }]);
    }
  };

  const handleSermonDownload = async (sermon: Sermon) => {
    try {
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'checking' }));

      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloaded' }));
        Alert.alert('Already Downloaded', `${sermon.title} is already available offline.`);
        return;
      }

      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloading' }));

      await addDownload('audio', sermon.title, sermon.audio_url, {
        contentId: sermon.id,
        preacher: sermon.preacher,
        date: sermon.date,
        duration: sermon.duration,
        thumbnail_url: sermon.thumbnail_url,
      });

      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloaded' }));
      Alert.alert('Download Started', `${sermon.title} is now downloading.`);
    } catch (err) {
      console.error('Failed to download sermon:', err);
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'error' }));

      const errorMessage = err instanceof Error ? err.message : 'Failed to download sermon';
      Alert.alert('Download Failed', `${errorMessage}. Please check your connection.`, [
        { text: 'OK', style: 'default' },
        { text: 'Retry', style: 'default', onPress: () => handleSermonDownload(sermon) },
      ]);
    }
  };

  const handleSermonShare = async (sermon: Sermon) => {
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Check out this sermon: "${sermon.title}" by ${sermon.preacher}`,
        title: sermon.title,
      });
    } catch (err) {
      console.error('Failed to share sermon:', err);
    }
  };

  const handleArticleShare = async (article: Article) => {
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Check out this article: "${article.title}" by ${article.author}`,
        title: article.title,
      });
    } catch (err) {
      console.error('Failed to share article:', err);
    }
  };

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchSermons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ContentService.getSermons({
        limit: 20,
        sortBy: 'date',
        sortOrder: 'desc',
        published: true
      });
      const sermonsData = response.data || [];
      setSermons(sermonsData);
      await checkSermonDownloadStatus(sermonsData);
    } catch (err) {
      console.error('Failed to fetch sermons:', err);
      setError('Failed to load sermons');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setArticlesLoading(true);
      setArticlesError(null);
      const response = await ContentService.getArticles({
        limit: 20,
        sortBy: 'date',
        sortOrder: 'desc',
        published: true
      });
      setArticles(response.data || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setArticlesError('Failed to load articles');
    } finally {
      setArticlesLoading(false);
    }
  };

  // Fetch carousel images
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setCarouselLoading(true);
        const images = await ContentService.getCarouselImages();
        setCarouselData(images);
      } catch (err) {
        console.error('Failed to fetch carousel images:', err);
        setCarouselData([
          { id: '1', image_url: require('@/assets/tvf-home.png') },
          { id: '2', image_url: require('@/assets/tvf-outreach.png') },
          { id: '3', image_url: require('@/assets/splash-image.png') },
        ]);
      } finally {
        setCarouselLoading(false);
      }
    };
    fetchCarouselImages();
  }, []);

  // Fetch content
  useEffect(() => {
    fetchSermons();
    fetchArticles();
  }, []);

  // Monitor download progress
  useEffect(() => {
    if (sermons.length === 0) return;

    setSermonDownloadStatus(prevStatus => {
      const updatedStatus: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};

      sermons.forEach(sermon => {
        const currentStatus = prevStatus[sermon.id] || 'idle';
        const downloadItem = downloads.find(d => d.metadata?.contentId === sermon.id);

        if (downloadItem) {
          switch (downloadItem.status) {
            case 'downloading':
              updatedStatus[sermon.id] = 'downloading';
              break;
            case 'completed':
              updatedStatus[sermon.id] = 'downloaded';
              break;
            case 'failed':
              updatedStatus[sermon.id] = 'error';
              break;
            case 'paused':
              updatedStatus[sermon.id] = 'downloading';
              break;
            default:
              updatedStatus[sermon.id] = currentStatus;
          }
        } else {
          updatedStatus[sermon.id] = currentStatus;
        }
      });

      return updatedStatus;
    });
  }, [downloads, sermons]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSermons(), fetchArticles()]);
    setRefreshing(false);
  };

  // ============================================================================
  // Filters
  // ============================================================================

  const filterByDate = <T extends { date?: string; published_at?: string }>(items: T[], filter: string, dateField: 'date' | 'published_at'): T[] => {
    if (filter === 'all') return items;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items.filter(item => {
      const itemDate = new Date((item as any)[dateField]);
      const diffDays = Math.ceil((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (filter) {
        case 'this_week': return diffDays <= 7;
        case 'last_week': return diffDays > 7 && diffDays <= 14;
        case 'last_2_months': return diffDays <= 60;
        default: return true;
      }
    });
  };

  const filterOptions = [
    { key: 'all' as const, label: 'All Time', icon: 'access-time' },
    { key: 'this_week' as const, label: 'This Week', icon: 'today' },
    { key: 'last_week' as const, label: 'Last Week', icon: 'date-range' },
    { key: 'last_2_months' as const, label: 'Last 2 Months', icon: 'calendar-today' },
  ];

  const filteredSermons = filterByDate(sermons, sermonFilter, 'date').slice(0, 3);
  const filteredArticles = filterByDate(articles, articleFilter, 'published_at').slice(0, 3);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <ContentGuard
        requireAuth={true}
        requireVerification={true}
        fallbackMessage="Sign in to access your personalized dashboard"
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {/* ==================== HEADER ==================== */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: theme.colors.background,
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.md,
                  paddingTop: Platform.select({
                    ios: Math.max(insets.top, theme.spacing.lg) + theme.spacing.sm,
                    android: theme.spacing.lg + theme.spacing.sm,
                  }),
                },
              ]}
            >
              <View style={styles.headerRow}>
                <Image
                  source={require('@/assets/home-icon.png')}
                  style={[styles.headerLogo, {
                    width: isTablet ? 44 : 40,
                    height: isTablet ? 44 : 40,
                    borderRadius: isTablet ? 22 : 20,
                  }]}
                  resizeMode="cover"
                />
                <View style={styles.headerActions}>
                  <IconButton
                    icon={isDark ? 'weather-night' : 'weather-sunny'}
                    size={22}
                    iconColor={theme.colors.primary}
                    onPress={toggleTheme}
                    style={[styles.headerIconBtn, { backgroundColor: theme.colors.primaryContainer }]}
                  />
                  {user?.role === 'admin' && (
                    <IconButton
                      icon="shield"
                      size={22}
                      iconColor={theme.colors.error}
                      style={[styles.headerIconBtn, { backgroundColor: theme.colors.errorContainer }]}
                      onPress={() => router.push('/admin')}
                    />
                  )}
                  <Avatar.Text
                    size={isTablet ? 46 : 38}
                    label={userInitials}
                    style={{ backgroundColor: theme.colors.primary }}
                    labelStyle={{ color: '#FFFFFF', fontSize: isTablet ? 18 : 14, fontWeight: '600' }}
                    onTouchEnd={() => setShowProfileModal(true)}
                  />
                </View>
              </View>
            </View>

            {/* ==================== HERO CAROUSEL ==================== */}
            <FeaturedBanner
              data={carouselData}
              loading={carouselLoading}
              autoPlayInterval={4000}
              height={220}
            />

            {/* ==================== QUICK ACTIONS ==================== */}
            <View
              style={[
                styles.quickActions,
                {
                  marginHorizontal: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.quickAction,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    flex: 1,
                    ...theme.shadows.medium,
                  },
                ]}
                onPress={() => router.push('/(tabs)/sermons')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="headset" size={24} color="#FFFFFF" />
                <Text style={{ ...theme.typography.labelMedium, color: '#FFFFFF', marginTop: theme.spacing.xs }}>
                  Sermons
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickAction,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: theme.spacing.md,
                    flex: 1,
                    ...theme.shadows.small,
                  },
                ]}
                onPress={() => router.push('/(tabs)/articles')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="auto-stories" size={24} color={theme.colors.primary} />
                <Text style={{ ...theme.typography.labelMedium, color: theme.colors.text, marginTop: theme.spacing.xs }}>
                  Articles
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickAction,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: theme.spacing.md,
                    flex: 1,
                    ...theme.shadows.small,
                  },
                ]}
                onPress={() => Linking.openURL('https://truevinefellowship.online')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="language" size={24} color={theme.colors.secondary} />
                <Text style={{ ...theme.typography.labelMedium, color: theme.colors.text, marginTop: theme.spacing.xs }}>
                  Website
                </Text>
              </TouchableOpacity>
            </View>

            {/* ==================== RECENT SERMONS ==================== */}
            <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}>
              <SectionHeader
                title="Recent Sermons"
                subtitle={sermonFilter !== 'all' ? filterOptions.find(o => o.key === sermonFilter)?.label : undefined}
                actionLabel="Filter"
                actionIcon="tune"
                onAction={() => setShowFilterModal(true)}
              />

              {loading ? (
                <SkeletonList type="sermon" count={2} />
              ) : error ? (
                <View style={[styles.stateContainer, { padding: theme.spacing.xl }]}>
                  <MaterialIcons name="cloud-off" size={48} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' }}>
                    {error}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={fetchSermons}
                    textColor={theme.colors.primary}
                    style={{ marginTop: theme.spacing.md }}
                  >
                    Retry
                  </Button>
                </View>
              ) : filteredSermons.length > 0 ? (
                filteredSermons.map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    variant="default"
                    onPress={() => router.push(`/sermon/${sermon.id}`)}
                    onPlay={() => router.push(`/sermon/${sermon.id}`)}
                    onDownload={() => handleSermonDownload(sermon)}
                    onShare={() => handleSermonShare(sermon)}
                    onSave={() => handleSermonSave(sermon)}
                    isSaved={isContentSaved('sermon', sermon.id)}
                    downloadStatus={sermonDownloadStatus[sermon.id] || 'idle'}
                  />
                ))
              ) : (
                <View style={[styles.stateContainer, { padding: theme.spacing.xl }]}>
                  <MaterialIcons name="library-music" size={48} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
                    No sermons found for this period
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => router.push('/(tabs)/sermons')}
                    textColor={theme.colors.primary}
                    style={{ marginTop: theme.spacing.sm }}
                  >
                    Browse All Sermons
                  </Button>
                </View>
              )}

              {/* See All link */}
              {sermons.length > 3 && !loading && !error && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/sermons')}
                  style={[
                    styles.seeAllButton,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.xs,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ ...theme.typography.labelLarge, color: theme.colors.primary, textAlign: 'center' }}>
                    See All Sermons →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ==================== LATEST ARTICLES ==================== */}
            <View style={[styles.section, { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.lg }]}>
              <SectionHeader
                title="Latest Articles"
                subtitle={articleFilter !== 'all' ? filterOptions.find(o => o.key === articleFilter)?.label : undefined}
                actionLabel="Filter"
                actionIcon="tune"
                onAction={() => setShowArticleFilterModal(true)}
              />

              {articlesLoading ? (
                <SkeletonList type="article" count={2} />
              ) : articlesError ? (
                <View style={[styles.stateContainer, { padding: theme.spacing.xl }]}>
                  <MaterialIcons name="cloud-off" size={48} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' }}>
                    {articlesError}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={fetchArticles}
                    textColor={theme.colors.primary}
                    style={{ marginTop: theme.spacing.md }}
                  >
                    Retry
                  </Button>
                </View>
              ) : filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <BlogCard
                    key={article.id}
                    article={article}
                    variant="default"
                    onPress={() => router.push(`/article/${article.id}`)}
                    onShare={() => handleArticleShare(article)}
                    onSave={() => handleArticleSave(article)}
                    isSaved={isContentSaved('article', article.id)}
                  />
                ))
              ) : (
                <View style={[styles.stateContainer, { padding: theme.spacing.xl }]}>
                  <MaterialIcons name="article" size={48} color={theme.colors.textTertiary} />
                  <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
                    No articles found for this period
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => router.push('/(tabs)/articles')}
                    textColor={theme.colors.primary}
                    style={{ marginTop: theme.spacing.sm }}
                  >
                    Browse All Articles
                  </Button>
                </View>
              )}

              {/* See All link */}
              {articles.length > 3 && !articlesLoading && !articlesError && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/articles')}
                  style={[
                    styles.seeAllButton,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.xs,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={{ ...theme.typography.labelLarge, color: theme.colors.primary, textAlign: 'center' }}>
                    See All Articles →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom spacer */}
            <View style={{ height: theme.spacing.xxl }} />
          </ScrollView>
        </View>
      </ContentGuard>

      {/* ==================== FILTER MODALS ==================== */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Sermons"
        options={filterOptions}
        selectedValue={sermonFilter}
        onSelect={(value) => setSermonFilter(value)}
      />

      <FilterModal
        visible={showArticleFilterModal}
        onClose={() => setShowArticleFilterModal(false)}
        title="Filter Articles"
        options={filterOptions}
        selectedValue={articleFilter}
        onSelect={(value) => setArticleFilter(value)}
      />

      {/* ProfileModal */}
      <ProfileModal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
        onSignOut={() => {
          setShowProfileModal(false);
          router.replace('/auth');
        }}
      />
    </>
  );
}

// ============================================================================
// Static Styles (not dependent on theme — avoids recreating on every render)
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {},
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    margin: 0,
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {},
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllButton: {},
});
