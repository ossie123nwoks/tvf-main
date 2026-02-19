import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, Modal, TouchableOpacity, FlatList, useWindowDimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  FAB,
  IconButton,
  Badge,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { SearchService } from '@/lib/services/search';
import { Sermon, Category, Series, Topic, ContentSearchParams } from '@/types/content';
import {
  LoadingSpinner,
  LoadingPagination,
  ContentSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui/LoadingStates';
import { errorHandler } from '@/lib/utils/errorHandling';
import { retryUtils } from '@/lib/utils/retry';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { Share } from 'react-native';

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
  const isTablet = screenWidth >= 768;


  // Offline downloads functionality
  const { 
    addDownload, 
    isAvailableOffline, 
    downloads 
  } = useOfflineDownloads();
  

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
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    searchBar: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    categories: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    actionIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    actionIcon: {
      padding: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
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
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#6366F1', // Primary purple from design system
      borderWidth: 0,
      minWidth: 48,
    },
    iconButtonContent: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    playButton: {
      flex: 0.5,
      height: 48,
      borderRadius: 12,
    },
    // View mode toggle
    viewModeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    viewModeButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    viewModeButtonActive: {
      backgroundColor: theme.colors.primary + '20',
    },
    // Grid view styles
    gridCard: {
      flex: 1,
      margin: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    gridCardContent: {
      padding: theme.spacing.sm,
    },
    gridCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    gridCardSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    gridCardMeta: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    gridCardActions: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      flexDirection: 'column',
      gap: theme.spacing.xs,
    },
    // Compact view styles
    compactCard: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      elevation: 2,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    compactThumbnail: {
      width: 100,
      alignSelf: 'stretch',
    },
    compactContent: {
      flex: 1,
      padding: theme.spacing.sm,
      justifyContent: 'space-between',
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    compactMeta: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    compactActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    compactActionButton: {
      padding: theme.spacing.xs,
    },
  });

  // Load view mode preference
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('sermons_view_mode');
        if (savedMode && ['list', 'grid', 'compact'].includes(savedMode)) {
          setViewMode(savedMode as 'list' | 'grid' | 'compact');
        }
      } catch (error) {
        console.error('Failed to load view mode preference:', error);
      }
    };
    loadViewMode();
  }, []);

  // Save view mode preference
  useEffect(() => {
    const saveViewMode = async () => {
      try {
        await AsyncStorage.setItem('sermons_view_mode', viewMode);
      } catch (error) {
        console.error('Failed to save view mode preference:', error);
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use retry logic for initial data loading
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
        console.log('Loaded data:', { 
          categories: categoriesData?.length || 0, 
          series: seriesData?.length || 0, 
          topics: topicsData?.length || 0 
        });
        setCategories(categoriesData);
        setSeries(seriesData);
        setTopics(topicsData);

        await loadSermons(true);
      } else {
        throw result.error || new Error('Failed to load initial data');
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);

      // Create standardized error
      const appError = errorHandler.handleContentError(error, {
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
        
        // Get sermons by series or topics
        if (selectedSeries && selectedTopics.length > 0) {
          // Both series and topics selected
          // Get sermons from the series
          const seriesSermons = await ContentService.getSermonsBySeries(selectedSeries);
          
          // Get sermons with any of the selected topics
          const topicSermons = await ContentService.getSermonsByTopics(selectedTopics);
          
          // Create a Set of sermon IDs that have at least one of the selected topics
          const topicSermonIds = new Set(topicSermons.map(s => s.id));
          
          // Filter sermons: must be in series AND have at least one of the selected topics
          filteredSermons = seriesSermons.filter(sermon => topicSermonIds.has(sermon.id));
        } else if (selectedSeries) {
          // Only series selected
          filteredSermons = await ContentService.getSermonsBySeries(selectedSeries);
        } else {
          // Only topics selected - sermons with ANY of the selected topics
          const topicSermons = await ContentService.getSermonsByTopics(selectedTopics);
          
          // Remove duplicates (a sermon can have multiple of the selected topics)
          const uniqueSermonIds = new Set<string>();
          filteredSermons = topicSermons.filter(sermon => {
            if (uniqueSermonIds.has(sermon.id)) {
              return false;
            }
            uniqueSermonIds.add(sermon.id);
            return true;
          });
        }

        // Apply search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredSermons = filteredSermons.filter(sermon => 
            sermon.title.toLowerCase().includes(query) ||
            sermon.preacher.toLowerCase().includes(query) ||
            sermon.description?.toLowerCase().includes(query)
          );
        }

        // Apply sorting
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

        // Apply pagination
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
        additionalData: { reset, page: currentPage },
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
        loadSermons(true);
      }, 500);
    } else if (query.length === 0) {
      // Clear search immediately
      loadSermons(true);
    }
  }, [loadSermons]);

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
    // Navigate to sermon detail screen where audio player is implemented
    router.push(`/sermon/${sermon.id}`);
  };

  const handleDownloadPress = async (sermon: Sermon) => {
    try {
      // Check if already downloaded
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        Alert.alert(
          'Already Downloaded', 
          `${sermon.title} is already available offline. You can access it anytime without an internet connection.`
        );
        return;
      }
      
      // Add download
      await addDownload(
        'audio',
        sermon.title,
        sermon.audio_url,
        {
          contentId: sermon.id,
          preacher: sermon.preacher,
          date: sermon.date,
          duration: sermon.duration,
          thumbnail_url: sermon.thumbnail_url,
          description: sermon.description
        }
      );
      
      Alert.alert('Download Started', `${sermon.title} is now downloading. You can monitor progress in the Download Manager.`);
    } catch (error) {
      console.error('Failed to download sermon:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download sermon';
      Alert.alert(
        'Download Failed', 
        `${errorMessage}. Please check your internet connection and try again.`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            style: 'default',
            onPress: () => handleDownloadPress(sermon)
          }
        ]
      );
    }
  };

  const handleSharePress = async (sermon: Sermon) => {
    try {
      // Create share message
      const shareMessage = `Check out this sermon from TRUEVINE FELLOWSHIP Church!\n\n"${sermon.title}"\nby ${sermon.preacher}\n${formatDate(sermon.date)}\n\n${sermon.description}\n\nDownload the TRUEVINE FELLOWSHIP app to listen to more inspiring sermons!`;

      const result = await Share.share({
        message: shareMessage,
        title: `TRUEVINE FELLOWSHIP - ${sermon.title}`,
      });

      // Log successful share for analytics
      if (result.action === Share.sharedAction) {
        console.log('Sermon shared successfully:', sermon.id);
      }
    } catch (error) {
      console.error('Failed to share sermon:', error);
      Alert.alert('Share Failed', 'Unable to share this sermon. Please try again.');
    }
  };

  const clearFilters = () => {
    setSelectedSeries(null);
    setSelectedTopics([]);
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

  // Render functions for different view modes
  const renderListCard = (sermon: Sermon) => (
    <Card style={styles.card} onPress={() => handleSermonPress(sermon)}>
      <Card.Cover
        source={{
          uri: sermon.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image',
        }}
      />
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardTitle}>{sermon.title}</Text>
        <Text style={styles.cardSubtitle}>{sermon.preacher}</Text>

        <View style={styles.cardMeta}>
          <Text variant="bodySmall">
            {formatDate(sermon.date)} • {formatDuration(sermon.duration)}
          </Text>
          {sermon.is_featured && <Badge size={16}>Featured</Badge>}
        </View>

        <Text variant="bodySmall" numberOfLines={2}>
          {sermon.description}
        </Text>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button
          icon="play"
          mode="contained"
          onPress={() => handlePlayPress(sermon)}
          compact
          style={styles.playButton}
        >
          Play
        </Button>
        
        <View style={styles.actionIcons}>
          <TouchableOpacity
            onPress={() => handleDownloadPress(sermon)}
            style={styles.actionIcon}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="download" 
              size={28} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleSharePress(sermon)}
            style={styles.actionIcon}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="share" 
              size={28} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </Card.Actions>
    </Card>
  );

  const renderGridCard = (sermon: Sermon) => (
    <Card style={styles.gridCard} onPress={() => handleSermonPress(sermon)}>
      <Card.Cover
        source={{
          uri: sermon.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image',
        }}
      />
      <Card.Content style={styles.gridCardContent}>
        <Text style={styles.gridCardTitle} numberOfLines={2}>{sermon.title}</Text>
        <Text style={styles.gridCardSubtitle} numberOfLines={1}>{sermon.preacher}</Text>
        <Text style={styles.gridCardMeta}>
          {formatDate(sermon.date)} • {formatDuration(sermon.duration)}
        </Text>
      </Card.Content>

      <Card.Actions style={styles.gridCardActions}>
        <Button
          icon="play"
          mode="contained"
          onPress={() => handlePlayPress(sermon)}
          compact
          style={{ flex: 1 }}
        >
          Play
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderCompactCard = (sermon: Sermon) => (
    <TouchableOpacity 
      style={styles.compactCard} 
      onPress={() => handleSermonPress(sermon)}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: sermon.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image',
        }}
        style={styles.compactThumbnail}
        resizeMode="cover"
      />
      <View style={styles.compactContent}>
        <View>
          <Text style={styles.compactTitle} numberOfLines={1}>{sermon.title}</Text>
          <Text style={styles.compactMeta} numberOfLines={1}>{sermon.preacher}</Text>
          <Text style={styles.compactMeta}>
            {formatDate(sermon.date)} • {formatDuration(sermon.duration)}
          </Text>
        </View>
        <View style={styles.compactActions}>
          <TouchableOpacity
            onPress={() => handlePlayPress(sermon)}
            style={styles.compactActionButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="play-circle-filled" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDownloadPress(sermon)}
            style={styles.compactActionButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="download" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSharePress(sermon)}
            style={styles.compactActionButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="share" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSermonCard = (item: { item: Sermon; index: number }) => {
    const sermon = item.item;
    switch (viewMode) {
      case 'grid':
        return renderGridCard(sermon);
      case 'compact':
        return renderCompactCard(sermon);
      default:
        return renderListCard(sermon);
    }
  };

  const keyExtractor = (item: Sermon) => item.id;

  const getItemLayout = (data: ArrayLike<Sermon> | null | undefined, index: number) => {
    if (!data) return { length: 0, offset: 0, index };
    
    let itemHeight = 0;
    switch (viewMode) {
      case 'grid':
        itemHeight = 280; // Approximate height for grid card
        break;
      case 'compact':
        itemHeight = 100; // Height for compact card
        break;
      default:
        itemHeight = 400; // Approximate height for list card
    }
    
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
        <Text style={styles.title}>Sermons</Text>
        
        {/* View Mode Toggle and Filter/Sort Buttons */}
        <View style={styles.viewModeContainer}>
          <IconButton
            icon="view-list"
            size={20}
            iconColor={viewMode === 'list' ? theme.colors.primary : theme.colors.textSecondary}
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('list')}
          />
          <IconButton
            icon="view-module"
            size={20}
            iconColor={viewMode === 'grid' ? theme.colors.primary : theme.colors.textSecondary}
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('grid')}
          />
          <IconButton
            icon="view-headline"
            size={20}
            iconColor={viewMode === 'compact' ? theme.colors.primary : theme.colors.textSecondary}
            style={[
              styles.viewModeButton,
              viewMode === 'compact' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('compact')}
          />
          
          {/* Sort Button */}
          <IconButton
            icon="sort"
            size={20}
            iconColor={theme.colors.textSecondary}
            style={styles.viewModeButton}
            onPress={() => setSortModalVisible(true)}
          />
        </View>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search sermons by title, preacher, or content..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        icon="magnify"
        onClearIconPress={() => {
          setSearchQuery('');
          loadSermons(true);
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
          onSelect={() => {}}
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
      return <ContentSkeleton type="sermon" count={2} />;
    }
    return null;
  };

  // Empty component for FlatList
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
    <View style={styles.container}>
      <FlatList
        key={viewMode}
        data={sermons}
        renderItem={renderSermonCard}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          { padding: theme.spacing.md },
          sermons.length === 0 && { flexGrow: 1 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        numColumns={viewMode === 'grid' ? 2 : 1}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={viewMode !== 'grid' ? getItemLayout : undefined}
      />

      {/* FAB for quick actions */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Implement quick actions menu
          Alert.alert('Coming Soon', 'Quick actions will be implemented in the next phase.');
        }}
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
    </View>
  );
}
