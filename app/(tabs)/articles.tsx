import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, FlatList, Modal, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  FAB,
  Menu,
  Divider,
  IconButton,
  Badge,
  Avatar,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Article, Category, Series, Topic, ContentSearchParams } from '@/types/content';
import CustomDropdown from '@/components/ui/CustomDropdown';

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.md,
    },
    // Header section - matches design system
    header: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    // Search and filters
    searchBar: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    categories: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    // Article cards - matches design system
    card: {
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.medium,
    },
    cardContent: {
      padding: theme.spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    authorInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 26,
    },
    cardAuthor: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    cardExcerpt: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    cardActions: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: theme.spacing.lg,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    readingTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!loading) {
      loadArticles(true);
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
    } catch (error) {
      console.error('Failed to load initial data:', error);
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

      if (searchQuery) {
        searchParams.query = searchQuery;
      }

      // Handle series and topics filtering
      if (selectedSeries || selectedTopics.length > 0) {
        let filteredArticles: Article[] = [];

        // Get articles by series or topics
        if (selectedSeries && selectedTopics.length > 0) {
          // Both series and topics selected
          // Get articles from the series
          const seriesArticles = await ContentService.getArticlesBySeries(selectedSeries);

          // Get articles with any of the selected topics
          const topicArticles = await ContentService.getArticlesByTopics(selectedTopics);

          // Create a Set of article IDs that have at least one of the selected topics
          const topicArticleIds = new Set(topicArticles.map(a => a.id));

          // Filter articles: must be in series AND have at least one of the selected topics
          filteredArticles = seriesArticles.filter(article => topicArticleIds.has(article.id));
        } else if (selectedSeries) {
          // Only series selected
          filteredArticles = await ContentService.getArticlesBySeries(selectedSeries);
        } else {
          // Only topics selected - articles with ANY of the selected topics
          const topicArticles = await ContentService.getArticlesByTopics(selectedTopics);

          // Remove duplicates (an article can have multiple of the selected topics)
          const uniqueArticleIds = new Set<string>();
          filteredArticles = topicArticles.filter(article => {
            if (uniqueArticleIds.has(article.id)) {
              return false;
            }
            uniqueArticleIds.add(article.id);
            return true;
          });
        }

        // Apply search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredArticles = filteredArticles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            article.author.toLowerCase().includes(query) ||
            article.excerpt?.toLowerCase().includes(query) ||
            article.content?.toLowerCase().includes(query)
          );
        }

        // Apply sorting
        filteredArticles.sort((a, b) => {
          let compareResult = 0;

          switch (sortBy) {
            case 'title':
              compareResult = a.title.localeCompare(b.title);
              break;
            case 'popularity':
              compareResult = (b.views || 0) - (a.views || 0);
              break;
            case 'date':
            default:
              compareResult = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
              break;
          }

          return sortOrder === 'asc' ? -compareResult : compareResult;
        });

        // Apply pagination
        const startIndex = (page - 1) * 20;
        const endIndex = startIndex + 20;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

        if (reset) {
          setArticles(paginatedArticles);
        } else {
          setArticles(prev => [...prev, ...paginatedArticles]);
        }

        setTotalArticles(filteredArticles.length);
        setHasMore(endIndex < filteredArticles.length);
        setCurrentPage(page + 1);
        return;
      }

      // Use standard ContentService.getArticles when no series/topics filters
      const response = await ContentService.getArticles(searchParams);

      if (reset) {
        setArticles(response.data);
      } else {
        setArticles(prev => [...prev, ...response.data]);
      }

      setTotalArticles(response.total);
      setHasMore(response.hasMore);
      setCurrentPage(page + 1);
    } catch (error) {
      console.error('Failed to load articles:', error);

      // Show user-friendly error message
      if (reset) {
        setError('Failed to load articles. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to load articles. Please try again.');
      }
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, searchQuery, selectedSeries, selectedTopics, sortBy, sortOrder]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        loadArticles(true);
      }, 500);
    } else if (query.length === 0) {
      // Clear search immediately
      loadArticles(true);
    }
  }, [loadArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadArticles(false);
    }
  };

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleReadPress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleSharePress = (article: Article) => {
    // TODO: Implement share functionality
    Alert.alert('Coming Soon', 'Share functionality will be implemented in the next phase.');
  };

  const handleBookmarkPress = (article: Article) => {
    // TODO: Implement bookmark functionality
    Alert.alert('Coming Soon', 'Bookmark functionality will be implemented in the next phase.');
  };

  const clearFilters = () => {
    setSelectedSeries(null);
    setSelectedTopics([]);
    setSortBy('date');
    setSortOrder('desc');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render article card
  const renderArticleCard = (item: { item: Article; index: number }) => {
    const article = item.item;
    return (
      <Card style={styles.card} onPress={() => handleArticlePress(article)}>
        <Card.Cover
          source={{
            uri: article.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image',
          }}
        />
        <Card.Content style={styles.cardContent}>
          {/* Article Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {article.title}
          </Text>

          {/* Article Header */}
          <View style={styles.cardHeader}>
            {article.is_featured && <Badge size={16}>Featured</Badge>}
          </View>

          {/* Article Meta */}
          <View style={styles.cardMeta}>
            <Text variant="bodySmall">{formatDate(article.published_at)}</Text>
            <Text style={styles.readingTime}>
              {calculateReadingTime(article.content)} min read
            </Text>
          </View>

          {/* Article Excerpt */}
          <Text style={styles.cardExcerpt} numberOfLines={3}>
            {article.excerpt}
          </Text>

        </Card.Content>

        {/* Article Actions */}
        <Card.Actions style={styles.cardActions}>
          <Button
            icon="book-open"
            mode="contained"
            onPress={() => handleReadPress(article)}
            compact
          >
            Read Article
          </Button>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TouchableOpacity
              onPress={() => handleSharePress(article)}
              style={{
                padding: theme.spacing.sm,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="share"
                size={32}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleBookmarkPress(article)}
              style={{
                padding: theme.spacing.sm,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="bookmark"
                size={32}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </Card.Actions>
      </Card>
    );
  };

  const keyExtractor = (item: Article) => item.id;

  const getItemLayout = (data: ArrayLike<Article> | null | undefined, index: number) => {
    if (!data) return { length: 0, offset: 0, index };
    const itemHeight = 450; // Approximate height for article card
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  };

  // Header component for FlatList
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Articles</Text>

        {/* Sort Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.sm }}>
          <TouchableOpacity
            onPress={() => setSortModalVisible(true)}
            style={{
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.surface,
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="sort"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search articles by title, author, or content..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
        onClearIconPress={() => {
          setSearchQuery('');
          loadArticles(true);
        }}
      />

      {/* Series, Topics, and Clear Button Row */}
      <View style={styles.categories}>
        <CustomDropdown
          options={[
            { id: 'all-series', label: 'All Series', value: null },
            ...series.map(s => ({ id: s.id, label: s.name, value: s.id }))
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

        <TouchableOpacity
          onPress={clearFilters}
          style={{
            marginBottom: theme.spacing.sm,
            marginLeft: theme.spacing.sm,
            height: 48,
            width: 48,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="delete"
            size={24}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  // Footer component for FlatList
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading more articles...</Text>
        </View>
      );
    }
    return null;
  };

  // Empty component for FlatList
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="article" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyText}>
        {searchQuery || selectedSeries || selectedTopics.length > 0
          ? 'No articles match your current filters. Try adjusting your search criteria.'
          : 'No articles available at the moment. Check back later for new content.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.emptyText}>Loading articles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={styles.emptyText}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => {
            setError(null);
            loadInitialData();
          }}
          style={{ marginTop: theme.spacing.md }}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          { padding: theme.spacing.md },
          articles.length === 0 && { flexGrow: 1 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
      />


      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: theme.spacing.md,
              width: '80%',
              maxWidth: 300,
            }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
            }}>
              Sort By
            </Text>

            <TouchableOpacity
              style={{
                padding: theme.spacing.md,
                borderRadius: 8,
                backgroundColor: sortBy === 'date' && sortOrder === 'desc' ? theme.colors.primary + '20' : 'transparent',
              }}
              onPress={() => {
                setSortBy('date');
                setSortOrder('desc');
                setSortModalVisible(false);
              }}
            >
              <Text style={{ color: theme.colors.text }}>Newest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: theme.spacing.md,
                borderRadius: 8,
                backgroundColor: sortBy === 'date' && sortOrder === 'asc' ? theme.colors.primary + '20' : 'transparent',
              }}
              onPress={() => {
                setSortBy('date');
                setSortOrder('asc');
                setSortModalVisible(false);
              }}
            >
              <Text style={{ color: theme.colors.text }}>Oldest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: theme.spacing.md,
                borderRadius: 8,
                backgroundColor: sortBy === 'title' && sortOrder === 'asc' ? theme.colors.primary + '20' : 'transparent',
              }}
              onPress={() => {
                setSortBy('title');
                setSortOrder('asc');
                setSortModalVisible(false);
              }}
            >
              <Text style={{ color: theme.colors.text }}>A-Z</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: theme.spacing.md,
                borderRadius: 8,
                backgroundColor: sortBy === 'title' && sortOrder === 'desc' ? theme.colors.primary + '20' : 'transparent',
              }}
              onPress={() => {
                setSortBy('title');
                setSortOrder('desc');
                setSortModalVisible(false);
              }}
            >
              <Text style={{ color: theme.colors.text }}>Z-A</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: theme.spacing.md,
                borderRadius: 8,
                backgroundColor: sortBy === 'popularity' ? theme.colors.primary + '20' : 'transparent',
              }}
              onPress={() => {
                setSortBy('popularity');
                setSortOrder('desc');
                setSortModalVisible(false);
              }}
            >
              <Text style={{ color: theme.colors.text }}>Popular</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* FAB for quick actions */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Implement quick actions menu
          Alert.alert('Coming Soon', 'Quick actions will be implemented in the next phase.');
        }}
      />
    </View>
  );
}
