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
import { Sermon } from '@/types/content';
import ContentCard from '@/components/ui/ContentCard';
import { EmptyState, LoadingSpinner, ContentSkeleton } from '@/components/ui/LoadingStates';

export default function SavedSermonsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { savedContent = [], isLoading, refreshSavedContent, unsaveContent } = useSavedContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dateSaved' | 'date' | 'title' | 'preacher'>('dateSaved');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Filter saved sermons with default fallback
  const savedSermons = React.useMemo(() => {
    try {
      if (!savedContent || !Array.isArray(savedContent) || savedContent.length === 0) {
        return [];
      }
      const filtered = savedContent
        .filter(item => item && item.content && 'duration' in item.content)
        .map(item => ({ sermon: item.content as Sermon, savedAt: item.savedAt }));
      return filtered;
    } catch (error) {
      console.error('Error in savedSermons useMemo:', error);
      return [];
    }
  }, [savedContent]);

  // Filter and sort sermons with default fallback
  const filteredSermons = React.useMemo(() => {
    try {
      if (!savedSermons || !Array.isArray(savedSermons) || savedSermons.length === 0) {
        return [];
      }
    
      const result = savedSermons
        .filter(({ sermon }) => {
          if (!sermon) return false;
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            (sermon.title?.toLowerCase().includes(query) || false) ||
            (sermon.preacher?.toLowerCase().includes(query) || false) ||
            (sermon.description?.toLowerCase().includes(query) || false)
          );
        })
        .sort((a, b) => {
          if (!a.sermon || !b.sermon) return 0;
          let comparison = 0;
          
          try {
            switch (sortBy) {
              case 'dateSaved':
                comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
                break;
              case 'date':
                comparison = new Date(a.sermon.date).getTime() - new Date(b.sermon.date).getTime();
                break;
              case 'title':
                comparison = (a.sermon.title || '').localeCompare(b.sermon.title || '');
                break;
              case 'preacher':
                comparison = (a.sermon.preacher || '').localeCompare(b.sermon.preacher || '');
                break;
            }
          } catch (error) {
            console.error('Error sorting sermons:', error);
            return 0;
          }
          
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      return result;
    } catch (error) {
      console.error('Error in filteredSermons useMemo:', error);
      return [];
    }
  }, [savedSermons, searchQuery, sortBy, sortOrder]);

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

  const handleRemoveBookmark = async (sermon: Sermon) => {
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove "${sermon.title}" from your saved sermons?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsaveContent('sermon', sermon.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCardPress = (sermon: Sermon) => {
    router.push(`/sermon/${sermon.id}`);
  };

  const handleActionPress = (sermon: Sermon, action: 'play' | 'download' | 'share' | 'bookmark') => {
    if (action === 'bookmark') {
      handleRemoveBookmark(sermon);
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

  if (isLoading && (!savedSermons || savedSermons.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor={theme.colors.text}
          />
          <Text style={styles.headerTitle}>Saved Sermons</Text>
        </View>
        <ContentSkeleton type="sermon" count={5} />
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
        <Text style={styles.headerTitle}>Saved Sermons</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.content}>
          {/* Stats */}
          {savedSermons && savedSermons.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{savedSermons.length}</Text>
                <Text style={styles.statLabel}>Total Saved</Text>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <Searchbar
            placeholder="Search saved sermons..."
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
              Sermon Date
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
              selected={sortBy === 'preacher'}
              onPress={() => {
                setSortBy('preacher');
                setSortOrder('asc');
              }}
            >
              Preacher
            </Chip>
          </View>

          {/* Sermons List */}
          {!filteredSermons || !Array.isArray(filteredSermons) || filteredSermons.length === 0 ? (
            <EmptyState
              icon="bookmark-outline"
              title={searchQuery ? 'No matching sermons' : 'No saved sermons'}
              message={
                searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start bookmarking sermons to see them here'
              }
            />
          ) : (
            (filteredSermons || []).map(({ sermon, savedAt }) => (
              <View key={sermon.id} style={{ marginBottom: theme.spacing.md }}>
                <ContentCard
                  content={sermon}
                  onPress={() => handleCardPress(sermon)}
                  onActionPress={(action) => handleActionPress(sermon, action)}
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

