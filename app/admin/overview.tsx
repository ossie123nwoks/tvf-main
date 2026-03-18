import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { AdminService } from '@/lib/supabase/admin';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar, DashboardCard, EmptyState, CardSkeleton } from '@/components/admin/ui';

const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: 'people' as const, color: '#3B82F6' },
  { key: 'totalSermons', label: 'Sermons', icon: 'headset' as const, color: '#10B981' },
  { key: 'totalArticles', label: 'Articles', icon: 'article' as const, color: '#8B5CF6' },
  { key: 'totalCategories', label: 'Categories', icon: 'category' as const, color: '#F59E0B' },
];

export default function OverviewPage() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setError(null);
      const isAdmin = await AdminService.isCurrentUserAdmin();
      if (!isAdmin) {
        setError('Access denied: Admin privileges required');
        return;
      }
      const stats = await AdminService.getAdminStats();
      setAdminStats(stats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoading(true);
      loadAdminData().finally(() => setLoading(false));
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const gap = 16;
  const padding = 32;
  const cols = isTablet ? 4 : 2;
  const cardWidth = (width - padding - (isTablet ? 300 : 0) - gap * (cols - 1)) / cols;

  if (error) {
    return (
      <AdminAuthGuard>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <HeaderBar title="Overview" backButton />
          <EmptyState
            icon="error-outline"
            title="Error Loading Data"
            description={error}
            actionLabel="Try Again"
            onAction={() => {
              setLoading(true);
              loadAdminData().finally(() => setLoading(false));
            }}
          />
        </View>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <HeaderBar title="System Overview" backButton />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          <Text
            style={[
              styles.sectionTitle,
              { ...theme.typography.labelLarge, color: theme.colors.textTertiary },
            ]}
          >
            STATISTICS
          </Text>

          {loading ? (
            <CardSkeleton count={4} />
          ) : (
            adminStats && (
              <View style={[styles.statsGrid, { gap }]}>
                {STAT_CONFIG.map(config => (
                  <View
                    key={config.key}
                    style={[
                      styles.statCard,
                      {
                        width: isTablet ? cardWidth : '47%',
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.cardBorder,
                        borderRadius: theme.borderRadius.lg,
                        borderWidth: 1,
                        ...theme.shadows.small,
                      },
                    ]}
                  >
                    <View style={[styles.statIcon, { backgroundColor: config.color + '15' }]}>
                      <MaterialIcons name={config.icon} size={24} color={config.color} />
                    </View>
                    <Text
                      style={{
                        ...theme.typography.displayMedium,
                        color: theme.colors.text,
                        marginTop: 12,
                      }}
                    >
                      {adminStats[config.key] || 0}
                    </Text>
                    <Text
                      style={{
                        ...theme.typography.caption,
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                ))}
              </View>
            )
          )}

          {adminStats && !loading && (
            <View style={{ marginTop: 32 }}>
              <Text
                style={[
                  styles.sectionTitle,
                  { ...theme.typography.labelLarge, color: theme.colors.textTertiary },
                ]}
              >
                RECENT ACTIVITY
              </Text>

              <DashboardCard>
                {[
                  {
                    icon: 'person-add' as const,
                    label: 'Recent Users',
                    value: adminStats.recentUsers?.length || 0,
                    color: '#3B82F6',
                  },
                  {
                    icon: 'headset' as const,
                    label: 'Recent Sermons',
                    value: adminStats.recentSermons?.length || 0,
                    color: '#10B981',
                  },
                  {
                    icon: 'article' as const,
                    label: 'Recent Articles',
                    value: adminStats.recentArticles?.length || 0,
                    color: '#8B5CF6',
                  },
                ].map((item, index, arr) => (
                  <View key={item.label}>
                    <View style={styles.activityRow}>
                      <View
                        style={[
                          styles.activityIcon,
                          {
                            backgroundColor: item.color + '15',
                            borderRadius: theme.borderRadius.sm,
                          },
                        ]}
                      >
                        <MaterialIcons name={item.icon} size={20} color={item.color} />
                      </View>
                      <Text
                        style={{
                          ...theme.typography.bodyMedium,
                          color: theme.colors.text,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Text>
                      <View style={[styles.activityBadge, { backgroundColor: item.color + '15' }]}>
                        <Text style={{ ...theme.typography.labelMedium, color: item.color }}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                    {index < arr.length - 1 && (
                      <View
                        style={[styles.divider, { backgroundColor: theme.colors.borderLight }]}
                      />
                    )}
                  </View>
                ))}
              </DashboardCard>
            </View>
          )}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 16,
    letterSpacing: 1,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: 'flex-start',
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
});
