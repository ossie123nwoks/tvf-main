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
  Chip,
  List,
  Avatar,
  ActivityIndicator,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { UserEngagementStats } from '@/types/admin';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'admin' | 'moderator';
  is_email_verified: boolean;
  created_at: string;
  last_login_at?: string;
  profile_image_url?: string;
  engagement?: UserEngagementStats;
}

interface UserAnalyticsSectionProps {
  onUserSelect?: (user: User) => void;
}

const { width } = Dimensions.get('window');

const UserAnalyticsSection: React.FC<UserAnalyticsSectionProps> = ({
  onUserSelect,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sortBy, setSortBy] = useState<'activity' | 'sermons' | 'articles' | 'downloads'>('activity');
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSermonsListened: 0,
    totalArticlesRead: 0,
    totalDownloads: 0,
    averageSessionDuration: 0,
    topUsers: [] as User[],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    controls: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    controlLabel: {
      marginRight: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text,
      alignSelf: 'center',
    },
    controlLabelSpacer: {
      marginLeft: theme.spacing.md,
      marginRight: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text,
      alignSelf: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: width < 768 ? '48%' : '23%',
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    statCardContent: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
      lineHeight: 30,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    chartContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      elevation: 2,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
      lineHeight: 24,
    },
    chartScrollContent: {
      paddingBottom: theme.spacing.md,
    },
    userCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    userDetails: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 22,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    engagementStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    engagementItem: {
      alignItems: 'center',
      flex: 1,
      minWidth: 60,
      marginBottom: theme.spacing.xs,
    },
    engagementNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      lineHeight: 22,
    },
    engagementLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 14,
      marginTop: theme.spacing.xs / 2,
    },
    progressContainer: {
      marginTop: theme.spacing.md,
    },
    progressLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 16,
    },
    loadingContainer: {
      padding: theme.spacing.xl * 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    errorContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      fontSize: 16,
      lineHeight: 24,
    },
    emptyContainer: {
      padding: theme.spacing.xl * 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.md,
      lineHeight: 24,
    },
    timeRangeChip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    sortChip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
  });

  // Load users with engagement data
  const loadUsersWithAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await AdminService.getUsersWithEngagement(1, 50);
      setUsers(result.users);

      // Calculate analytics
      const totalUsers = result.users.length;
      const activeUsers = result.users.filter(user => 
        user.engagement && user.engagement.lastActivityAt && 
        new Date(user.engagement.lastActivityAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      const totalSermonsListened = result.users.reduce((sum, user) => 
        sum + (user.engagement?.totalSermonsListened || 0), 0
      );
      const totalArticlesRead = result.users.reduce((sum, user) => 
        sum + (user.engagement?.totalArticlesRead || 0), 0
      );
      const totalDownloads = result.users.reduce((sum, user) => 
        sum + (user.engagement?.totalDownloads || 0), 0
      );

      const averageSessionDuration = result.users.reduce((sum, user) => 
        sum + (user.engagement?.averageSessionDuration || 0), 0
      ) / totalUsers;

      // Sort users by selected criteria
      const sortedUsers = [...result.users].sort((a, b) => {
        if (!a.engagement || !b.engagement) return 0;
        
        switch (sortBy) {
          case 'activity':
            return new Date(b.engagement.lastActivityAt).getTime() - new Date(a.engagement.lastActivityAt).getTime();
          case 'sermons':
            return b.engagement.totalSermonsListened - a.engagement.totalSermonsListened;
          case 'articles':
            return b.engagement.totalArticlesRead - a.engagement.totalArticlesRead;
          case 'downloads':
            return b.engagement.totalDownloads - a.engagement.totalDownloads;
          default:
            return 0;
        }
      });

      setAnalytics({
        totalUsers,
        activeUsers,
        totalSermonsListened,
        totalArticlesRead,
        totalDownloads,
        averageSessionDuration: Math.round(averageSessionDuration),
        topUsers: sortedUsers.slice(0, 10),
      });
    } catch (err) {
      console.error('Error loading user analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    loadUsersWithAnalytics();
  }, [selectedTimeRange, sortBy]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getEngagementScore = (user: User) => {
    if (!user.engagement) return 0;
    const { totalSermonsListened, totalArticlesRead, totalDownloads } = user.engagement;
    return totalSermonsListened + totalArticlesRead + totalDownloads;
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 50) return { label: 'High', color: theme.colors.success };
    if (score >= 20) return { label: 'Medium', color: theme.colors.warning };
    return { label: 'Low', color: theme.colors.error };
  };

  const renderUserCard = (user: User, index: number) => {
    const engagementScore = getEngagementScore(user);
    const engagementLevel = getEngagementLevel(engagementScore);
    const maxScore = Math.max(...analytics.topUsers.map(u => getEngagementScore(u)));

    return (
      <Card
        key={user.id}
        style={styles.userCard}
        onPress={() => onUserSelect && onUserSelect(user)}
        elevation={2}
      >
        <Card.Content style={{ padding: theme.spacing.md }}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={48}
                label={`${user.first_name[0]}${user.last_name[0]}`}
                style={{ backgroundColor: theme.colors.primary + '20' }}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  #{index + 1} {user.first_name} {user.last_name}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                
                {user.engagement && (
                  <View style={styles.engagementStats}>
                    <View style={styles.engagementItem}>
                      <Text style={styles.engagementNumber}>
                        {user.engagement.totalSermonsListened}
                      </Text>
                      <Text style={styles.engagementLabel}>Sermons</Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Text style={styles.engagementNumber}>
                        {user.engagement.totalArticlesRead}
                      </Text>
                      <Text style={styles.engagementLabel}>Articles</Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Text style={styles.engagementNumber}>
                        {user.engagement.totalDownloads}
                      </Text>
                      <Text style={styles.engagementLabel}>Downloads</Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <Text style={styles.engagementNumber}>
                        {formatDuration(user.engagement.averageSessionDuration)}
                      </Text>
                      <Text style={styles.engagementLabel}>Avg Session</Text>
                    </View>
                  </View>
                )}

                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>
                    Engagement: {engagementLevel.label} ({engagementScore} points)
                  </Text>
                  <ProgressBar
                    progress={maxScore > 0 ? engagementScore / maxScore : 0}
                    color={engagementLevel.color}
                    style={{ height: 4, borderRadius: 2 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadUsersWithAnalytics}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Analytics</Text>
        <Button
          mode="outlined"
          onPress={loadUsersWithAnalytics}
          icon="refresh"
          compact
        >
          Refresh
        </Button>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>Time Range:</Text>
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <Chip
            key={range}
            selected={selectedTimeRange === range}
            onPress={() => setSelectedTimeRange(range)}
            style={styles.timeRangeChip}
            mode="outlined"
          >
            {range === 'all' ? 'All Time' : range}
          </Chip>
        ))}
        
        <Text style={styles.controlLabelSpacer}>Sort by:</Text>
        {(['activity', 'sermons', 'articles', 'downloads'] as const).map((sort) => (
          <Chip
            key={sort}
            selected={sortBy === sort}
            onPress={() => setSortBy(sort)}
            style={styles.sortChip}
            mode="outlined"
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </Chip>
        ))}
      </View>

      {/* Analytics Overview */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{analytics.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </Card>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{analytics.activeUsers}</Text>
            <Text style={styles.statLabel}>Active (7d)</Text>
          </View>
        </Card>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{analytics.totalSermonsListened}</Text>
            <Text style={styles.statLabel}>Sermons Listened</Text>
          </View>
        </Card>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{analytics.totalArticlesRead}</Text>
            <Text style={styles.statLabel}>Articles Read</Text>
          </View>
        </Card>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{analytics.totalDownloads}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
        </Card>
        <Card style={styles.statCard} elevation={2}>
          <View style={styles.statCardContent}>
            <Text style={styles.statNumber}>{formatDuration(analytics.averageSessionDuration)}</Text>
            <Text style={styles.statLabel}>Avg Session</Text>
          </View>
        </Card>
      </View>

      {/* Top Users */}
      <Card style={styles.chartContainer} elevation={2}>
        <Text style={styles.chartTitle}>Top Users by Engagement</Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          {analytics.topUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="analytics"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyText}>No user data available</Text>
            </View>
          ) : (
            analytics.topUsers.map((user, index) => renderUserCard(user, index))
          )}
        </ScrollView>
      </Card>
    </View>
  );
};

export default UserAnalyticsSection;
