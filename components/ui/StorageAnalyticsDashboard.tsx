import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  Chip,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Dialog,
  Portal,
  Switch,
  TextInput,
  Divider,
  List,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useStorageManagement } from '@/lib/storage/useStorageManagement';
import { CleanupOptions } from '@/lib/storage/storageManager';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface StorageAnalyticsDashboardProps {
  visible: boolean;
  onDismiss: () => void;
}

export const StorageAnalyticsDashboard: React.FC<StorageAnalyticsDashboardProps> = ({
  visible,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    storageUsage,
    contentTypeUsage,
    storageAnalytics,
    storageRecommendations,
    storageHealthScore,
    usageHistory,
    isLoading,
    refreshData,
    performCleanup,
  } = useStorageManagement();

  const [cleanupDialogVisible, setCleanupDialogVisible] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    removeOldContent: true,
    removeFailedDownloads: true,
    removeRarelyUsed: false,
    removeDuplicates: false,
    ageThreshold: 30,
    usageThreshold: 3,
    sizeThreshold: 50 * 1024 * 1024, // 50MB
  });
  const [isPerformingCleanup, setIsPerformingCleanup] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get health score color
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  // Get health score label
  const getHealthScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // Handle cleanup
  const handleCleanup = async () => {
    try {
      setIsPerformingCleanup(true);
      const result = await performCleanup(cleanupOptions);
      
      setCleanupDialogVisible(false);
      // Show success message
      console.log('Cleanup completed:', result);
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsPerformingCleanup(false);
    }
  };

  // Render storage overview
  const renderStorageOverview = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Storage Overview
        </Text>
        
        {storageUsage && (
          <>
            <View style={styles.storageRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Total Space:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {formatFileSize(storageUsage.totalSpace)}
              </Text>
            </View>
            
            <View style={styles.storageRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Used Space:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {formatFileSize(storageUsage.usedSpace)}
              </Text>
            </View>
            
            <View style={styles.storageRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Available Space:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {formatFileSize(storageUsage.availableSpace)}
              </Text>
            </View>
            
            <View style={styles.storageRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Usage:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {storageUsage.usagePercentage.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <ProgressBar
                progress={storageUsage.usagePercentage / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  // Render health score
  const renderHealthScore = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Storage Health
        </Text>
        
        <View style={styles.healthScoreContainer}>
          <View style={styles.healthScoreCircle}>
            <Text variant="displaySmall" style={{ color: getHealthScoreColor(storageHealthScore) }}>
              {storageHealthScore}
            </Text>
          </View>
          <View style={styles.healthScoreInfo}>
            <Text variant="titleLarge" style={{ color: getHealthScoreColor(storageHealthScore) }}>
              {getHealthScoreLabel(storageHealthScore)}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
              Health Score
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Render content type breakdown
  const renderContentTypeBreakdown = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Content Type Breakdown
        </Text>
        
        {contentTypeUsage.map((typeUsage) => (
          <View key={typeUsage.type} style={styles.typeUsageRow}>
            <View style={styles.typeInfo}>
              <Chip mode="outlined" style={styles.typeChip}>
                {typeUsage.type.toUpperCase()}
              </Chip>
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {typeUsage.count} items
              </Text>
            </View>
            <View style={styles.typeStats}>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                {formatFileSize(typeUsage.totalSize)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                Avg: {formatFileSize(typeUsage.averageSize)}
              </Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  // Render analytics
  const renderAnalytics = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Download Analytics
        </Text>
        
        {storageAnalytics && (
          <>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {storageAnalytics.totalDownloads}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Total Downloads
                </Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.success }}>
                  {storageAnalytics.successfulDownloads}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Successful
                </Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.error }}>
                  {storageAnalytics.failedDownloads}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Failed
                </Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.warning }}>
                  {storageAnalytics.downloadSuccessRate.toFixed(1)}%
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Success Rate
                </Text>
              </View>
            </View>
            
            <Divider style={{ marginVertical: 16 }} />
            
            <View style={styles.analyticsDetails}>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Average Download Size: {formatFileSize(storageAnalytics.averageDownloadSize)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Largest Download: {formatFileSize(storageAnalytics.largestDownload)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Storage Efficiency: {storageAnalytics.storageEfficiency.toFixed(1)}%
              </Text>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  // Render recommendations
  const renderRecommendations = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: 16 }}>
          Optimization Recommendations
        </Text>
        
        {storageRecommendations && (
          <>
            <View style={styles.recommendationHeader}>
              <Chip
                mode={storageRecommendations.shouldCleanup ? 'contained' : 'outlined'}
                icon={storageRecommendations.shouldCleanup ? 'alert' : 'check-circle'}
                style={{
                  backgroundColor: storageRecommendations.shouldCleanup ? theme.colors.warning : theme.colors.success,
                }}
              >
                {storageRecommendations.shouldCleanup ? 'Cleanup Recommended' : 'Storage Optimized'}
              </Chip>
              
              {storageRecommendations.shouldCleanup && (
                <Text variant="bodyMedium" style={{ color: theme.colors.warning, marginTop: 8 }}>
                  Potential savings: {formatFileSize(storageRecommendations.recommendedCleanupSize)}
                </Text>
              )}
            </View>
            
            <View style={styles.recommendationDetails}>
              {storageRecommendations.oldContentCount > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  • {storageRecommendations.oldContentCount} old items
                </Text>
              )}
              {storageRecommendations.rarelyUsedContentCount > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  • {storageRecommendations.rarelyUsedContentCount} rarely used items
                </Text>
              )}
              {storageRecommendations.duplicateContentCount > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  • {storageRecommendations.duplicateContentCount} potential duplicates
                </Text>
              )}
            </View>
            
            <View style={styles.optimizationSuggestions}>
              {storageRecommendations.optimizationSuggestions.map((suggestion, index) => (
                <Text key={index} variant="bodySmall" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  // Render cleanup dialog
  const renderCleanupDialog = () => (
    <Portal>
      <Dialog visible={cleanupDialogVisible} onDismiss={() => setCleanupDialogVisible(false)}>
        <Dialog.Title>Storage Cleanup</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
            Configure cleanup options to free up storage space:
          </Text>
          
          <View style={styles.cleanupOption}>
            <Text>Remove old content</Text>
            <Switch
              value={cleanupOptions.removeOldContent}
              onValueChange={(value) => setCleanupOptions(prev => ({ ...prev, removeOldContent: value }))}
            />
          </View>
          
          <View style={styles.cleanupOption}>
            <Text>Remove failed downloads</Text>
            <Switch
              value={cleanupOptions.removeFailedDownloads}
              onValueChange={(value) => setCleanupOptions(prev => ({ ...prev, removeFailedDownloads: value }))}
            />
          </View>
          
          <View style={styles.cleanupOption}>
            <Text>Remove rarely used content</Text>
            <Switch
              value={cleanupOptions.removeRarelyUsed}
              onValueChange={(value) => setCleanupOptions(prev => ({ ...prev, removeRarelyUsed: value }))}
            />
          </View>
          
          <View style={styles.cleanupOption}>
            <Text>Remove duplicates</Text>
            <Switch
              value={cleanupOptions.removeDuplicates}
              onValueChange={(value) => setCleanupOptions(prev => ({ ...prev, removeDuplicates: value }))}
            />
          </View>
          
          <View style={styles.cleanupOption}>
            <Text>Age threshold (days)</Text>
            <TextInput
              value={cleanupOptions.ageThreshold.toString()}
              onChangeText={(text) => setCleanupOptions(prev => ({ ...prev, ageThreshold: parseInt(text) || 30 }))}
              keyboardType="numeric"
              style={styles.cleanupInput}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setCleanupDialogVisible(false)}>Cancel</Button>
          <Button
            onPress={handleCleanup}
            loading={isPerformingCleanup}
            disabled={isPerformingCleanup}
          >
            Cleanup
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={{ color: theme.colors.text }}>
          Storage Analytics Dashboard
        </Dialog.Title>
        
        <Dialog.Content style={styles.dialogContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 16 }}>
                Loading storage analytics...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderStorageOverview()}
              {renderHealthScore()}
              {renderContentTypeBreakdown()}
              {renderAnalytics()}
              {renderRecommendations()}
              
              <View style={styles.actionsContainer}>
                <Button
                  mode="contained"
                  onPress={() => setCleanupDialogVisible(true)}
                  icon="broom"
                  style={styles.actionButton}
                  disabled={!storageRecommendations?.shouldCleanup}
                >
                  Optimize Storage
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
            </ScrollView>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {renderCleanupDialog()}
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
  scrollView: {
    maxHeight: 600,
  },
  card: {
    marginBottom: 16,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthScoreInfo: {
    flex: 1,
  },
  typeUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    marginRight: 8,
  },
  typeStats: {
    alignItems: 'flex-end',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  analyticsItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  analyticsDetails: {
    gap: 4,
  },
  recommendationHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationDetails: {
    marginBottom: 16,
  },
  optimizationSuggestions: {
    gap: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  cleanupOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cleanupInput: {
    width: 80,
    height: 40,
  },
});
