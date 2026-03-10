import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { AdminService } from '@/lib/supabase/admin';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

// Stat card configuration with icons and accent colors
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

  // Grid column calculation
  const gap = theme.spacing.sm;
  const padding = theme.spacing.md * 2;
  const cols = isTablet ? 4 : 2;
  const cardWidth = (width - padding - gap * (cols - 1)) / cols;

  if (loading) {
    return (
      <AdminAuthGuard>
        <View style={[staticStyles.container, staticStyles.centered, { backgroundColor: theme.colors.background }]}>
          <AdminPageHeader title="Overview" />
          <View style={staticStyles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
              Loading statistics...
            </Text>
          </View>
        </View>
      </AdminAuthGuard>
    );
  }

  if (error) {
    return (
      <AdminAuthGuard>
        <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
          <AdminPageHeader title="Overview" />
          <View style={[staticStyles.centered, { padding: theme.spacing.xl }]}>
            <MaterialIcons name="error-outline" size={56} color={theme.colors.error} />
            <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md }}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={() => { setLoading(true); loadAdminData().finally(() => setLoading(false)); }}
              style={{ marginTop: theme.spacing.md }}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Retry
            </Button>
          </View>
        </View>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        <AdminPageHeader title="Overview" />

        <ScrollView
          style={staticStyles.scrollView}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Section Title */}
          <Text style={{ ...theme.typography.labelLarge, color: theme.colors.textTertiary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
            System Overview
          </Text>

          {/* Stats Grid */}
          {adminStats && (
            <View style={[staticStyles.statsGrid, { gap }]}>
              {STAT_CONFIG.map((config) => (
                <View
                  key={config.key}
                  style={[
                    staticStyles.statCard,
                    {
                      width: cardWidth,
                      backgroundColor: theme.colors.surfaceElevated,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.cardBorder,
                      padding: theme.spacing.md,
                      ...theme.shadows.small,
                    },
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={[
                      staticStyles.statIcon,
                      {
                        backgroundColor: config.color + '15',
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                  >
                    <MaterialIcons name={config.icon} size={24} color={config.color} />
                  </View>

                  {/* Number */}
                  <Text style={{ ...theme.typography.displayMedium, color: theme.colors.text, marginTop: theme.spacing.sm }}>
                    {adminStats[config.key] || 0}
                  </Text>

                  {/* Label */}
                  <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing.xxs }}>
                    {config.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          {adminStats && (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text style={{ ...theme.typography.labelLarge, color: theme.colors.textTertiary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent Activity
              </Text>

              <View
                style={[
                  staticStyles.activityCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: theme.spacing.lg,
                    ...theme.shadows.small,
                  },
                ]}
              >
                {/* Activity rows */}
                {[
                  { icon: 'person-add' as const, label: 'Recent Users', value: adminStats.recentUsers?.length || 0, color: '#3B82F6' },
                  { icon: 'headset' as const, label: 'Recent Sermons', value: adminStats.recentSermons?.length || 0, color: '#10B981' },
                  { icon: 'article' as const, label: 'Recent Articles', value: adminStats.recentArticles?.length || 0, color: '#8B5CF6' },
                ].map((item, index, arr) => (
                  <View key={item.label}>
                    <View style={staticStyles.activityRow}>
                      <View style={[staticStyles.activityIcon, { backgroundColor: item.color + '15', borderRadius: theme.borderRadius.sm }]}>
                        <MaterialIcons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.text, flex: 1 }}>
                        {item.label}
                      </Text>
                      <View style={[staticStyles.activityBadge, { backgroundColor: item.color + '15', borderRadius: theme.borderRadius.full }]}>
                        <Text style={{ ...theme.typography.labelMedium, color: item.color }}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                    {index < arr.length - 1 && (
                      <View style={[staticStyles.divider, { backgroundColor: theme.colors.borderLight, marginVertical: theme.spacing.sm }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {},
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
});
