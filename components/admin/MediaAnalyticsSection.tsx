import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  ActivityIndicator,
  ProgressBar,
  Chip,
  Divider,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';

interface MediaAnalyticsSectionProps {
  onOptimizationAction?: (action: string, data: any) => void;
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

interface OptimizationRecommendation {
  id: string;
  type: 'storage' | 'performance' | 'organization' | 'cleanup';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  potentialSavings?: number;
  action?: string;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const MediaAnalyticsSection: React.FC<MediaAnalyticsSectionProps> = ({
  onOptimizationAction,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

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
      width: isTablet ? '23%' : '48%',
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
    chartContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.md,
    },
    typeStatsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    typeStatChip: {
      marginBottom: theme.spacing.xs,
    },
    recommendationsContainer: {
      marginTop: theme.spacing.lg,
    },
    recommendationCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    recommendationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    recommendationChips: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    recommendationDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    recommendationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    impactChip: {
      height: 24,
    },
    effortChip: {
      height: 24,
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
    savingsContainer: {
      backgroundColor: theme.colors.primary + '10',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    savingsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
    },
  });

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await AdminService.getMediaUsageStats();
      setUsageStats(stats);
      
      // Generate recommendations based on stats
      const recs = generateRecommendations(stats);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Generate optimization recommendations
  const generateRecommendations = (stats: UsageStats): OptimizationRecommendation[] => {
    const recs: OptimizationRecommendation[] = [];

    // Storage optimization recommendations
    if (stats.unusedSize > 100 * 1024 * 1024) { // 100MB
      recs.push({
        id: 'cleanup-unused',
        type: 'storage',
        title: 'Clean Up Unused Files',
        description: `You have ${formatFileSize(stats.unusedSize)} of unused files that can be safely deleted.`,
        impact: 'high',
        effort: 'easy',
        potentialSavings: stats.unusedSize,
        action: 'cleanup',
      });
    }

    if (stats.usageRate < 50) {
      recs.push({
        id: 'review-uploads',
        type: 'organization',
        title: 'Review Recent Uploads',
        description: `Only ${stats.usageRate.toFixed(1)}% of your files are being used. Consider reviewing recent uploads.`,
        impact: 'medium',
        effort: 'medium',
        action: 'review',
      });
    }

    // Performance optimization recommendations
    if (stats.typeStats.image > 100) {
      recs.push({
        id: 'optimize-images',
        type: 'performance',
        title: 'Optimize Image Files',
        description: 'You have many image files. Consider compressing them to reduce storage usage.',
        impact: 'medium',
        effort: 'medium',
        action: 'optimize',
      });
    }

    if (stats.totalSize > 1024 * 1024 * 1024) { // 1GB
      recs.push({
        id: 'archive-old-files',
        type: 'storage',
        title: 'Archive Old Files',
        description: 'Consider archiving old files to reduce active storage usage.',
        impact: 'medium',
        effort: 'hard',
        action: 'archive',
      });
    }

    // Organization recommendations
    if (stats.totalFiles > 500) {
      recs.push({
        id: 'organize-files',
        type: 'organization',
        title: 'Organize Files with Tags',
        description: 'Add tags to your files to make them easier to find and manage.',
        impact: 'low',
        effort: 'easy',
        action: 'organize',
      });
    }

    return recs.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'hard': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const handleRecommendationAction = (recommendation: OptimizationRecommendation) => {
    setSelectedRecommendation(recommendation);
    setShowRecommendationModal(true);
  };

  const executeRecommendation = (recommendation: OptimizationRecommendation) => {
    if (onOptimizationAction) {
      onOptimizationAction(recommendation.action || 'unknown', recommendation);
    }
    setShowRecommendationModal(false);
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
          <Text style={styles.statNumber}>{formatFileSize(usageStats.usedSize)}</Text>
          <Text style={styles.statLabel}>Used Size</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{formatFileSize(usageStats.unusedSize)}</Text>
          <Text style={styles.statLabel}>Unused Size</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{usageStats.usageRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Usage Rate</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>
            {usageStats.totalFiles > 0 ? (usageStats.usedFiles / usageStats.totalFiles * 100).toFixed(1) : 0}%
          </Text>
          <Text style={styles.statLabel}>Efficiency</Text>
        </Card>
      </View>
    );
  };

  const renderTypeStats = () => {
    if (!usageStats?.typeStats) return null;

    return (
      <Card style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Files by Type</Text>
        <View style={styles.typeStatsContainer}>
          {Object.entries(usageStats.typeStats).map(([type, count]) => (
            <Chip
              key={type}
              mode="outlined"
              style={styles.typeStatChip}
            >
              {type}: {count}
            </Chip>
          ))}
        </View>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: theme.spacing.md }}>
          Optimization Recommendations
        </Text>
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} style={styles.recommendationCard}>
            <Card.Content>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                <View style={styles.recommendationChips}>
                  <Chip
                    mode="outlined"
                    style={[styles.impactChip, { borderColor: getImpactColor(recommendation.impact) }]}
                    textStyle={{ color: getImpactColor(recommendation.impact), fontSize: 10 }}
                  >
                    {recommendation.impact.toUpperCase()}
                  </Chip>
                  <Chip
                    mode="outlined"
                    style={[styles.effortChip, { borderColor: getEffortColor(recommendation.effort) }]}
                    textStyle={{ color: getEffortColor(recommendation.effort), fontSize: 10 }}
                  >
                    {recommendation.effort.toUpperCase()}
                  </Chip>
                </View>
              </View>
              
              <Text style={styles.recommendationDescription}>
                {recommendation.description}
              </Text>
              
              {recommendation.potentialSavings && (
                <View style={styles.savingsContainer}>
                  <Text style={styles.savingsText}>
                    Potential Savings: {formatFileSize(recommendation.potentialSavings)}
                  </Text>
                </View>
              )}
              
              <View style={styles.recommendationActions}>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  {recommendation.type.toUpperCase()} • {recommendation.effort.toUpperCase()} EFFORT
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => handleRecommendationAction(recommendation)}
                  compact
                >
                  Take Action
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderRecommendationModal = () => {
    if (!selectedRecommendation) return null;

    return (
      <Portal>
        <Modal
          visible={showRecommendationModal}
          onDismiss={() => setShowRecommendationModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedRecommendation.title}</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Description</Text>
              <Text style={styles.modalText}>{selectedRecommendation.description}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Impact</Text>
              <Text style={styles.modalText}>
                {selectedRecommendation.impact.toUpperCase()} impact • {selectedRecommendation.effort.toUpperCase()} effort
              </Text>
            </View>

            {selectedRecommendation.potentialSavings && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Potential Savings</Text>
                <Text style={styles.modalText}>
                  {formatFileSize(selectedRecommendation.potentialSavings)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
              <Button mode="outlined" onPress={() => setShowRecommendationModal(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={() => executeRecommendation(selectedRecommendation)}>
                Execute
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadAnalytics}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Media Analytics</Text>
        <Button
          mode="outlined"
          onPress={loadAnalytics}
          icon="refresh"
          compact
        >
          Refresh
        </Button>
      </View>

      {/* Usage Statistics */}
      {renderUsageStats()}

      {/* Type Statistics */}
      {renderTypeStats()}

      {/* Optimization Recommendations */}
      {renderRecommendations()}

      {/* Recommendation Modal */}
      {renderRecommendationModal()}
    </View>
  );
};

export default MediaAnalyticsSection;
