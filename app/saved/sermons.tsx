import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Share } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedContent } from '@/lib/hooks/useSavedContent';
import { Sermon } from '@/types/content';
import SermonCard from '@/components/ui/SermonCard';
import { EmptyState, LoadingSpinner, ContentSkeleton } from '@/components/ui/LoadingStates';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';

export default function SavedSermonsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedContent = [], isLoading, refreshSavedContent, unsaveContent } = useSavedContent();
  const { addDownload, isAvailableOffline, downloads } = useOfflineDownloads();
  const [sermonDownloadStatus, setSermonDownloadStatus] = useState<Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Monitor download progress
  useEffect(() => {
    if (!savedContent || savedContent.length === 0) return;

    setSermonDownloadStatus(prevStatus => {
      const updatedStatus: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};

      savedContent.forEach(item => {
        const sermon = item.content as Sermon;
        if (!sermon || !('duration' in sermon)) return;
        const currentStatus = prevStatus[sermon.id] || 'idle';
        const downloadItem = downloads.find(d => d.metadata?.contentId === sermon.id);

        if (downloadItem) {
          switch (downloadItem.status) {
            case 'downloading':
            case 'paused':
              updatedStatus[sermon.id] = 'downloading';
              break;
            case 'completed':
              updatedStatus[sermon.id] = 'downloaded';
              break;
            case 'failed':
              updatedStatus[sermon.id] = 'error';
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
  }, [downloads, savedContent]);

  // check initial download statuses
  useEffect(() => {
    const checkStatuses = async () => {
      const statusMap: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};
      for (const item of savedContent) {
        const sermon = item.content as Sermon;
        if (!sermon || !('duration' in sermon)) continue;
        if (!sermon.audio_url) {
          statusMap[sermon.id] = 'idle';
          continue;
        }
        try {
          const isDownloaded = await isAvailableOffline(sermon.audio_url);
          statusMap[sermon.id] = isDownloaded ? 'downloaded' : 'idle';
        } catch (err) {
          statusMap[sermon.id] = 'error';
        }
      }
      setSermonDownloadStatus(statusMap);
    };
    if (savedContent && savedContent.length > 0) {
      checkStatuses();
    }
  }, [savedContent, isAvailableOffline]);
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

  const handleSermonDownload = async (sermon: Sermon) => {
    if (!sermon.audio_url) {
      Alert.alert('Not Available', 'This sermon does not have an audio file to download.');
      return;
    }
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
      Alert.alert('Download Failed', 'Please check your connection.', [
        { text: 'OK', style: 'default' },
        { text: 'Retry', style: 'default', onPress: () => handleSermonDownload(sermon) },
      ]);
    }
  };

  const handleSermonShare = async (sermon: Sermon) => {
    try {
      await Share.share({
        message: `Check out this sermon: "${sermon.title}" by ${sermon.preacher}`,
        title: sermon.title,
      });
    } catch (err) {
      console.error('Failed to share sermon:', err);
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
      paddingTop: Math.max(insets.top, theme.spacing.md),
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
                <SermonCard
                  sermon={sermon}
                  variant="default"
                  onPress={() => handleCardPress(sermon)}
                  onPlay={() => handleCardPress(sermon)}
                  onDownload={() => handleSermonDownload(sermon)}
                  onShare={() => handleSermonShare(sermon)}
                  onSave={() => handleRemoveBookmark(sermon)}
                  isSaved={true}
                  downloadStatus={sermonDownloadStatus[sermon.id] || 'idle'}
                  showActions={true}
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

