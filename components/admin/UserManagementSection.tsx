import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  List,
  Avatar,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Badge,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { UserManagementFilters, UserEngagementStats } from '@/types/admin';
import { useRouter } from 'expo-router';

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
}

interface UserManagementSectionProps {
  onUserSelect?: (user: User) => void;
  showActions?: boolean;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  onUserSelect,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters and search
  const [filters, setFilters] = useState<UserManagementFilters>({
    search: '',
    role: undefined,
    isEmailVerified: undefined,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Menu state
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

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
    headerActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    headerButton: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    searchBar: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    filterButton: {
      marginLeft: 0,
    },
    filtersContainer: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    filtersTitle: {
      marginBottom: theme.spacing.md,
      fontWeight: '600',
      fontSize: 16,
      color: theme.colors.text,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
    },
    filterChip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    userList: {
      flex: 1,
    },
    userListContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    userCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
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
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: theme.spacing.xs,
    },
    roleChip: {
      height: 24,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    verifiedBadge: {
      backgroundColor: theme.colors.success,
      marginRight: theme.spacing.sm,
    },
    unverifiedBadge: {
      backgroundColor: theme.colors.warning,
      marginRight: theme.spacing.sm,
    },
    lastLogin: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    userActions: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    statCard: {
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      minWidth: 80,
      marginBottom: theme.spacing.sm,
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
    loadMoreButton: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      alignSelf: 'center',
    },
  });

  // Load users with current filters
  const loadUsers = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      }

      const result = await AdminService.getUsers(
        pageNum,
        20,
        filters.search || undefined
      );

      if (reset) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }

      setPage(result.page);
      setTotalPages(result.totalPages);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers(1, true);
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (filters.search !== searchQuery) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }
  }, [searchQuery]);

  useEffect(() => {
    if (filters.search !== undefined) {
      loadUsers(1, true);
    }
  }, [filters]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadUsers(page + 1, false);
    }
  };

  const handleUserPress = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user);
    } else {
      // Navigate to user details or show user actions
      setMenuVisible(user.id);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'member' | 'admin' | 'moderator') => {
    try {
      await AdminService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setMenuVisible(null);
      Alert.alert('Success', 'User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleSendNotification = (user: User) => {
    // Navigate to notification creation for this user
    router.push(`/admin/notifications?userId=${user.id}`);
    setMenuVisible(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return theme.colors.primary;
      case 'moderator': return theme.colors.secondary;
      case 'member': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return 'Never';
    
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderUserCard = (user: User) => (
    <Card
      key={user.id}
      style={styles.userCard}
      onPress={() => handleUserPress(user)}
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
                {user.first_name} {user.last_name}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <Chip
                  mode="outlined"
                  style={[styles.roleChip, { borderColor: getRoleColor(user.role) }]}
                  textStyle={{ color: getRoleColor(user.role), fontSize: 12 }}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Chip>
                <Badge
                  style={user.is_email_verified ? styles.verifiedBadge : styles.unverifiedBadge}
                  size={8}
                />
                <Text style={styles.lastLogin}>
                  Last login: {formatLastLogin(user.last_login_at)}
                </Text>
              </View>
            </View>
          </View>
          
          {showActions && (
            <View style={styles.userActions}>
              <Menu
                visible={menuVisible === user.id}
                onDismiss={() => setMenuVisible(null)}
                anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(user.id)}
              />
                }
              >
                <Menu.Item
                  onPress={() => handleRoleChange(user.id, 'admin')}
                  title="Make Admin"
                  leadingIcon="shield-account"
                />
                <Menu.Item
                  onPress={() => handleRoleChange(user.id, 'moderator')}
                  title="Make Moderator"
                  leadingIcon="account-supervisor"
                />
                <Menu.Item
                  onPress={() => handleRoleChange(user.id, 'member')}
                  title="Make Member"
                  leadingIcon="account"
                />
                <Divider />
                <Menu.Item
                  onPress={() => handleSendNotification(user)}
                  title="Send Notification"
                  leadingIcon="notifications"
                />
              </Menu>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card style={styles.filtersContainer} elevation={1}>
        <Text style={styles.filtersTitle}>
          Filters
        </Text>
        <View style={styles.filterChips}>
          <Chip
            selected={filters.role === undefined}
            onPress={() => setFilters(prev => ({ ...prev, role: undefined }))}
            mode="outlined"
            style={styles.filterChip}
          >
            All Roles
          </Chip>
          <Chip
            selected={filters.role === 'admin'}
            onPress={() => setFilters(prev => ({ ...prev, role: 'admin' }))}
            mode="outlined"
            style={styles.filterChip}
          >
            Admins
          </Chip>
          <Chip
            selected={filters.role === 'moderator'}
            onPress={() => setFilters(prev => ({ ...prev, role: 'moderator' }))}
            mode="outlined"
            style={styles.filterChip}
          >
            Moderators
          </Chip>
          <Chip
            selected={filters.role === 'member'}
            onPress={() => setFilters(prev => ({ ...prev, role: 'member' }))}
            mode="outlined"
            style={styles.filterChip}
          >
            Members
          </Chip>
        </View>
        <View style={styles.filterChips}>
          <Chip
            selected={filters.isEmailVerified === undefined}
            onPress={() => setFilters(prev => ({ ...prev, isEmailVerified: undefined }))}
            mode="outlined"
            style={styles.filterChip}
          >
            All Users
          </Chip>
          <Chip
            selected={filters.isEmailVerified === true}
            onPress={() => setFilters(prev => ({ ...prev, isEmailVerified: true }))}
            mode="outlined"
            style={styles.filterChip}
          >
            Verified
          </Chip>
          <Chip
            selected={filters.isEmailVerified === false}
            onPress={() => setFilters(prev => ({ ...prev, isEmailVerified: false }))}
            mode="outlined"
            style={styles.filterChip}
          >
            Unverified
          </Chip>
        </View>
      </Card>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => loadUsers(1, true)}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.headerActions}>
          <Button
            mode="outlined"
            onPress={() => router.push('/admin/roles')}
            icon="account-cog"
            compact
            style={styles.headerButton}
          >
            Manage Roles
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/admin/audit-logs')}
            icon="clock"
            compact
            style={styles.headerButton}
          >
            Audit Logs
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/admin/notifications')}
            icon="notifications"
            compact
            style={styles.headerButton}
          >
            Notifications
          </Button>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter"
          size={24}
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        />
      </View>

      {renderFilters()}

      {/* User List */}
      <ScrollView
        style={styles.userList}
        contentContainerStyle={styles.userListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="people-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {filters.search ? 'No users found matching your search' : 'No users found'}
            </Text>
            {filters.search && (
              <Button mode="outlined" onPress={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </View>
        ) : (
          <>
            {users.map(renderUserCard)}
            
            {hasMore && (
              <Button
                mode="outlined"
                onPress={handleLoadMore}
                loading={loading}
                style={styles.loadMoreButton}
              >
                Load More Users
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default UserManagementSection;
