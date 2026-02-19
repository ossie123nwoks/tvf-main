import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Button,
  useTheme as usePaperTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSavedContent } from '@/lib/hooks/useSavedContent';
import { Article } from '@/types/content';
import ContentCard from '@/components/ui/ContentCard';
import { EmptyState, LoadingSpinner, ContentSkeleton } from '@/components/ui/LoadingStates';

export default function SavedArticlesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { savedContent, isLoading, refreshSavedContent, unsaveContent } = useSavedContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dateSaved' | 'date' | 'title' | 'author'>('dateSaved');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Filter saved articles
  const savedArticles = useMemo(() => {
    if (!savedContent || !Array.isArray(savedContent) || savedContent.length === 0) return [];
    return savedContent
      .filter(item => item && item.content && 'excerpt' in item.content)
      .map(item => ({ article: item.content as Article, savedAt: item.savedAt }));
  }, [savedContent]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    if (!savedArticles || !Array.isArray(savedArticles) || savedArticles.length === 0) return [];
    
    return savedArticles
      .filter(({ article }) => {
        if (!article) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          (article.title?.toLowerCase().includes(query) || false) ||
          (article.author?.toLowerCase().includes(query) || false) ||
          (article.excerpt?.toLowerCase().includes(query) || false) ||
          (article.content?.toLowerCase().includes(query) || false)
        );
      })
      .sort((a, b) => {
        if (!a.article || !b.article) return 0;
        let comparison = 0;
        
        try {
          switch (sortBy) {
            case 'dateSaved':
              comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
              break;
            case 'date':
              comparison = new Date(a.article.published_at).getTime() - new Date(b.article.published_at).getTime();
              break;
            case 'title':
              comparison = (a.article.title || '').localeCompare(b.article.title || '');
              break;
            case 'author':
              comparison = (a.article.author || '').localeCompare(b.article.author || '');
              break;
          }
        } catch (error) {
          console.error('Error sorting articles:', error);
          return 0;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [savedArticles, searchQuery, sortBy, sortOrder]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSavedContent();
    setRefreshing(false);
  }, [refreshSavedContent]);

  // Refresh saved content when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshSavedContent();
    }, [refreshSavedContent])
  );

  const handleRemoveBookmark = async (article: Article) => {
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove "${article.title}" from your saved articles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsaveContent('article', article.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCardPress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleActionPress = (article: Article, action: 'play' | 'download' | 'share' | 'bookmark') => {
    if (action === 'bookmark') {
      handleRemoveBookmark(article);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.md,
    },
    searchBar: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

  if (isLoading && (!savedArticles || savedArticles.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor={theme.colors.text}
          />
          <Text style={styles.headerTitle}>Saved Articles</Text>
        </View>
        <ContentSkeleton type="article" count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          iconColor={theme.colors.text}
        />
        <Text style={styles.headerTitle}>Saved Articles</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          {/* Stats */}
          {savedArticles && savedArticles.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{savedArticles.length}</Text>
                <Text style={styles.statLabel}>Total Saved</Text>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <Searchbar
            placeholder="Search saved articles..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            icon="magnify"
            onClearIconPress={() => setSearchQuery('')}
          />

          {/* Sort Options */}
          <View style={styles.filters}>
            <Chip
              selected={sortBy === 'dateSaved'}
              onPress={() => {
                setSortBy('dateSaved');
                setSortOrder('desc');
              }}
              style={{ marginRight: theme.spacing.xs }}
            >
              Recently Saved
            </Chip>
            <Chip
              selected={sortBy === 'date'}
              onPress={() => {
                setSortBy('date');
                setSortOrder('desc');
              }}
              style={{ marginRight: theme.spacing.xs }}
            >
              Published Date
            </Chip>
            <Chip
              selected={sortBy === 'title'}
              onPress={() => {
                setSortBy('title');
                setSortOrder('asc');
              }}
              style={{ marginRight: theme.spacing.xs }}
            >
              Title
            </Chip>
            <Chip
              selected={sortBy === 'author'}
              onPress={() => {
                setSortBy('author');
                setSortOrder('asc');
              }}
            >
              Author
            </Chip>
          </View>

          {/* Articles List */}
          {!filteredArticles || filteredArticles.length === 0 ? (
            <EmptyState
              icon="bookmark-outline"
              title={searchQuery ? 'No matching articles' : 'No saved articles'}
              message={
                searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start bookmarking articles to see them here'
              }
            />
          ) : (
            filteredArticles.map(({ article, savedAt }) => (
              <View key={article.id} style={{ marginBottom: theme.spacing.md }}>
                <ContentCard
                  content={article}
                  onPress={() => handleCardPress(article)}
                  onActionPress={(action) => handleActionPress(article, action)}
                  showActions={true}
                  showStats={true}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textTertiary,
                    marginTop: theme.spacing.xs,
                    marginLeft: theme.spacing.sm,
                  }}
                >
                  Saved on {formatDate(savedAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

