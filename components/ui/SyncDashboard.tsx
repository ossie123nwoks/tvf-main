import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Chip,
  ProgressBar,
  Switch,
  Text,
  IconButton,
  Menu,
  Portal,
  Dialog,
  TextInput,
  Badge,
} from 'react-native-paper';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useSyncManager } from '../../lib/storage/useSyncManager';
import { MaterialIcons } from '@expo/vector-icons';

interface SyncDashboardProps {
  onClose?: () => void;
}

export const SyncDashboard: React.FC<SyncDashboardProps> = ({ onClose }) => {
  const { theme, isDark } = useTheme();
  const {
    syncQueue,
    activeSyncs,
    syncProgress,
    syncOptions,
    syncConflicts,
    syncStats,
    isSyncInProgress,
    isLoading,
    addToSyncQueue,
    startSync,
    pauseSync,
    resumeSync,
    retryFailedSyncs,
    clearCompletedSyncs,
    updateSyncOptions,
    resolveSyncConflict,
    triggerOfflineContentSync,
    getSyncStatusSummary,
    refreshData,
  } = useSyncManager();

  const [refreshing, setRefreshing] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleStartSync = async () => {
    try {
      await startSync();
      Alert.alert('Success', 'Sync started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start sync');
    }
  };

  const handlePauseSync = () => {
    pauseSync();
    Alert.alert('Sync Paused', 'Sync has been paused');
  };

  const handleResumeSync = async () => {
    try {
      await resumeSync();
      Alert.alert('Success', 'Sync resumed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resume sync');
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailedSyncs();
      Alert.alert('Success', 'Failed syncs will be retried');
    } catch (error) {
      Alert.alert('Error', 'Failed to retry failed syncs');
    }
  };

  const handleClearCompleted = async () => {
    Alert.alert('Clear Completed', 'Are you sure you want to clear all completed sync items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCompletedSyncs();
            Alert.alert('Success', 'Completed syncs cleared');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear completed syncs');
          }
        },
      },
    ]);
  };

  const handleOfflineContentSync = async () => {
    try {
      await triggerOfflineContentSync();
      Alert.alert('Success', 'Offline content synchronization triggered');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger offline content sync');
    }
  };

  const handleConflictResolution = (conflict: any, resolution: string) => {
    setSelectedConflict(conflict);
    setShowConflictDialog(true);
  };

  const confirmConflictResolution = async (resolution: string) => {
    if (!selectedConflict) return;

    try {
      await resolveSyncConflict(selectedConflict.syncItem.id, resolution as any);
      setShowConflictDialog(false);
      setSelectedConflict(null);
      Alert.alert('Success', 'Conflict resolved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conflict');
    }
  };

  const updateSyncOption = async (key: string, value: any) => {
    try {
      await updateSyncOptions({ [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update sync option');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      case 'in_progress':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.secondary;
      default:
        return theme.colors.disabled;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.disabled;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Title style={[styles.title, { color: theme.colors.onBackground }]}>Sync Dashboard</Title>
        {onClose && (
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor={theme.colors.onBackground}
          />
        )}
      </View>

      {/* Sync Status Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Sync Status</Title>

          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
              Status: {isSyncInProgress ? 'Running' : 'Idle'}
            </Text>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(isSyncInProgress ? 'in_progress' : 'completed') }}
              style={{
                borderColor: getStatusColor(isSyncInProgress ? 'in_progress' : 'completed'),
              }}
            >
              {isSyncInProgress ? 'Active' : 'Inactive'}
            </Chip>
          </View>

          {/* Sync Summary */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {getSyncStatusSummary().totalItems}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Items
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                {getSyncStatusSummary().offlineContentCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Offline Content
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                {getSyncStatusSummary().completedItems}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Completed
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                {getSyncStatusSummary().failedItems}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Failed
              </Text>
            </View>
          </View>

          {syncProgress.totalItems > 0 && (
            <>
              <View style={styles.progressRow}>
                <Text style={[styles.progressText, { color: theme.colors.onSurface }]}>
                  Progress: {syncProgress.completedItems}/{syncProgress.totalItems}
                </Text>
                <Text style={[styles.progressText, { color: theme.colors.onSurface }]}>
                  {Math.round((syncProgress.completedItems / syncProgress.totalItems) * 100)}%
                </Text>
              </View>

              <ProgressBar
                progress={
                  syncProgress.totalItems > 0
                    ? syncProgress.completedItems / syncProgress.totalItems
                    : 0
                }
                color={theme.colors.primary}
                style={styles.progressBar}
              />

              {syncProgress.estimatedTimeRemaining > 0 && (
                <Text style={[styles.progressText, { color: theme.colors.onSurface }]}>
                  Estimated time remaining: {formatTime(syncProgress.estimatedTimeRemaining)}
                </Text>
              )}

              <View style={styles.statsRow}>
                <Text style={[styles.statsText, { color: theme.colors.onSurface }]}>
                  Bytes: {formatBytes(syncProgress.bytesTransferred)} /{' '}
                  {formatBytes(syncProgress.totalBytes)}
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Sync Controls */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Sync Controls</Title>

          <View style={styles.controlsRow}>
            {!isSyncInProgress ? (
              <Button
                mode="contained"
                onPress={handleStartSync}
                disabled={syncQueue.length === 0}
                style={styles.controlButton}
                icon="play"
              >
                Start Sync
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handlePauseSync}
                style={[styles.controlButton, { backgroundColor: theme.colors.warning }]}
                icon="pause"
              >
                Pause Sync
              </Button>
            )}

            {!isSyncInProgress && syncQueue.length > 0 && (
              <Button
                mode="outlined"
                onPress={handleResumeSync}
                style={styles.controlButton}
                icon="play-arrow"
              >
                Resume
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={handleRetryFailed}
              disabled={syncProgress.failedItems === 0}
              style={styles.controlButton}
              icon="refresh"
            >
              Retry Failed
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearCompleted}
              disabled={syncProgress.completedItems === 0}
              style={styles.controlButton}
              icon="delete-sweep"
            >
              Clear Completed
            </Button>

            <Button
              mode="outlined"
              onPress={handleOfflineContentSync}
              style={styles.controlButton}
              icon="cloud-sync"
            >
              Sync Offline Content
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Sync Queue */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Sync Queue ({syncQueue.length})
          </Title>

          {syncQueue.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No items in sync queue
            </Text>
          ) : (
            syncQueue.map(item => (
              <View key={item.id} style={styles.queueItem}>
                <View style={styles.queueItemHeader}>
                  <View style={styles.queueItemInfo}>
                    <Text style={[styles.queueItemTitle, { color: theme.colors.onSurface }]}>
                      {item.contentType} - {item.contentId}
                    </Text>
                    <Text style={[styles.queueItemType, { color: theme.colors.onSurfaceVariant }]}>
                      {item.type} • {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.queueItemActions}>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(item.status) }}
                      style={{ borderColor: getStatusColor(item.status) }}
                    >
                      {item.status}
                    </Chip>

                    <Chip
                      mode="outlined"
                      textStyle={{ color: getPriorityColor(item.priority) }}
                      style={{ borderColor: getPriorityColor(item.priority) }}
                    >
                      {item.priority}
                    </Chip>

                    <Menu
                      visible={showMenu === item.id}
                      onDismiss={() => setShowMenu(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => setShowMenu(item.id)}
                          iconColor={theme.colors.onSurface}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setShowMenu(null);
                          // Add specific actions here
                        }}
                        title="View Details"
                      />
                      <Menu.Item
                        onPress={() => {
                          setShowMenu(null);
                          // Add specific actions here
                        }}
                        title="Cancel"
                      />
                    </Menu>
                  </View>
                </View>

                {item.errorMessage && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    Error: {item.errorMessage}
                  </Text>
                )}

                {item.retryCount > 0 && (
                  <Text style={[styles.retryText, { color: theme.colors.onSurfaceVariant }]}>
                    Retry attempts: {item.retryCount}/{item.maxRetries}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Sync Conflicts */}
      {syncConflicts.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Sync Conflicts ({syncConflicts.length})
            </Title>

            {syncConflicts.map(conflict => (
              <View key={conflict.syncItem.id} style={styles.conflictItem}>
                <View style={styles.conflictHeader}>
                  <Text style={[styles.conflictTitle, { color: theme.colors.onSurface }]}>
                    {conflict.conflictType.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Badge>{conflict.resolution === 'unresolved' ? 'Unresolved' : 'Resolved'}</Badge>
                </View>

                <Text style={[styles.conflictText, { color: theme.colors.onSurfaceVariant }]}>
                  Content: {conflict.syncItem.contentType} - {conflict.syncItem.contentId}
                </Text>

                {conflict.resolution === 'unresolved' && (
                  <View style={styles.conflictActions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleConflictResolution(conflict, 'local')}
                      style={styles.conflictButton}
                      compact
                    >
                      Use Local
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleConflictResolution(conflict, 'remote')}
                      style={styles.conflictButton}
                      compact
                    >
                      Use Remote
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleConflictResolution(conflict, 'newest')}
                      style={styles.conflictButton}
                      compact
                    >
                      Use Newest
                    </Button>
                  </View>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Sync Statistics */}
      {syncStats && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Sync Statistics
            </Title>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {syncStats.totalSyncs}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Syncs
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {syncStats.successfulSyncs}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Successful
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {syncStats.failedSyncs}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Failed
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {syncStats.totalItemsSynced}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Items Synced
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.colors.onSurfaceVariant }]}>
                Last sync:{' '}
                {syncStats.lastSyncTime
                  ? new Date(syncStats.lastSyncTime).toLocaleString()
                  : 'Never'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.colors.onSurfaceVariant }]}>
                Average sync time: {formatTime(syncStats.averageSyncTime)}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.colors.onSurfaceVariant }]}>
                Total bytes transferred: {formatBytes(syncStats.totalBytesTransferred)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Sync Options */}
      {syncOptions && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Sync Options
            </Title>

            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>Auto-sync</Text>
              <Switch
                value={syncOptions.autoSync}
                onValueChange={value => updateSyncOption('autoSync', value)}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                Sync on WiFi
              </Text>
              <Switch
                value={syncOptions.syncOnWifi}
                onValueChange={value => updateSyncOption('syncOnWifi', value)}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                Sync on Cellular
              </Text>
              <Switch
                value={syncOptions.syncOnCellular}
                onValueChange={value => updateSyncOption('syncOnCellular', value)}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                Retry failed items
              </Text>
              <Switch
                value={syncOptions.retryFailedItems}
                onValueChange={value => updateSyncOption('retryFailedItems', value)}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                Priority ordering
              </Text>
              <Switch
                value={syncOptions.priorityOrder}
                onValueChange={value => updateSyncOption('priorityOrder', value)}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Conflict Resolution Dialog */}
      <Portal>
        <Dialog
          visible={showConflictDialog}
          onDismiss={() => setShowConflictDialog(false)}
          style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Resolve Sync Conflict
          </Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, { color: theme.colors.onSurface }]}>
              Choose how to resolve this conflict:
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.onSurfaceVariant }]}>
              Content: {selectedConflict?.syncItem?.contentType} -{' '}
              {selectedConflict?.syncItem?.contentId}
            </Text>
            <Text style={[styles.dialogText, { color: theme.colors.onSurfaceVariant }]}>
              Type: {selectedConflict?.conflictType}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConflictDialog(false)}>Cancel</Button>
            <Button onPress={() => confirmConflictResolution('local')}>Use Local</Button>
            <Button onPress={() => confirmConflictResolution('remote')}>Use Remote</Button>
            <Button onPress={() => confirmConflictResolution('newest')}>Use Newest</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  progressBar: {
    marginBottom: 8,
    height: 8,
    borderRadius: 4,
  },
  statsRow: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  queueItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  queueItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  queueItemType: {
    fontSize: 14,
  },
  queueItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    marginTop: 4,
  },
  conflictItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  conflictText: {
    fontSize: 14,
    marginBottom: 12,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
  },
  conflictButton: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 8,
  },
});
