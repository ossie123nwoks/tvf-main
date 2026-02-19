import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  SegmentedButtons,
  DataTable,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useNotificationAnalytics } from '@/lib/hooks/useNotificationAnalytics';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

interface NotificationAnalyticsDashboardProps {
  onCampaignCreate?: () => void;
  onCampaignEdit?: (campaignId: string) => void;
}

export default function NotificationAnalyticsDashboard({
  onCampaignCreate,
  onCampaignEdit,
}: NotificationAnalyticsDashboardProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    performanceMetrics,
    campaigns,
    loading,
    error,
    getPerformanceMetrics,
    getAllCampaigns,
    refresh,
    clearError,
  } = useNotificationAnalytics();

  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');

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
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    timeframeSelector: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    viewSelector: {
      flex: 1,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
    },
    cardContent: {
      padding: theme.spacing.lg,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    metricCard: {
      width: '48%',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    metricLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    campaignCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant,
    },
    campaignHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    campaignName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    campaignStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    campaignMetrics: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    campaignMetric: {
      alignItems: 'center',
    },
    campaignMetricValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    campaignMetricLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    errorState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });

  useEffect(() => {
    loadData();
  }, [selectedTimeframe]);

  const loadData = async () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedTimeframe) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    await Promise.all([
      getPerformanceMetrics(startDate, endDate),
      getAllCampaigns(),
    ]);
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '1d': return '1 Day';
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case '90d': return '90 Days';
      default: return '7 Days';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? theme.colors.success : theme.colors.textSecondary;
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 'check-circle' : 'pause-circle';
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (loading && !performanceMetrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorState}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color={theme.colors.error}
          style={styles.emptyStateIcon}
        />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="outlined"
          onPress={() => {
            clearError();
            loadData();
          }}
          textColor={theme.colors.primary}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (!performanceMetrics) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons
          name="analytics"
          size={48}
          color={theme.colors.textSecondary}
          style={styles.emptyStateIcon}
        />
        <Text style={styles.emptyStateText}>
          No notification analytics data available.
        </Text>
        <Text style={styles.emptyStateText}>
          Send some notifications to see analytics here.
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(${theme.colors.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.text.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const screenWidth = Dimensions.get('window').width - (theme.spacing.md * 2);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Analytics</Text>
          <Text style={styles.subtitle}>
            Track notification performance and engagement
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.timeframeSelector}>
            <SegmentedButtons
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
              buttons={[
                { value: '1d', label: '1D' },
                { value: '7d', label: '7D' },
                { value: '30d', label: '30D' },
                { value: '90d', label: '90D' },
              ]}
            />
          </View>
          
          <View style={styles.viewSelector}>
            <SegmentedButtons
              value={selectedView}
              onValueChange={setSelectedView}
              buttons={[
                { value: 'overview', label: 'Overview' },
                { value: 'campaigns', label: 'Campaigns' },
              ]}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={refresh}
            textColor={theme.colors.primary}
            icon="refresh"
          >
            Refresh
          </Button>
          
          {onCampaignCreate && (
            <Button
              mode="contained"
              onPress={onCampaignCreate}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
              icon="plus"
            >
              New Campaign
            </Button>
          )}
        </View>

        {selectedView === 'overview' && (
          <>
            {/* Key Metrics */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.chartTitle}>Key Metrics ({getTimeframeLabel(selectedTimeframe)})</Text>
                
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatNumber(performanceMetrics.totalSent)}
                    </Text>
                    <Text style={styles.metricLabel}>Total Sent</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatNumber(performanceMetrics.totalDelivered)}
                    </Text>
                    <Text style={styles.metricLabel}>Delivered</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatNumber(performanceMetrics.totalOpened)}
                    </Text>
                    <Text style={styles.metricLabel}>Opened</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatNumber(performanceMetrics.totalClicked)}
                    </Text>
                    <Text style={styles.metricLabel}>Clicked</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Performance Rates */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.chartTitle}>Performance Rates</Text>
                
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatPercentage(performanceMetrics.averageDeliveryRate)}
                    </Text>
                    <Text style={styles.metricLabel}>Delivery Rate</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatPercentage(performanceMetrics.averageOpenRate)}
                    </Text>
                    <Text style={styles.metricLabel}>Open Rate</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatPercentage(performanceMetrics.averageClickRate)}
                    </Text>
                    <Text style={styles.metricLabel}>Click Rate</Text>
                  </View>
                  
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatPercentage(performanceMetrics.averageEngagementRate)}
                    </Text>
                    <Text style={styles.metricLabel}>Engagement Rate</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Performance by Type */}
            {Object.keys(performanceMetrics.byType).length > 0 && (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.chartTitle}>Performance by Type</Text>
                  
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Type</DataTable.Title>
                      <DataTable.Title numeric>Sent</DataTable.Title>
                      <DataTable.Title numeric>Open Rate</DataTable.Title>
                      <DataTable.Title numeric>Click Rate</DataTable.Title>
                    </DataTable.Header>
                    
                    {Object.entries(performanceMetrics.byType).map(([type, metrics]) => (
                      <DataTable.Row key={type}>
                        <DataTable.Cell>
                          <Chip
                            icon="notifications"
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            textStyle={{ color: theme.colors.primary }}
                          >
                            {type}
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>{formatNumber(metrics.sent)}</DataTable.Cell>
                        <DataTable.Cell numeric>{formatPercentage(metrics.openRate)}</DataTable.Cell>
                        <DataTable.Cell numeric>{formatPercentage(metrics.clickRate)}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </Card.Content>
              </Card>
            )}

            {/* Top Performing Notifications */}
            {performanceMetrics.topPerformingNotifications.length > 0 && (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.chartTitle}>Top Performing Notifications</Text>
                  
                  {performanceMetrics.topPerformingNotifications.slice(0, 5).map((notification, index) => (
                    <View key={notification.id}>
                      <View style={styles.campaignHeader}>
                        <Text style={styles.campaignName} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        <Chip
                          icon="trending-up"
                          style={{ backgroundColor: theme.colors.successContainer }}
                          textStyle={{ color: theme.colors.success }}
                        >
                          #{index + 1}
                        </Chip>
                      </View>
                      
                      <View style={styles.campaignMetrics}>
                        <View style={styles.campaignMetric}>
                          <Text style={styles.campaignMetricValue}>
                            {formatNumber(notification.sentCount)}
                          </Text>
                          <Text style={styles.campaignMetricLabel}>Sent</Text>
                        </View>
                        
                        <View style={styles.campaignMetric}>
                          <Text style={styles.campaignMetricValue}>
                            {formatPercentage(notification.openRate)}
                          </Text>
                          <Text style={styles.campaignMetricLabel}>Open Rate</Text>
                        </View>
                        
                        <View style={styles.campaignMetric}>
                          <Text style={styles.campaignMetricValue}>
                            {formatPercentage(notification.clickRate)}
                          </Text>
                          <Text style={styles.campaignMetricLabel}>Click Rate</Text>
                        </View>
                        
                        <View style={styles.campaignMetric}>
                          <Text style={styles.campaignMetricValue}>
                            {formatPercentage(notification.engagementRate)}
                          </Text>
                          <Text style={styles.campaignMetricLabel}>Engagement</Text>
                        </View>
                      </View>
                      
                      {index < performanceMetrics.topPerformingNotifications.length - 1 && <Divider />}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {selectedView === 'campaigns' && (
          <>
            {/* Campaigns List */}
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <Card key={campaign.id} style={styles.campaignCard}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.campaignHeader}>
                      <Text style={styles.campaignName}>{campaign.name}</Text>
                      <View style={styles.campaignStatus}>
                        <MaterialIcons
                          name={getStatusIcon(campaign.isActive) as any}
                          size={20}
                          color={getStatusColor(campaign.isActive)}
                          style={{ marginRight: theme.spacing.xs }}
                        />
                        <Chip
                          icon={getStatusIcon(campaign.isActive) as any}
                          style={{
                            backgroundColor: campaign.isActive 
                              ? theme.colors.successContainer 
                              : theme.colors.surfaceVariant,
                          }}
                          textStyle={{
                            color: campaign.isActive 
                              ? theme.colors.success 
                              : theme.colors.textSecondary,
                          }}
                        >
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </Chip>
                      </View>
                    </View>
                    
                    {campaign.description && (
                      <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                        {campaign.description}
                      </Text>
                    )}
                    
                    <View style={styles.campaignMetrics}>
                      <View style={styles.campaignMetric}>
                        <Text style={styles.campaignMetricValue}>
                          {formatNumber(campaign.totalSent)}
                        </Text>
                        <Text style={styles.campaignMetricLabel}>Sent</Text>
                      </View>
                      
                      <View style={styles.campaignMetric}>
                        <Text style={styles.campaignMetricValue}>
                          {formatPercentage(campaign.deliveryRate)}
                        </Text>
                        <Text style={styles.campaignMetricLabel}>Delivery</Text>
                      </View>
                      
                      <View style={styles.campaignMetric}>
                        <Text style={styles.campaignMetricValue}>
                          {formatPercentage(campaign.openRate)}
                        </Text>
                        <Text style={styles.campaignMetricLabel}>Open Rate</Text>
                      </View>
                      
                      <View style={styles.campaignMetric}>
                        <Text style={styles.campaignMetricValue}>
                          {formatPercentage(campaign.engagementRate)}
                        </Text>
                        <Text style={styles.campaignMetricLabel}>Engagement</Text>
                      </View>
                    </View>
                    
                    {onCampaignEdit && (
                      <Button
                        mode="outlined"
                        onPress={() => onCampaignEdit(campaign.id)}
                        textColor={theme.colors.primary}
                        icon="edit"
                        style={{ marginTop: theme.spacing.sm }}
                      >
                        Edit Campaign
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Card style={styles.card}>
                <Card.Content style={styles.emptyState}>
                  <MaterialIcons
                    name="campaign"
                    size={48}
                    color={theme.colors.textSecondary}
                    style={styles.emptyStateIcon}
                  />
                  <Text style={styles.emptyStateText}>
                    No notification campaigns found.
                  </Text>
                  <Text style={styles.emptyStateText}>
                    Create your first campaign to start tracking performance.
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
