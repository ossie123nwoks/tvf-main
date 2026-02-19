import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  useTheme as usePaperTheme,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getDeepLinkAnalytics } from '@/lib/utils/deepLinking';
import { MaterialIcons } from '@expo/vector-icons';

interface DeepLinkAnalyticsProps {
  contentId: string;
  contentType: 'sermon' | 'article';
  onRefresh?: () => void;
}

export default function DeepLinkAnalytics({
  contentId,
  contentType,
  onRefresh,
}: DeepLinkAnalyticsProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const [analytics, setAnalytics] = useState<{
    totalClicks: number;
    clicksBySource: Record<string, number>;
    clicksByCampaign: Record<string, number>;
    recentClicks: Array<{
      timestamp: Date;
      source: string;
      campaign?: string;
      referrer?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    statsLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statsValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    sourceChip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    sourceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    sourceName: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    sourceCount: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    recentClickItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    recentClickIcon: {
      marginRight: theme.spacing.sm,
    },
    recentClickContent: {
      flex: 1,
    },
    recentClickSource: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    recentClickTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    recentClickCampaign: {
      fontSize: 12,
      color: theme.colors.primary,
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
  });

  useEffect(() => {
    loadAnalytics();
  }, [contentId, contentType]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDeepLinkAnalytics(contentId, contentType);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'app':
        return 'smartphone';
      case 'web':
        return 'web';
      case 'direct':
        return 'link';
      default:
        return 'share';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'app':
        return theme.colors.primary;
      case 'web':
        return theme.colors.secondary;
      case 'direct':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
          Loading analytics...
        </Text>
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
          onPress={loadAnalytics}
          textColor={theme.colors.primary}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (!analytics || analytics.totalClicks === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons
          name="link"
          size={48}
          color={theme.colors.textSecondary}
          style={styles.emptyStateIcon}
        />
        <Text style={styles.emptyStateText}>
          No deep link data available for this {contentType}.
        </Text>
        <Text style={[styles.emptyStateText, { marginTop: theme.spacing.sm }]}>
          Share this content to see analytics here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Deep Link Analytics</Text>
          <Text style={styles.subtitle}>
            Track how this {contentType} is being accessed through shared links
          </Text>
        </View>

        {/* Total Clicks */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Link Clicks</Text>
              <Text style={styles.statsValue}>{analytics.totalClicks}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Clicks by Source */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={[styles.statsLabel, { marginBottom: theme.spacing.md }]}>
              Clicks by Source
            </Text>
            
            {Object.entries(analytics.clicksBySource).map(([source, count]) => (
              <View key={source} style={styles.sourceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialIcons
                    name={getSourceIcon(source) as any}
                    size={20}
                    color={getSourceColor(source)}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={styles.sourceName}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </Text>
                </View>
                <Text style={styles.sourceCount}>{count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Clicks by Campaign */}
        {Object.keys(analytics.clicksByCampaign).length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.statsLabel, { marginBottom: theme.spacing.md }]}>
                Clicks by Campaign
              </Text>
              
              {Object.entries(analytics.clicksByCampaign).map(([campaign, count]) => (
                <View key={campaign} style={styles.sourceRow}>
                  <Text style={styles.sourceName}>{campaign}</Text>
                  <Text style={styles.sourceCount}>{count}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Recent Clicks */}
        {analytics.recentClicks.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.statsLabel, { marginBottom: theme.spacing.md }]}>
                Recent Clicks
              </Text>
              
              {analytics.recentClicks.map((click, index) => (
                <View key={index}>
                  <View style={styles.recentClickItem}>
                    <MaterialIcons
                      name={getSourceIcon(click.source) as any}
                      size={20}
                      color={getSourceColor(click.source)}
                      style={styles.recentClickIcon}
                    />
                    <View style={styles.recentClickContent}>
                      <Text style={styles.recentClickSource}>
                        {click.source.charAt(0).toUpperCase() + click.source.slice(1)}
                      </Text>
                      <Text style={styles.recentClickTime}>
                        {formatTimestamp(click.timestamp)}
                      </Text>
                      {click.campaign && (
                        <Text style={styles.recentClickCampaign}>
                          Campaign: {click.campaign}
                        </Text>
                      )}
                    </View>
                  </View>
                  {index < analytics.recentClicks.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Refresh Button */}
        <Button
          mode="outlined"
          onPress={loadAnalytics}
          style={{ marginTop: theme.spacing.md }}
          textColor={theme.colors.primary}
          icon="refresh"
        >
          Refresh Analytics
        </Button>
      </ScrollView>
    </View>
  );
}
