import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Alert, FlatList, TouchableOpacity, Share } from 'react-native';
import {
  Text,
  Searchbar,
  useTheme as usePaperTheme,
  Button,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Article, Category, Series, Topic, ContentSearchParams } from '@/types/content';
import CustomDropdown from '@/components/ui/CustomDropdown';
// New design system components
import BlogCard from '@/components/ui/BlogCard';
import FilterModal from '@/components/ui/FilterModal';
import { SkeletonList } from '@/components/ui/SkeletonLoader';
import { useSavedContent } from '@/lib/hooks/useSavedContent';

export default function ArticlesScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
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
  const [totalArticles, setTotalArticles] = useState(0);

  // UI states
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Saved content
  const { isContentSaved, toggleSave } = useSavedContent();

  // ============================================================================
  // Data Loading (preserved business logic)
  // ============================================================================

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (!loading) loadArticles(true);
  }, [selectedSeries, selectedTopics, sortBy, sortOrder]);

  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, seriesData, topicsData] = await Promise.all([
        ContentService.getCategories(),
        ContentService.getSeries(),
        ContentService.getTopics(),
      ]);

      setCategories(categoriesData);
      setSeries(seriesData);
      setTopics(topicsData);
      await loadArticles(true);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load article data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = useCallback(async (reset = false) => {
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

      if (searchQuery) searchParams.query = searchQuery;

      // Handle series and topics filtering
      if (selectedSeries || selectedTopics.length > 0) {
        let filteredArticles: Article[] = [];

        if (selectedSeries && selectedTopics.length > 0) {
          const seriesArticles = await ContentService.getArticlesBySeries(selectedSeries);
          const topicArticles = await ContentService.getArticlesByTopics(selectedTopics);
          const topicArticleIds = new Set(topicArticles.map(a => a.id));
          filteredArticles = seriesArticles.filter(article => topicArticleIds.has(article.id));
        } else if (selectedSeries) {
          filteredArticles = await ContentService.getArticlesBySeries(selectedSeries);
        } else {
          const topicArticles = await ContentService.getArticlesByTopics(selectedTopics);
          const uniqueArticleIds = new Set<string>();
          filteredArticles = topicArticles.filter(article => {
            if (uniqueArticleIds.has(article.id)) return false;
            uniqueArticleIds.add(article.id);
            return true;
          });
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredArticles = filteredArticles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            article.author.toLowerCase().includes(query) ||
            article.excerpt?.toLowerCase().includes(query) ||
            article.content?.toLowerCase().includes(query)
          );
        }

        filteredArticles.sort((a, b) => {
          let compareResult = 0;
          switch (sortBy) {
            case 'title': compareResult = a.title.localeCompare(b.title); break;
            case 'popularity': compareResult = (b.views || 0) - (a.views || 0); break;
            case 'date':
            default: compareResult = new Date(b.published_at).getTime() - new Date(a.published_at).getTime(); break;
          }
          return sortOrder === 'asc' ? -compareResult : compareResult;
        });

        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        if (reset) setArticles(paginatedArticles);
        else setArticles(prev => [...prev, ...paginatedArticles]);

        setTotalArticles(filteredArticles.length);
        setHasMore(endIndex < filteredArticles.length);
        setCurrentPage(page + 1);
        return;
      }

      const response = await ContentService.getArticles(searchParams);

      if (reset) setArticles(response.data);
      else setArticles(prev => [...prev, ...response.data]);

      setTotalArticles(response.total);
      setHasMore(response.hasMore);
      setCurrentPage(page + 1);
    } catch (err) {
      console.error('Failed to load articles:', err);
      if (reset) setError('Failed to load articles. Please try again.');
      else Alert.alert('Error', 'Failed to load articles. Please try again.');
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
      searchTimeoutRef.current = setTimeout(() => loadArticles(true), 500);
    } else if (query.length === 0) {
      loadArticles(true);
    }
  }, [loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) loadArticles(false);
  };

  const handleArticlePress = (article: Article) => router.push(`/article/${article.id}`);

  const handleSharePress = async (article: Article) => {
    try {
      await Share.share({
        message: `Check out this article: "${article.title}" by ${article.author}`,
        title: article.title,
      });
    } catch (err) {
      console.error('Failed to share article:', err);
    }
  };

  const handleBookmarkPress = async (article: Article) => {
    try {
      await toggleSave('article', article.id);
    } catch (err) {
      console.error('Failed to bookmark article:', err);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    }
  };

  const clearFilters = () => {
    setSelectedSeries(null);
    setSelectedTopics([]);
    setSortBy('date');
    setSortOrder('desc');
  };

  // ============================================================================
  // Sort
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

  const renderArticleCard = ({ item: article }: { item: Article; index: number }) => (
    <BlogCard
      article={article}
      variant="default"
      onPress={() => handleArticlePress(article)}
      onShare={() => handleSharePress(article)}
      onSave={() => handleBookmarkPress(article)}
      isSaved={isContentSaved('article', article.id)}
    />
  );

  const renderHeader = () => (
    <>
      {/* Page Title */}
      <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <Text style={{ ...theme.typography.displayMedium, color: theme.colors.text }}>
          Articles
        </Text>
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.xxs }}>
          {totalArticles > 0 ? `${totalArticles} articles available` : 'Browse our article library'}
        </Text>
      </View>

      {/* Sort button */}
      <View style={[staticStyles.sortRow, { marginBottom: theme.spacing.sm }]}>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="sort"
          size={20}
          iconColor={theme.colors.textSecondary}
          style={{ margin: 0 }}
          onPress={() => setSortModalVisible(true)}
        />
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search by title, author..."
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
          loadArticles(true);
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
    if (loadingMore) return <SkeletonList type="article" count={2} />;
    return null;
  };

  const renderEmpty = () => (
    <View style={[staticStyles.emptyContainer, { padding: theme.spacing.xl }]}>
      <MaterialIcons name="article" size={64} color={theme.colors.textTertiary} />
      <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md }}>
        {searchQuery || selectedSeries || selectedTopics.length > 0
          ? 'No articles match your current filters.'
          : 'No articles available yet. Check back later!'}
      </Text>
      {(searchQuery || selectedSeries || selectedTopics.length > 0) && (
        <Button
          mode="text"
          onPress={clearFilters}
          textColor={theme.colors.primary}
          style={{ marginTop: theme.spacing.sm }}
        >
          Clear Filters
        </Button>
      )}
    </View>
  );

  // ============================================================================
  // Full-screen loading / error states
  // ============================================================================

  if (loading) {
    return (
      <View style={[staticStyles.container, staticStyles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
          Loading articles...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[staticStyles.container, staticStyles.centered, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md }}>
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={() => { setError(null); loadInitialData(); }}
          style={{ marginTop: theme.spacing.md }}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          { padding: theme.spacing.md },
          articles.length === 0 && { flexGrow: 1 },
        ]}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
