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
  Badge
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Sermon, Category, ContentSearchParams } from '@/types/content';
import { LoadingSpinner, LoadingPagination, ContentSkeleton, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import { errorHandler } from '@/lib/utils/errorHandling';
import { retryUtils } from '@/lib/utils/retry';

export default function SermonsScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Data states
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalSermons, setTotalSermons] = useState(0);
  
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
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    cardActions: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
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
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (!loading) {
      loadSermons(true);
    }
  }, [selectedCategory, selectedTags, sortBy, sortOrder, showFeaturedOnly]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use retry logic for initial data loading
      const result = await retryUtils.retryContent(async () => {
        const [categoriesData, tagsData] = await Promise.all([
          ContentService.getCategories(),
          getUniqueTags()
        ]);
        return { categoriesData, tagsData };
      });

      if (result.success && result.data) {
        const { categoriesData, tagsData } = result.data;
        setCategories(categoriesData);
        setAllTags(tagsData);
        
        await loadSermons(true);
      } else {
        throw result.error || new Error('Failed to load initial data');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      
      // Create standardized error
      const appError = errorHandler.handleContentError(error, {
        component: 'SermonsScreen',
        action: 'loadInitialData'
      });

      setError(appError.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTags = async (): Promise<string[]> => {
    try {
      const { data: sermons } = await ContentService.getSermons({ limit: 100 });
      const tags = new Set<string>();
      sermons?.forEach(sermon => {
        if (sermon.tags && Array.isArray(sermon.tags)) {
          sermon.tags.forEach(tag => tags.add(tag));
        }
      });
      return Array.from(tags);
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  };

  const loadSermons = async (reset = false) => {
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

      // Use retry logic for network operations
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
    } catch (error) {
      console.error('Failed to load sermons:', error);
      
      // Create standardized error
      const appError = errorHandler.handleContentError(error, {
        component: 'SermonsScreen',
        action: 'loadSermons',
        additionalData: { reset, page: currentPage }
      });

      // Show user-friendly error message
      if (reset) {
        setError(appError.userMessage);
      } else {
        Alert.alert('Error', appError.userMessage);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        loadSermons(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (query.length === 0) {
      loadSermons(true);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadSermons(false);
    }
  };

  const handleSermonPress = (sermon: Sermon) => {
    router.push(`/sermon/${sermon.id}`);
  };

  const handlePlayPress = (sermon: Sermon) => {
    // TODO: Implement audio player
    Alert.alert('Coming Soon', 'Audio player will be implemented in the next phase.');
  };

  const handleDownloadPress = (sermon: Sermon) => {
    // TODO: Implement download functionality
    Alert.alert('Coming Soon', 'Download functionality will be implemented in the next phase.');
  };

  const handleSharePress = (sermon: Sermon) => {
    // TODO: Implement share functionality
    Alert.alert('Coming Soon', 'Share functionality will be implemented in the next phase.');
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setShowFeaturedOnly(false);
    setSortBy('date');
    setSortOrder('desc');
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (loading) {
    return (
      <LoadingSpinner 
        type="content" 
        message="Loading sermons..." 
        iconName="music-note"
      />
    );
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
          <Text style={styles.title}>Sermons</Text>
          <Text style={styles.subtitle}>
            {totalSermons} sermons available • Listen to inspiring messages
          </Text>
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search sermons by title, preacher, or content..."
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
            icon="delete-sweep"
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
          {categories.length > 0 ? (
            categories.map((category) => (
              <Chip
                key={category.id}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={{ marginRight: theme.spacing.sm }}
                icon={category.icon}
              >
                {category.name}
              </Chip>
            ))
          ) : (
            <ContentSkeleton type="category" count={3} />
          )}
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          <Text style={styles.cardSubtitle}>Popular Tags:</Text>
          {allTags.length > 0 ? (
            allTags.slice(0, 10).map((tag) => (
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
            ))
          ) : (
            <ContentSkeleton type="category" count={5} />
          )}
        </View>

        {/* Sermons List */}
        {sermons.length > 0 ? (
          <>
            {sermons.map((sermon) => (
            <Card 
              key={sermon.id} 
              style={styles.card}
              onPress={() => handleSermonPress(sermon)}
            >
              <Card.Cover 
                source={{ 
                  uri: sermon.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image' 
                }} 
              />
              <Card.Content style={styles.cardContent}>
                <Text style={styles.cardTitle}>{sermon.title}</Text>
                <Text style={styles.cardSubtitle}>{sermon.preacher}</Text>
                
                <View style={styles.cardMeta}>
                  <Text variant="bodySmall">
                    {formatDate(sermon.date)} • {formatDuration(sermon.duration)}
                  </Text>
                  {sermon.is_featured && (
                    <Badge size={16}>
                      Featured
                    </Badge>
                  )}
                </View>
                
                <Text variant="bodySmall" numberOfLines={2}>
                  {sermon.description}
                </Text>
                
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
              </Card.Content>
              
              <Card.Actions style={styles.cardActions}>
                <Button 
                  icon="play" 
                  mode="contained" 
                  onPress={() => handlePlayPress(sermon)}
                  compact
                >
                  Play
                </Button>
                <Button 
                  icon="download" 
                  mode="outlined" 
                  onPress={() => handleDownloadPress(sermon)}
                  compact
                >
                  Download
                </Button>
                <Button 
                  icon="share" 
                  mode="outlined" 
                  onPress={() => handleSharePress(sermon)}
                  compact
                >
                  Share
                </Button>
              </Card.Actions>
            </Card>
            ))}
            
            {/* Show skeleton loading when loading more */}
            {loadingMore && <ContentSkeleton type="sermon" count={2} />}
          </>
        ) : (
          <EmptyState
            icon="music-note"
            title="No sermons found"
            message={
              searchQuery || selectedCategory || selectedTags.length > 0
                ? 'No sermons match your current filters. Try adjusting your search criteria.'
                : 'No sermons available at the moment. Check back later for new content.'
            }
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
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
