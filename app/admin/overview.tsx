import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAdminAuth } from '@/components/admin/AdminAuthGuard';
import { AdminService } from '@/lib/supabase/admin';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function OverviewPage() {
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  // Calculate stat card width for proper grid layout
  const gap = theme.spacing.md;
  const getStatCardWidth = () => {
    const padding = theme.spacing.lg * 2; // Left and right padding
    const availableWidth = width - padding;
    
    if (isTablet) {
      // 3 columns on tablet: (availableWidth - 2 gaps) / 3
      // Each card gets marginRight except last in row, so we account for 2 gaps total
      return (availableWidth - gap * 2) / 3;
    } else {
      // 2 columns on mobile: (availableWidth - 1 gap) / 2
      // Each card gets marginRight except last in row, so we account for 1 gap total
      return (availableWidth - gap) / 2;
    }
  };

  const statCardWidth = getStatCardWidth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 2,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    firstSectionTitle: {
      marginTop: 0,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    statCardWrapper: {
      width: statCardWidth,
      marginRight: gap,
      marginBottom: gap,
    },
    statCardWrapperLastInRow: {
      marginRight: 0,
    },
    statCard: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      width: '100%',
    },
    statNumber: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    recentActivityCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    activityText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <AdminPageHeader title="Overview" />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
              Loading admin statistics...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {adminStats && (
              <>
                <Text style={[styles.sectionTitle, styles.firstSectionTitle]}>System Overview</Text>
                <View style={styles.statsGrid}>
                  {[
                    { value: adminStats.totalUsers || 0, label: 'Total Users' },
                    { value: adminStats.totalSermons || 0, label: 'Sermons' },
                    { value: adminStats.totalArticles || 0, label: 'Articles' },
                    { value: adminStats.totalCategories || 0, label: 'Categories' },
                  ].map((stat, index) => {
                    const isLastInRow = isTablet 
                      ? (index + 1) % 3 === 0 
                      : (index + 1) % 2 === 0;
                    return (
                      <View 
                        key={index}
                        style={[
                          styles.statCardWrapper,
                          isLastInRow && styles.statCardWrapperLastInRow
                        ]}
                      >
                        <Card style={styles.statCard} elevation={2}>
                          <Text style={styles.statNumber}>{stat.value}</Text>
                          <Text style={styles.statLabel}>{stat.label}</Text>
                        </Card>
                      </View>
                    );
                  })}
                </View>
                
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.recentActivityCard} elevation={1}>
                  <Text style={styles.activityText}>
                    Recent users: {adminStats.recentUsers?.length || 0}
                    {'\n'}
                    Recent sermons: {adminStats.recentSermons?.length || 0}
                    {'\n'}
                    Recent articles: {adminStats.recentArticles?.length || 0}
                  </Text>
                </Card>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </AdminAuthGuard>
  );
}

