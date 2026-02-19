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
import { useSharing } from '@/lib/hooks/useSharing';
import { ShareAnalytics } from '@/lib/services/sharingService';
import { MaterialIcons } from '@expo/vector-icons';

interface SharingAnalyticsProps {
  contentId: string;
  contentType: 'sermon' | 'article';
  onRefresh?: () => void;
}

export default function SharingAnalytics({
  contentId,
  contentType,
  onRefresh,
}: SharingAnalyticsProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { getShareAnalytics } = useSharing();
  
  const [analytics, setAnalytics] = useState<{
    totalShares: number;
    sharesByMethod: Record<string, number>;
    recentShares: ShareAnalytics[];
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
    methodChip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    methodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    methodName: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    methodCount: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    recentShareItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    recentShareIcon: {
      marginRight: theme.spacing.sm,
    },
    recentShareContent: {
      flex: 1,
    },
    recentShareMethod: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    recentShareTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    recentShareStatus: {
      fontSize: 12,
      color: theme.colors.success,
    },
    recentShareError: {
      fontSize: 12,
      color: theme.colors.error,
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
  }, [contentId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getShareAnalytics(contentId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    const iconMap: Record<string, string> = {
      native: 'share',
      copy: 'content-copy',
      email: 'email',
      sms: 'message',
      whatsapp: 'whatsapp',
      telegram: 'telegram',
      twitter: 'twitter',
      facebook: 'facebook',
    };
    
    return iconMap[method] || 'share';
  };

  const getMethodColor = (method: string) => {
    const colorMap: Record<string, string> = {
      native: theme.colors.primary,
      copy: theme.colors.secondary,
      email: '#EA4335',
      sms: '#34A853',
      whatsapp: '#25D366',
      telegram: '#0088CC',
      twitter: '#1DA1F2',
      facebook: '#1877F2',
    };
    
    return colorMap[method] || theme.colors.primary;
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

  if (!analytics || analytics.totalShares === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons
          name="share"
          size={48}
          color={theme.colors.textSecondary}
          style={styles.emptyStateIcon}
        />
        <Text style={styles.emptyStateText}>
          No sharing data available for this {contentType}.
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
          <Text style={styles.title}>Sharing Analytics</Text>
          <Text style={styles.subtitle}>
            Track how this {contentType} is being shared across different platforms
          </Text>
        </View>

        {/* Total Shares */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Shares</Text>
              <Text style={styles.statsValue}>{analytics.totalShares}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Shares by Method */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={[styles.statsLabel, { marginBottom: theme.spacing.md }]}>
              Shares by Method
            </Text>
            
            {Object.entries(analytics.sharesByMethod).map(([method, count]) => (
              <View key={method} style={styles.methodRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialIcons
                    name={getMethodIcon(method) as any}
                    size={20}
                    color={getMethodColor(method)}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={styles.methodName}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </View>
                <Text style={styles.methodCount}>{count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Recent Shares */}
        {analytics.recentShares.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.statsLabel, { marginBottom: theme.spacing.md }]}>
                Recent Shares
              </Text>
              
              {analytics.recentShares.map((share, index) => (
                <View key={index}>
                  <View style={styles.recentShareItem}>
                    <MaterialIcons
                      name={getMethodIcon(share.shareMethod) as any}
                      size={20}
                      color={getMethodColor(share.shareMethod)}
                      style={styles.recentShareIcon}
                    />
                    <View style={styles.recentShareContent}>
                      <Text style={styles.recentShareMethod}>
                        {share.shareMethod.charAt(0).toUpperCase() + share.shareMethod.slice(1)}
                      </Text>
                      <Text style={styles.recentShareTime}>
                        {formatTimestamp(share.timestamp)}
                      </Text>
                    </View>
                    <Text
                      style={share.success ? styles.recentShareStatus : styles.recentShareError}
                    >
                      {share.success ? 'Success' : 'Failed'}
                    </Text>
                  </View>
                  {index < analytics.recentShares.length - 1 && <Divider />}
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
