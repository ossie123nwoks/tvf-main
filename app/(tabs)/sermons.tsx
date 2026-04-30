import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Alert, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  Searchbar,
  useTheme as usePaperTheme,
  IconButton,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Sermon, Category, Series, Topic, ContentSearchParams } from '@/types/content';
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '@/components/ui/LoadingStates';
import { errorHandler } from '@/lib/utils/errorHandling';
import { retryUtils } from '@/lib/utils/retry';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { Share } from 'react-native';
// New design system components
import SermonCard from '@/components/ui/SermonCard';
import FilterModal from '@/components/ui/FilterModal';
import { SkeletonList } from '@/components/ui/SkeletonLoader';

export default function SermonsScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data states
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalSermons, setTotalSermons] = useState(0);

  // UI states
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Offline downloads functionality
  const {
    addDownload,
    isAvailableOffline,
    downloads
  } = useOfflineDownloads();

  // Load view mode preference
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('sermons_view_mode');
        if (savedMode && ['list', 'grid', 'compact'].includes(savedMode)) {
          setViewMode(savedMode as 'list' | 'grid' | 'compact');
        }
      } catch (err) {
        console.error('Failed to load view mode preference:', err);
      }
    };
    loadViewMode();
  }, []);

  // Save view mode preference
  useEffect(() => {
    const saveViewMode = async () => {
      try {
        await AsyncStorage.setItem('sermons_view_mode', viewMode);
      } catch (err) {
        console.error('Failed to save view mode preference:', err);
      }
    };
    saveViewMode();
  }, [viewMode]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!loading) {
      loadSermons(true);
    }
  }, [selectedSeries, selectedTopics, sortBy, sortOrder]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Data Loading (preserved business logic)
  // ============================================================================

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await retryUtils.retryContent(async () => {
        const [categoriesData, seriesData, topicsData] = await Promise.all([
          ContentService.getCategories(),
          ContentService.getSeries(),
          ContentService.getTopics(),
        ]);
        return { categoriesData, seriesData, topicsData };
      });

      if (result.success && result.data) {
        const { categoriesData, seriesData, topicsData } = result.data;
        setCategories(categoriesData);
        setSeries(seriesData);
        setTopics(topicsData);
        await loadSermons(true);
      } else {
        throw result.error || new Error('Failed to load initial data');
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      const appError = errorHandler.handleContentError(err, {
        component: 'SermonsScreen',
        action: 'loadInitialData',
      });
      setError(appError.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSermons = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setCurrentPage(1);
        setHasMore(true);
      }

      if (!hasMore && !reset) return;

      const page = reset ? 1 : currentPage;
      setLoadingMore(true);

      const searchParams: ContentSearchParams = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
        published: true,
      };

      if (searchQuery) {
        searchParams.query = searchQuery;
      }

      // Handle series and topics filtering
      if (selectedSeries || selectedTopics.length > 0) {
        let filteredSermons: Sermon[] = [];

        if (selectedSeries && selectedTopics.length > 0) {
          const seriesSermons = await ContentService.getSermonsBySeries(selectedSeries);
          const topicSermons = await ContentService.getSermonsByTopics(selectedTopics);
          const topicSermonIds = new Set(topicSermons.map(s => s.id));
          filteredSermons = seriesSermons.filter(sermon => topicSermonIds.has(sermon.id));
        } else if (selectedSeries) {
          filteredSermons = await ContentService.getSermonsBySeries(selectedSeries);
        } else {
          const topicSermons = await ContentService.getSermonsByTopics(selectedTopics);
          const uniqueSermonIds = new Set<string>();
          filteredSermons = topicSermons.filter(sermon => {
            if (uniqueSermonIds.has(sermon.id)) return false;
            uniqueSermonIds.add(sermon.id);
            return true;
          });
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredSermons = filteredSermons.filter(sermon =>
            sermon.title.toLowerCase().includes(query) ||
            sermon.preacher.toLowerCase().includes(query) ||
            sermon.description?.toLowerCase().includes(query)
          );
        }

        filteredSermons.sort((a, b) => {
          let compareResult = 0;
          switch (sortBy) {
            case 'title':
              compareResult = a.title.localeCompare(b.title);
              break;
            case 'popularity':
              compareResult = (b.downloads || 0) - (a.downloads || 0);
              break;
            case 'date':
            default:
              compareResult = new Date(b.date).getTime() - new Date(a.date).getTime();
              break;
          }
          return sortOrder === 'asc' ? -compareResult : compareResult;
        });

        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        const paginatedSermons = filteredSermons.slice(startIndex, endIndex);

        if (reset) {
          setSermons(paginatedSermons);
        } else {
          setSermons(prev => [...prev, ...paginatedSermons]);
        }

        setTotalSermons(filteredSermons.length);
        setHasMore(endIndex < filteredSermons.length);
        setCurrentPage(page + 1);
        return;
      }

      const result = await retryUtils.retryContent(async () => {
        return await ContentService.getSermons(searchParams);
      });

      if (result.success && result.data) {
        const response = result.data;
        if (reset) {
          setSermons(response.data);
        } else {
          setSermons(prev => [...prev, ...response.data]);
        }
        setTotalSermons(response.total);
        setHasMore(response.hasMore);
        setCurrentPage(page + 1);
      } else {
        throw result.error || new Error('Failed to load sermons');
      }
    } catch (err) {
      console.error('Failed to load sermons:', err);
      const appError = errorHandler.handleContentError(err, {
        component: 'SermonsScreen',
        action: 'loadSermons',
        additionalData: { reset, page: currentPage },
      });
      if (reset) {
        setError(appError.userMessage);
      } else {
        Alert.alert('Error', appError.userMessage);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, searchQuery, selectedSeries, selectedTopics, sortBy, sortOrder]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => loadSermons(true), 500);
    } else if (query.length === 0) {
      loadSermons(true);
    }
  }, [loadSermons]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadSermons(false);
  };

  const handleSermonPress = (sermon: Sermon) => router.push(`/sermon/${sermon.id}`);
  const handlePlayPress = (sermon: Sermon) => router.push(`/sermon/${sermon.id}`);

  const handleDownloadPress = async (sermon: Sermon) => {
    try {
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        Alert.alert('Already Downloaded', `${sermon.title} is already available offline.`);
        return;
      }
      await addDownload('audio', sermon.title, sermon.audio_url, {
        contentId: sermon.id,
        preacher: sermon.preacher,
        date: sermon.date,
        duration: sermon.duration,
        thumbnail_url: sermon.thumbnail_url,
        description: sermon.description,
      });
      Alert.alert('Download Started', `${sermon.title} is now downloading.`);
    } catch (err) {
      console.error('Failed to download sermon:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download sermon';
      Alert.alert('Download Failed', `${errorMessage}. Please check your connection.`, [
        { text: 'OK' },
        { text: 'Retry', onPress: () => handleDownloadPress(sermon) },
      ]);
    }
  };

  const handleSharePress = async (sermon: Sermon) => {
    try {
      await Share.share({
        message: `Check out this sermon: "${sermon.title}" by ${sermon.preacher}`,
        title: `TRUEVINE FELLOWSHIP - ${sermon.title}`,
      });
    } catch (err) {
      console.error('Failed to share sermon:', err);
    }
  };

  const clearFilters = () => {
    setSelectedSeries(null);
    setSelectedTopics([]);
    setSortBy('date');
    setSortOrder('desc');
  };

  // ============================================================================
  // Sort options
  // ============================================================================

  const currentSortKey = `${sortBy}_${sortOrder}`;

  const sortOptions = [
    { key: 'date_desc', label: 'Newest First', icon: 'arrow-downward' },
    { key: 'date_asc', label: 'Oldest First', icon: 'arrow-upward' },
    { key: 'title_asc', label: 'A → Z', icon: 'sort-by-alpha' },
    { key: 'title_desc', label: 'Z → A', icon: 'sort-by-alpha' },
    { key: 'popularity_desc', label: 'Most Popular', icon: 'trending-up' },
  ];

  const handleSortSelect = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('_') as ['date' | 'title' | 'popularity', 'asc' | 'desc'];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const numColumns = viewMode === 'grid' ? 2 : 1;

  const renderSermonCard = ({ item: sermon }: { item: Sermon; index: number }) => {
    const variant = viewMode === 'compact' ? 'compact' : viewMode === 'grid' ? 'grid' : 'default';

    return (
      <SermonCard
        sermon={sermon}
        variant={variant}
        onPress={() => handleSermonPress(sermon)}
        onPlay={() => handlePlayPress(sermon)}
        onDownload={() => handleDownloadPress(sermon)}
        onShare={() => handleSharePress(sermon)}
        showActions={viewMode !== 'compact' && viewMode !== 'grid'}
      />
    );
  };

  const renderHeader = () => (
    <>
      {/* Page Title */}
      <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <Text style={{ ...theme.typography.displayMedium, color: theme.colors.text }}>
          Sermons
        </Text>
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.xxs }}>
          {totalSermons > 0 ? `${totalSermons} sermons available` : 'Browse our sermon library'}
        </Text>
      </View>

      {/* View Mode Toggle + Sort */}
      <View style={[staticStyles.viewModeRow, { marginBottom: theme.spacing.sm }]}>
        <View style={staticStyles.viewModeGroup}>
          {(['list', 'grid', 'compact'] as const).map((mode) => {
            const icons = { list: 'view-list', grid: 'view-module', compact: 'view-headline' };
            const isActive = viewMode === mode;
            return (
              <IconButton
                key={mode}
                icon={icons[mode]}
                size={20}
                iconColor={isActive ? theme.colors.primary : theme.colors.textTertiary}
                style={[
                  staticStyles.viewModeBtn,
                  isActive && { backgroundColor: theme.colors.primaryContainer },
                ]}
                onPress={() => setViewMode(mode)}
              />
            );
          })}
        </View>
        <IconButton
          icon="sort"
          size={20}
          iconColor={theme.colors.textSecondary}
          style={staticStyles.viewModeBtn}
          onPress={() => setSortModalVisible(true)}
        />
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search by title, preacher..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={[staticStyles.searchBar, {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.borderRadius.md,
        }]}
        inputStyle={{ ...theme.typography.bodyMedium }}
        icon="magnify"
        onClearIconPress={() => {
          setSearchQuery('');
          loadSermons(true);
        }}
      />

      {/* Filters Row */}
      <View style={[staticStyles.filtersRow, { marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }]}>
        <CustomDropdown
          options={[
            { id: 'all-series', label: 'All Series', value: null },
            ...series.map(s => ({ id: s.id, label: s.name, value: s.id })),
          ]}
          selectedValue={selectedSeries}
          onSelect={(value) => setSelectedSeries(value)}
          placeholder="All Series"
          variant="light"
        />

        <CustomDropdown
          options={topics.map(t => ({ id: t.id, label: t.name, value: t.id }))}
          selectedValues={selectedTopics}
          onSelect={() => { }}
          onMultiSelect={(values) => setSelectedTopics(values)}
          placeholder="All Topics"
          variant="dark"
          multiSelect={true}
        />

        {(selectedSeries || selectedTopics.length > 0) && (
          <TouchableOpacity
            onPress={clearFilters}
            style={[staticStyles.clearBtn, { backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.sm }]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderFooter = () => {
    if (loadingMore) return <SkeletonList type="sermon" count={2} />;
    return null;
  };

  const renderEmpty = () => (
    <EmptyState
      icon="music-note"
      title="No sermons found"
      message={
        searchQuery || selectedSeries || selectedTopics.length > 0
          ? 'No sermons match your current filters. Try adjusting your search criteria.'
          : 'No sermons available at the moment. Check back later for new content.'
      }
      actionLabel="Clear filters"
      onAction={clearFilters}
    />
  );

  if (loading) {
    return <LoadingSpinner type="content" message="Loading sermons" />;
  }

  if (error) {
    return (
      <ErrorState
        icon="error"
        title="Failed to load sermons"
        message={error}
        actionLabel="Try Again"
        onAction={() => {
          setError(null);
          loadInitialData();
        }}
      />
    );
  }

  return (
    <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        key={viewMode}
        data={sermons}
        renderItem={renderSermonCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          { padding: theme.spacing.md },
          sermons.length === 0 && { flexGrow: 1 },
        ]}
        {...(numColumns === 2 && {
          columnWrapperStyle: { gap: theme.spacing.sm },
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        numColumns={numColumns}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      />

      {/* Sort Modal */}
      <FilterModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        title="Sort By"
        options={sortOptions}
        selectedValue={currentSortKey}
        onSelect={handleSortSelect}
      />
    </View>
  );
}

// Static styles — NOT inside the component render
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewModeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeBtn: {
    margin: 0,
  },
  searchBar: {
    elevation: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
