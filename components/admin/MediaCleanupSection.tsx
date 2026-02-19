import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  ProgressBar,
  ActivityIndicator,
  Divider,
  Portal,
  Modal,
  Chip,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { MediaFile } from '@/types/admin';

interface MediaCleanupSectionProps {
  onCleanupComplete?: (result: any) => void;
}

interface CleanupResult {
  filesToDelete: MediaFile[];
  totalSize: number;
  count: number;
}

interface UsageStats {
  totalFiles: number;
  usedFiles: number;
  unusedFiles: number;
  totalSize: number;
  usedSize: number;
  unusedSize: number;
  typeStats: Record<string, number>;
  usageRate: number;
}

const MediaCleanupSection: React.FC<MediaCleanupSectionProps> = ({
  onCleanupComplete,
}) => {
  const { theme } = useTheme();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupOlderThanDays, setCleanupOlderThanDays] = useState(30);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: '48%',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
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
    },
    cleanupCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    cleanupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    cleanupContent: {
      marginBottom: theme.spacing.md,
    },
    cleanupActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    fileList: {
      maxHeight: 200,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    fileIcon: {
      marginRight: theme.spacing.md,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    fileMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    fileSize: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    fileDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxWidth: 500,
      width: '100%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    modalSection: {
      marginBottom: theme.spacing.md,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    modalText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    warningContainer: {
      backgroundColor: theme.colors.warningContainer,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    warningText: {
      color: theme.colors.warning,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    errorContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  // Load usage statistics
  const loadUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await AdminService.getMediaUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error('Error loading usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  // Load cleanup preview
  const loadCleanupPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.cleanupUnusedMediaFiles(cleanupOlderThanDays, true);
      setCleanupResult(result as any);
    } catch (err) {
      console.error('Error loading cleanup preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cleanup preview');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsageStats();
  }, []);

  // Load cleanup preview when days change
  useEffect(() => {
    if (cleanupOlderThanDays > 0) {
      loadCleanupPreview();
    }
  }, [cleanupOlderThanDays]);

  const handleCleanup = async () => {
    if (!cleanupResult || cleanupResult.count === 0) {
      Alert.alert('No Files', 'No unused files found to clean up.');
      return;
    }

    Alert.alert(
      'Confirm Cleanup',
      `Are you sure you want to delete ${cleanupResult.count} unused files (${formatFileSize(cleanupResult.totalSize)})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setCleanupInProgress(true);
              const result = await AdminService.cleanupUnusedMediaFiles(cleanupOlderThanDays, false);

              Alert.alert(
                'Cleanup Complete',
                `Successfully deleted ${result.deletedCount} files and freed up ${formatFileSize(result.totalSize)} of space.`
              );

              // Refresh data
              await loadUsageStats();
              await loadCleanupPreview();

              if (onCleanupComplete) {
                onCleanupComplete(result);
              }
            } catch (err) {
              console.error('Error during cleanup:', err);
              Alert.alert('Error', 'Failed to complete cleanup');
            } finally {
              setCleanupInProgress(false);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'music-note';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    return 'insert-drive-file';
  };

  const renderUsageStats = () => {
    if (!usageStats) return null;

    return (
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{usageStats.totalFiles}</Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{usageStats.usedFiles}</Text>
          <Text style={styles.statLabel}>Used Files</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{usageStats.unusedFiles}</Text>
          <Text style={styles.statLabel}>Unused Files</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{formatFileSize(usageStats.totalSize)}</Text>
          <Text style={styles.statLabel}>Total Size</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{formatFileSize(usageStats.unusedSize)}</Text>
          <Text style={styles.statLabel}>Unused Size</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{usageStats.usageRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Usage Rate</Text>
        </Card>
      </View>
    );
  };

  const renderCleanupPreview = () => {
    if (!cleanupResult) return null;

    return (
      <Card style={styles.cleanupCard}>
        <View style={styles.cleanupHeader}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Cleanup Preview</Text>
          <Chip mode="outlined">
            {cleanupOlderThanDays} days
          </Chip>
        </View>

        <View style={styles.cleanupContent}>
          <Text style={{ marginBottom: theme.spacing.sm }}>
            Files older than {cleanupOlderThanDays} days that are not being used:
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
              {cleanupResult.count}
            </Text>
            <Text style={{ marginLeft: theme.spacing.xs }}>
              files ({formatFileSize(cleanupResult.totalSize)})
            </Text>
          </View>

          {cleanupResult.count > 0 && (
            <View style={styles.fileList}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {cleanupResult.filesToDelete.slice(0, 10).map((file) => (
                  <View key={file.id} style={styles.fileItem}>
                    <MaterialIcons
                      name={getFileIcon(file.mimeType)}
                      size={20}
                      color={theme.colors.textSecondary}
                      style={styles.fileIcon}
                    />
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.filename}</Text>
                      <View style={styles.fileMeta}>
                        <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                        <Text style={styles.fileDate}>{formatDate(file.uploadedAt)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                {cleanupResult.count > 10 && (
                  <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
                    ... and {cleanupResult.count - 10} more files
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.cleanupActions}>
          <Button
            mode="outlined"
            onPress={() => setShowCleanupModal(true)}
            icon="cog"
          >
            Settings
          </Button>
          <Button
            mode="contained"
            onPress={handleCleanup}
            disabled={cleanupResult.count === 0 || cleanupInProgress}
            loading={cleanupInProgress}
            icon="delete-sweep"
          >
            {cleanupInProgress ? 'Cleaning...' : 'Clean Up'}
          </Button>
        </View>
      </Card>
    );
  };

  const renderCleanupModal = () => (
    <Portal>
      <Modal
        visible={showCleanupModal}
        onDismiss={() => setShowCleanupModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cleanup Settings</Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Cleanup Age</Text>
            <Text style={styles.modalText}>
              Delete unused files older than:
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
              {[7, 14, 30, 60, 90].map((days) => (
                <Chip
                  key={days}
                  selected={cleanupOlderThanDays === days}
                  onPress={() => setCleanupOlderThanDays(days)}
                  mode="outlined"
                >
                  {days} days
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ This action cannot be undone. Make sure you have backups of important files.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
            <Button mode="outlined" onPress={() => setShowCleanupModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => setShowCleanupModal(false)}>
              Save Settings
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  if (loading && !usageStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading cleanup data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadUsageStats}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Media Cleanup</Text>
        <Button
          mode="outlined"
          onPress={loadUsageStats}
          icon="refresh"
          compact
        >
          Refresh
        </Button>
      </View>

      {/* Usage Statistics */}
      {renderUsageStats()}

      {/* Cleanup Preview */}
      {renderCleanupPreview()}

      {/* Cleanup Modal */}
      {renderCleanupModal()}
    </View>
  );
};

export default MediaCleanupSection;
