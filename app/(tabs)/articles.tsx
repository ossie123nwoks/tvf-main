import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
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
  Avatar
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Article, Category, ContentSearchParams } from '@/types/content';

export default function ArticlesScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  
  // UI states
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
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
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    cardContent: {
      padding: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    authorInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
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
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    cardExcerpt: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    cardActions: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
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
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
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
  }, [selectedCategory, selectedTags, sortBy, sortOrder, showFeaturedOnly]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        ContentService.getCategories(),
        getUniqueTags()
      ]);
      
      setCategories(categoriesData);
      setAllTags(tagsData);
      
      await loadArticles(true);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load article data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTags = async (): Promise<string[]> => {
    try {
      const { data: articles } = await ContentService.getArticles({ limit: 100 });
      const tags = new Set<string>();
      articles.forEach(article => article.tags.forEach(tag => tags.add(tag)));
      return Array.from(tags);
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  };

  const loadArticles = async (reset = false) => {
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
        featured: showFeaturedOnly ? true : undefined
      };

      if (searchQuery) {
        searchParams.query = searchQuery;
      }

      if (selectedCategory) {
        searchParams.category = selectedCategory;
      }

      if (selectedTags.length > 0) {
        searchParams.tags = selectedTags;
      }

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
      Alert.alert('Error', 'Failed to load articles. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        loadArticles(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (query.length === 0) {
      loadArticles(true);
    }
  }, []);

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
    setSelectedCategory(null);
    setSelectedTags([]);
    setShowFeaturedOnly(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.emptyText}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= 
              contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Articles</Text>
          <Text style={styles.subtitle}>
            {totalArticles} articles available • Read inspiring content and devotionals
          </Text>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search articles by title, author, or content..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
        />

        {/* Filters Row */}
        <View style={styles.filtersRow}>
          <Button
            mode="outlined"
            onPress={() => setFilterMenuVisible(true)}
            icon="filter-variant"
            compact
          >
            Filters
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => setSortMenuVisible(true)}
            icon="sort"
            compact
          >
            Sort
          </Button>
          
          <Button
            mode="outlined"
            onPress={clearFilters}
            icon="clear-all"
            compact
          >
            Clear
          </Button>
        </View>

        {/* Featured Toggle */}
        <Chip
          selected={showFeaturedOnly}
          onPress={() => setShowFeaturedOnly(!showFeaturedOnly)}
          icon={showFeaturedOnly ? "star" : "star-outline"}
          style={{ marginBottom: theme.spacing.md }}
        >
          Featured Only
        </Chip>

        {/* Categories */}
        <View style={styles.categories}>
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={{ marginRight: theme.spacing.sm }}
          >
            All Categories
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={{ marginRight: theme.spacing.sm }}
              icon={category.icon}
            >
              {category.name}
            </Chip>
          ))}
        </View>

        {/* Tags */}
        {allTags.length > 0 && (
          <View style={styles.tags}>
            <Text style={styles.cardExcerpt}>Popular Tags:</Text>
            {allTags.slice(0, 10).map((tag) => (
              <Chip
                key={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag) 
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
                style={{ marginRight: theme.spacing.sm, marginBottom: theme.spacing.sm }}
                compact
              >
                {tag}
              </Chip>
            ))}
          </View>
        )}

        {/* Articles List */}
        {articles.length > 0 ? (
          articles.map((article) => (
            <Card 
              key={article.id} 
              style={styles.card}
              onPress={() => handleArticlePress(article)}
            >
              <Card.Cover 
                source={{ 
                  uri: article.thumbnailUrl || 'https://via.placeholder.com/300x200?text=No+Image' 
                }} 
              />
              <Card.Content style={styles.cardContent}>
                {/* Article Header with Author */}
                <View style={styles.cardHeader}>
                  <Avatar.Text 
                    size={40} 
                    label={getInitials(article.author)}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <View style={styles.authorInfo}>
                    <Text style={styles.cardAuthor}>{article.author}</Text>
                    <Text variant="bodySmall">
                      {formatDate(article.publishedAt)}
                    </Text>
                  </View>
                  {article.isFeatured && (
                    <Badge size={16}>
                      Featured
                    </Badge>
                  )}
                </View>

                {/* Article Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                
                {/* Article Meta */}
                <View style={styles.cardMeta}>
                  <Text variant="bodySmall">
                    {formatDate(article.publishedAt)}
                  </Text>
                  <Text style={styles.readingTime}>
                    {calculateReadingTime(article.content)} min read
                  </Text>
                </View>
                
                {/* Article Excerpt */}
                <Text style={styles.cardExcerpt} numberOfLines={3}>
                  {article.excerpt}
                </Text>
                
                {/* Article Stats */}
                <View style={styles.stats}>
                                     <View style={styles.stat}>
                     <Text style={styles.statNumber}>{article.views}</Text>
                     <Text style={styles.statLabel}>Views</Text>
                   </View>
                   <View style={styles.stat}>
                     <Text style={styles.statNumber}>{article.tags.length}</Text>
                     <Text style={styles.statLabel}>Tags</Text>
                   </View>
                   <View style={styles.stat}>
                     <Text style={styles.statNumber}>
                       {calculateReadingTime(article.content)}
                     </Text>
                     <Text style={styles.statLabel}>Min Read</Text>
                   </View>
                </View>
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
                  <Button 
                    icon="share" 
                    mode="outlined" 
                    onPress={() => handleSharePress(article)}
                    compact
                  >
                    Share
                  </Button>
                  <Button 
                    icon="bookmark" 
                    mode="outlined" 
                    onPress={() => handleBookmarkPress(article)}
                    compact
                  >
                    Save
                  </Button>
                </View>
              </Card.Actions>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name="article" 
              size={64} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory || selectedTags.length > 0
                ? 'No articles match your current filters. Try adjusting your search criteria.'
                : 'No articles available at the moment. Check back later for new content.'
              }
            </Text>
          </View>
        )}

        {/* Load More Indicator */}
        {loadingMore && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading more articles...</Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Menu */}
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={<View />}
      >
        <Menu.Item
          leadingIcon="tag"
          title="Tags"
          onPress={() => setFilterMenuVisible(false)}
        />
        <Menu.Item
          leadingIcon="calendar"
          title="Date Range"
          onPress={() => setFilterMenuVisible(false)}
        />
        <Divider />
        <Menu.Item
          leadingIcon="clear"
          title="Clear All Filters"
          onPress={() => {
            clearFilters();
            setFilterMenuVisible(false);
          }}
        />
      </Menu>

      {/* Sort Menu */}
      <Menu
        visible={sortMenuVisible}
        onDismiss={() => setSortMenuVisible(false)}
        anchor={<View />}
      >
                 <Menu.Item
           leadingIcon="calendar"
           title="Date (Newest First)"
           onPress={() => {
             setSortBy('date');
             setSortOrder('desc');
             setSortMenuVisible(false);
           }}
         />
         <Menu.Item
           leadingIcon="calendar"
           title="Date (Oldest First)"
           onPress={() => {
             setSortBy('date');
             setSortOrder('asc');
             setSortMenuVisible(false);
           }}
         />
        <Menu.Item
          leadingIcon="sort-alphabetical-ascending"
          title="Title (A-Z)"
          onPress={() => {
            setSortBy('title');
            setSortOrder('asc');
            setSortMenuVisible(false);
          }}
        />
        <Menu.Item
          leadingIcon="sort-alphabetical-descending"
          title="Title (Z-A)"
          onPress={() => {
            setSortBy('title');
            setSortOrder('desc');
            setSortMenuVisible(false);
          }}
        />
        <Menu.Item
          leadingIcon="trending-up"
          title="Popularity"
          onPress={() => {
            setSortBy('popularity');
            setSortOrder('desc');
            setSortMenuVisible(false);
          }}
        />
      </Menu>

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
