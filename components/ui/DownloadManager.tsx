import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ProgressBar, IconButton, List, Chip, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface DownloadItem {
  id: string;
  title: string;
  type: 'sermon' | 'article';
  size: number; // in bytes
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  url: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface DownloadManagerProps {
  downloads: DownloadItem[];
  onDownload: (item: DownloadItem) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted?: () => void;
  onClearFailed?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function DownloadManager({
  downloads,
  onDownload,
  onPause,
  onResume,
  onCancel,
  onDelete,
  onRetry,
  onClearCompleted,
  onClearFailed,
  showActions = true,
  variant = 'default'
}: DownloadManagerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

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
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    stats: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.small,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    filters: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    filterChip: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    selectedFilterChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.textSecondary,
    },
    selectedFilterChipText: {
      color: '#FFFFFF',
    },
    downloadCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    downloadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    downloadIcon: {
      marginRight: theme.spacing.sm,
    },
    downloadInfo: {
      flex: 1,
    },
    downloadTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    downloadMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    downloadType: {
      // Style properties moved to textStyle
    },
    downloadSize: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    downloadStatus: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusPending: {
      color: theme.colors.warning,
    },
    statusDownloading: {
      color: theme.colors.info,
    },
    statusCompleted: {
      color: theme.colors.success,
    },
    statusFailed: {
      color: theme.colors.error,
    },
    statusPaused: {
      color: theme.colors.textSecondary,
    },
    progressContainer: {
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      height: variant === 'minimal' ? 4 : 6,
      borderRadius: variant === 'minimal' ? 2 : 3,
      backgroundColor: theme.colors.audioProgressBackground,
    },
    progressFill: {
      backgroundColor: theme.colors.audioProgress,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: theme.spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
    },
    actionButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    primaryActionButton: {
      backgroundColor: theme.colors.primary,
    },
    dangerActionButton: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      color: theme.colors.text,
    },
    primaryActionButtonText: {
      color: '#FFFFFF',
    },
    dangerActionButtonText: {
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    bulkActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
    },
  });

  const filteredDownloads = downloads.filter(item => {
    switch (selectedFilter) {
      case 'active':
        return item.status === 'pending' || item.status === 'downloading';
      case 'completed':
        return item.status === 'completed';
      case 'failed':
        return item.status === 'failed';
      default:
        return true;
    }
  });

  const stats = {
    total: downloads.length,
    active: downloads.filter(d => d.status === 'pending' || d.status === 'downloading').length,
    completed: downloads.filter(d => d.status === 'completed').length,
    failed: downloads.filter(d => d.status === 'failed').length,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'downloading':
        return styles.statusDownloading;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      case 'paused':
        return styles.statusPaused;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'downloading':
        return 'Downloading';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sermon':
        return 'headphones';
      case 'article':
        return 'article';
      default:
        return 'file-download';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sermon':
        return theme.colors.sermon;
      case 'article':
        return theme.colors.article;
      default:
        return theme.colors.primary;
    }
  };

  const renderDownloadItem = (item: DownloadItem) => (
    <Card key={item.id} style={styles.downloadCard}>
      <Card.Content>
        <View style={styles.downloadHeader}>
          <MaterialIcons
            name={getTypeIcon(item.type) as any}
            size={24}
            color={getTypeColor(item.type)}
            style={styles.downloadIcon}
          />
          <View style={styles.downloadInfo}>
            <Text style={styles.downloadTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.downloadMeta}>
              <Chip
                style={[{ backgroundColor: getTypeColor(item.type) + '20' }]}
                textStyle={{ color: getTypeColor(item.type), fontSize: 12, textTransform: 'uppercase' }}
                compact
              >
                {item.type}
              </Chip>
              <Text style={styles.downloadSize}>
                {formatFileSize(item.size)}
              </Text>
              <Text style={[styles.downloadStatus, getStatusColor(item.status)]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {(item.status === 'downloading' || item.status === 'pending') && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={item.progress / 100}
              color={theme.colors.audioProgress}
              style={styles.progressBar}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.audioProgress,
                  surface: theme.colors.audioProgressBackground,
                },
              }}
            />
            <Text style={styles.progressText}>
              {item.progress.toFixed(1)}%
            </Text>
          </View>
        )}

        {item.error && (
          <Text style={[styles.downloadStatus, styles.statusFailed]}>
            Error: {item.error}
          </Text>
        )}

        {showActions && (
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <Button
                mode="contained"
                onPress={() => onDownload(item)}
                style={styles.primaryActionButton}
                labelStyle={styles.primaryActionButtonText}
                compact
              >
                Start
              </Button>
            )}

            {item.status === 'downloading' && (
              <>
                <Button
                  mode="outlined"
                  onPress={() => onPause(item.id)}
                  style={styles.actionButton}
                  labelStyle={styles.actionButtonText}
                  compact
                >
                  Pause
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => onCancel(item.id)}
                  style={styles.actionButton}
                  labelStyle={styles.actionButtonText}
                  compact
                >
                  Cancel
                </Button>
              </>
            )}

            {item.status === 'paused' && (
              <Button
                mode="contained"
                onPress={() => onResume(item.id)}
                style={styles.primaryActionButton}
                labelStyle={styles.primaryActionButtonText}
                compact
              >
                Resume
              </Button>
            )}

            {item.status === 'failed' && (
              <Button
                mode="contained"
                onPress={() => onRetry(item.id)}
                style={styles.primaryActionButton}
                labelStyle={styles.primaryActionButtonText}
                compact
              >
                Retry
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => onDelete(item.id)}
              style={styles.dangerActionButton}
              labelStyle={styles.dangerActionButtonText}
              compact
            >
              Delete
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (downloads.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons
            name="cloud-download"
            size={64}
            color={theme.colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptyText}>
            You haven't downloaded any content yet. Start downloading sermons and articles to access them offline.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Download Manager</Text>
          <Text style={styles.subtitle}>
            Manage your offline content and monitor download progress.
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'completed', 'failed'] as const).map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.selectedFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                selectedFilter === filter && styles.selectedFilterChipText
              ]}
              compact
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>

        {filteredDownloads.map(renderDownloadItem)}

        {(onClearCompleted || onClearFailed) && (
          <View style={styles.bulkActions}>
            {onClearCompleted && stats.completed > 0 && (
              <Button
                mode="outlined"
                onPress={onClearCompleted}
                style={styles.actionButton}
                labelStyle={styles.actionButtonText}
              >
                Clear Completed ({stats.completed})
              </Button>
            )}
            {onClearFailed && stats.failed > 0 && (
              <Button
                mode="outlined"
                onPress={onClearFailed}
                style={styles.actionButton}
                labelStyle={styles.actionButtonText}
              >
                Clear Failed ({stats.failed})
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
