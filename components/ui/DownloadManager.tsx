import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  Chip,
  IconButton,
  List,
  Divider,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Menu,
  Dialog,
  Portal,
  TextInput,
  Switch,
  Badge,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { DownloadItem } from '@/lib/storage/offline';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface DownloadManagerProps {
  visible: boolean;
  onDismiss: () => void;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  visible,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    downloads,
    activeDownloads,
    completedDownloads,
    pendingDownloads,
    failedDownloads,
    storageInfo,
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cleanupDownloads,
    refreshData,
    isLoading,
  } = useOfflineDownloads();

  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed' | 'pending' | 'failed'>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [cleanupDialogVisible, setCleanupDialogVisible] = useState(false);
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  const [cleanupThreshold, setCleanupThreshold] = useState('30');

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color
  const getStatusColor = (status: DownloadItem['status']): string => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'downloading':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.warning;
      case 'paused':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  // Get status icon
  const getStatusIcon = (status: DownloadItem['status']): string => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'downloading':
        return 'download';
      case 'pending':
        return 'clock';
      case 'paused':
        return 'pause-circle';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  // Handle download actions
  const handleDownloadAction = useCallback(async (action: string, downloadId: string) => {
    try {
      switch (action) {
        case 'pause':
          await pauseDownload(downloadId);
          break;
        case 'resume':
          await resumeDownload(downloadId);
          break;
        case 'cancel':
          await cancelDownload(downloadId);
          break;
        case 'retry':
          // For failed downloads, we'll need to re-add them
          const download = downloads.find(d => d.id === downloadId);
          if (download) {
            await cancelDownload(downloadId);
            await addDownload(download.type, download.title, download.url, download.metadata);
          }
          break;
      }
      setMenuVisible(null);
    } catch (error) {
      console.error('Download action failed:', error);
      Alert.alert('Error', 'Failed to perform download action');
    }
  }, [pauseDownload, resumeDownload, cancelDownload, addDownload, downloads]);

  // Handle cleanup
  const handleCleanup = useCallback(async () => {
    try {
      await cleanupDownloads();
      setCleanupDialogVisible(false);
      Alert.alert('Success', 'Old downloads have been cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
      Alert.alert('Error', 'Failed to cleanup downloads');
    }
  }, [cleanupDownloads]);

  // Get downloads for current tab
  const getDownloadsForTab = (): DownloadItem[] => {
    switch (selectedTab) {
      case 'active':
        return activeDownloads;
      case 'completed':
        return completedDownloads;
      case 'pending':
        return pendingDownloads;
      case 'failed':
        return failedDownloads;
      default:
        return downloads;
    }
  };

  // Render download item
  const renderDownloadItem = (item: DownloadItem) => (
    <Card key={item.id} style={[styles.downloadCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.downloadHeader}>
          <View style={styles.downloadInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.type.toUpperCase()} • {formatFileSize(item.size || 0)}
            </Text>
          </View>
          <View style={styles.downloadActions}>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(item.status) }}
              style={{ borderColor: getStatusColor(item.status) }}
            >
              {item.status}
            </Chip>
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(item.id)}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              }
            >
              {item.status === 'downloading' && (
                <Menu.Item
                  leadingIcon="pause"
                  title="Pause"
                  onPress={() => handleDownloadAction('pause', item.id)}
                />
              )}
              {item.status === 'paused' && (
                <Menu.Item
                  leadingIcon="play"
                  title="Resume"
                  onPress={() => handleDownloadAction('resume', item.id)}
                />
              )}
              {item.status === 'failed' && (
                <Menu.Item
                  leadingIcon="refresh"
                  title="Retry"
                  onPress={() => handleDownloadAction('retry', item.id)}
                />
              )}
              <Menu.Item
                leadingIcon="delete"
                title="Cancel"
                onPress={() => handleDownloadAction('cancel', item.id)}
              />
            </Menu>
          </View>
        </View>

        {item.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={item.progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {Math.round(item.progress * 100)}% • {formatFileSize(item.downloadedSize)} / {formatFileSize(item.size)}
            </Text>
          </View>
        )}

        {item.status === 'failed' && item.error && (
          <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
            Error: {item.error}
          </Text>
        )}

        <View style={styles.downloadMeta}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Added: {formatDate(item.createdAt)}
          </Text>
          {item.updatedAt !== item.createdAt && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Updated: {formatDate(item.updatedAt)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  // Render storage info
  const renderStorageInfo = () => (
    <Card style={[styles.storageCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
                     <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
               Storage Information
             </Text>
             
             <View style={styles.storageRow}>
               <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                 Total Space:
               </Text>
               <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                   {formatFileSize(storageInfo.totalSpace)}
                 </Text>
               </View>
               
               <View style={styles.storageRow}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                   Used Space:
                 </Text>
                 <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                   {formatFileSize(storageInfo.usedSpace)}
                 </Text>
               </View>
               
               <View style={styles.storageRow}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                   Available Space:
                 </Text>
                 <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                   {formatFileSize(storageInfo.availableSpace)}
                 </Text>
               </View>
               
               <View style={styles.storageRow}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                   Downloads:
                 </Text>
                 <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                   {storageInfo.downloadCount}
                 </Text>
               </View>

        <View style={styles.storageProgress}>
          <ProgressBar
            progress={storageInfo.totalSpace > 0 ? storageInfo.usedSpace / storageInfo.totalSpace : 0}
            color={theme.colors.primary}
            style={styles.storageProgressBar}
          />
        </View>
      </Card.Content>
    </Card>
  );

  // Render tab navigation
  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'all', label: 'All', count: downloads.length },
        { key: 'active', label: 'Active', count: activeDownloads.length },
        { key: 'completed', label: 'Completed', count: completedDownloads.length },
        { key: 'pending', label: 'Pending', count: pendingDownloads.length },
        { key: 'failed', label: 'Failed', count: failedDownloads.length },
      ].map((tab) => (
        <Button
          key={tab.key}
          mode={selectedTab === tab.key ? 'contained' : 'outlined'}
          onPress={() => setSelectedTab(tab.key as any)}
          style={styles.tabButton}
          contentStyle={styles.tabButtonContent}
        >
          {tab.label}
          {tab.count > 0 && (
            <Badge size={16} style={styles.tabBadge}>
              {tab.count}
            </Badge>
          )}
        </Button>
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons
        name="cloud-download"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
        No downloads yet
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        Start downloading content to access it offline
      </Text>
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={{ color: theme.colors.text }}>
          Download Manager
        </Dialog.Title>
        
        <Dialog.Content style={styles.dialogContent}>
          {renderStorageInfo()}
          
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              onPress={() => setCleanupDialogVisible(true)}
              icon="broom"
              style={styles.actionButton}
            >
              Cleanup
            </Button>
            <Button
              mode="outlined"
              onPress={() => setSettingsDialogVisible(true)}
              icon="cog"
              style={styles.actionButton}
            >
              Settings
            </Button>
            <Button
              mode="outlined"
              onPress={refreshData}
              icon="refresh"
              style={styles.actionButton}
            >
              Refresh
            </Button>
          </View>

          {renderTabNavigation()}

          <ScrollView style={styles.downloadsList} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                  Loading downloads...
                </Text>
              </View>
            ) : getDownloadsForTab().length > 0 ? (
              getDownloadsForTab().map(renderDownloadItem)
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Portal>
        <Dialog visible={cleanupDialogVisible} onDismiss={() => setCleanupDialogVisible(false)}>
          <Dialog.Title>Cleanup Downloads</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will remove downloads older than 30 days and failed downloads older than 7 days. 
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCleanupDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCleanup}>Cleanup</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Settings Dialog */}
      <Portal>
        <Dialog visible={settingsDialogVisible} onDismiss={() => setSettingsDialogVisible(false)}>
          <Dialog.Title>Download Settings</Dialog.Title>
          <Dialog.Content>
            <View style={styles.settingRow}>
              <Text>Auto-cleanup old downloads</Text>
              <Switch
                value={autoCleanupEnabled}
                onValueChange={setAutoCleanupEnabled}
              />
            </View>
            <View style={styles.settingRow}>
              <Text>Cleanup threshold (days)</Text>
              <TextInput
                value={cleanupThreshold}
                onChangeText={setCleanupThreshold}
                keyboardType="numeric"
                style={styles.settingInput}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: screenWidth * 0.95,
    maxHeight: '90%',
  },
  dialogContent: {
    paddingHorizontal: 0,
  },
  storageCard: {
    marginBottom: 16,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageProgress: {
    marginTop: 16,
  },
  storageProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadge: {
    marginLeft: 8,
  },
  downloadsList: {
    maxHeight: 400,
  },
  downloadCard: {
    marginBottom: 12,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  downloadInfo: {
    flex: 1,
    marginRight: 12,
  },
  downloadActions: {
    alignItems: 'flex-end',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    marginBottom: 8,
  },
  downloadMeta: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInput: {
    width: 80,
    height: 40,
  },
});
