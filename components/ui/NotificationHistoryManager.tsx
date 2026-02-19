import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import {
  Card,
  Text,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  Searchbar,
  Menu,
  Checkbox,
  IconButton,
  FAB,
  SegmentedButtons,
  DataTable,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useNotificationHistory } from '@/lib/hooks/useNotificationHistory';
import { NotificationHistoryItem, NotificationHistoryFilters } from '@/lib/notifications/historyService';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface NotificationHistoryManagerProps {
  onNotificationPress?: (notification: NotificationHistoryItem) => void;
  onAnalyticsPress?: (notification: NotificationHistoryItem) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  showBulkActions?: boolean;
}

export default function NotificationHistoryManager({
  onNotificationPress,
  onAnalyticsPress,
  showFilters = true,
  showSearch = true,
  showBulkActions = true,
}: NotificationHistoryManagerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    notifications,
    stats,
    loading,
    error,
    hasMore,
    loadNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    markMultipleAsRead,
    markMultipleAsUnread,
    deleteNotification,
    deleteMultipleNotifications,
    archiveNotification,
    searchNotifications,
    refresh,
    clearError,
  } = useNotificationHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [filters, setFilters] = useState<NotificationHistoryFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'priority'>('date');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    headerStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchContainer: {
      flex: 1,
    },
    filterButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    viewModeButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    bulkActions: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    bulkActionButton: {
      marginRight: theme.spacing.sm,
    },
    notificationCard: {
      margin: theme.spacing.sm,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    notificationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    notificationBody: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notificationDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    notificationActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
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
      flex: 1,
      justifyContent: 'center',
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
    fab: {
      position: 'absolute',
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
  });

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchNotifications(searchQuery, filters);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadNotifications(filters, true);
    }
  }, [searchQuery, filters, searchNotifications, loadNotifications]);

  const handleNotificationPress = (notification: NotificationHistoryItem) => {
    if (onNotificationPress) {
      onNotificationPress(notification);
    } else {
      // Default behavior: mark as read and navigate
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      // Navigate based on notification data
      if (notification.data?.contentId && notification.data?.contentType) {
        router.push(`/${notification.data.contentType}/${notification.data.contentId}`);
      }
    }
  };

  const handleNotificationLongPress = (notification: NotificationHistoryItem) => {
    if (showBulkActions) {
      if (selectedNotifications.includes(notification.id)) {
        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
      } else {
        setSelectedNotifications(prev => [...prev, notification.id]);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleBulkMarkAsRead = () => {
    if (selectedNotifications.length > 0) {
      markMultipleAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleBulkMarkAsUnread = () => {
    if (selectedNotifications.length > 0) {
      markMultipleAsUnread(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotifications.length > 0) {
      deleteMultipleNotifications(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleBulkArchive = () => {
    if (selectedNotifications.length > 0) {
      selectedNotifications.forEach(id => archiveNotification(id));
      setSelectedNotifications([]);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'content':
        return 'article';
      case 'reminder':
        return 'alarm';
      case 'update':
        return 'update';
      case 'marketing':
        return 'campaign';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'content':
        return theme.colors.primary;
      case 'reminder':
        return theme.colors.warning;
      case 'update':
        return theme.colors.info;
      case 'marketing':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'low':
        return theme.colors.textSecondary;
      default:
        return theme.colors.primary;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: NotificationHistoryItem }) => {
    const isSelected = selectedNotifications.includes(item.id);
    const isUnread = !item.isRead;

    return (
      <Card
        style={[
          styles.notificationCard,
          isUnread && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
          isSelected && { backgroundColor: theme.colors.primaryContainer },
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
      >
        <Card.Content>
          <View style={styles.notificationHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {showBulkActions && (
                <View style={{ marginRight: theme.spacing.sm }}>
                  <Checkbox
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={() => handleNotificationLongPress(item)}
                  />
                </View>
              )}

              <MaterialIcons
                name={getNotificationIcon(item.type) as any}
                size={20}
                color={getNotificationColor(item.type)}
                style={{ marginRight: theme.spacing.sm }}
              />

              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.priority && item.priority !== 'normal' && (
                <Chip
                  compact
                  style={{ backgroundColor: getPriorityColor(item.priority) + '20' }}
                  textStyle={{ color: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </Chip>
              )}

              {isUnread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.primary,
                    marginLeft: theme.spacing.sm,
                  }}
                />
              )}
            </View>
          </View>

          <View style={styles.notificationMeta}>
            <Chip
              compact
              icon={getNotificationIcon(item.type)}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.text }}
            >
              {item.type}
            </Chip>

            {item.source && item.source !== 'system' && (
              <Chip
                compact
                style={{ backgroundColor: theme.colors.surfaceVariant, marginLeft: theme.spacing.sm }}
                textStyle={{ color: theme.colors.text }}
              >
                {item.source}
              </Chip>
            )}
          </View>

          <Text style={styles.notificationBody} numberOfLines={3}>
            {item.body}
          </Text>

          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>
              {formatDate(item.sentAt)}
            </Text>

            <View style={styles.notificationActions}>
              {onAnalyticsPress && (
                <IconButton
                  icon="analytics"
                  size={16}
                  onPress={() => onAnalyticsPress(item)}
                  iconColor={theme.colors.primary}
                />
              )}

              <IconButton
                icon={isUnread ? 'mark-email-read' : 'mark-email-unread'}
                size={16}
                onPress={() => isUnread ? markAsRead(item.id) : markAsUnread(item.id)}
                iconColor={theme.colors.primary}
              />

              <IconButton
                icon="delete"
                size={16}
                onPress={() => deleteNotification(item.id)}
                iconColor={theme.colors.error}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons
        name="notifications-none"
        size={48}
        color={theme.colors.textSecondary}
        style={styles.emptyStateIcon}
      />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No notifications found matching your search.' : 'No notifications yet.'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'Try adjusting your search terms.' : 'You\'ll see notifications here when they arrive.'}
      </Text>
    </View>
  );

  const renderErrorState = () => (
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
        onPress={refresh}
        textColor={theme.colors.primary}
      >
        Retry
      </Button>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading notifications...</Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return renderLoadingState();
  }

  if (error && notifications.length === 0) {
    return renderErrorState();
  }

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {stats && (
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.unread}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Object.keys(stats.byType).length}
              </Text>
              <Text style={styles.statLabel}>Types</Text>
            </View>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {showSearch && (
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search notifications..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
          </View>
        )}

        {showFilters && (
          <Menu
            visible={showFiltersMenu}
            onDismiss={() => setShowFiltersMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowFiltersMenu(true)}
                style={styles.filterButton}
                icon="tune"
              >
                Filters
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilters({ ...filters, isRead: undefined });
                setShowFiltersMenu(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setFilters({ ...filters, isRead: false });
                setShowFiltersMenu(false);
              }}
              title="Unread Only"
            />
            <Menu.Item
              onPress={() => {
                setFilters({ ...filters, isRead: true });
                setShowFiltersMenu(false);
              }}
              title="Read Only"
            />
          </Menu>
        )}

        <Button
          mode="outlined"
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          style={styles.viewModeButton}
          icon={viewMode === 'list' ? 'view-grid' : 'view-list'}
        >
          {viewMode === 'list' ? 'Grid' : 'List'}
        </Button>
      </View>

      {/* Bulk Actions */}
      {showBulkActions && selectedNotifications.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={{ color: theme.colors.text, marginRight: theme.spacing.md }}>
            {selectedNotifications.length} selected
          </Text>

          <Button
            mode="outlined"
            onPress={handleSelectAll}
            style={styles.bulkActionButton}
            textColor={theme.colors.primary}
            icon="select-all"
          >
            {selectedNotifications.length === notifications.length ? 'None' : 'All'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleBulkMarkAsRead}
            style={styles.bulkActionButton}
            textColor={theme.colors.primary}
            icon="mark-email-read"
          >
            Mark Read
          </Button>

          <Button
            mode="outlined"
            onPress={handleBulkMarkAsUnread}
            style={styles.bulkActionButton}
            textColor={theme.colors.primary}
            icon="mark-email-unread"
          >
            Mark Unread
          </Button>

          <Button
            mode="outlined"
            onPress={handleBulkDelete}
            style={styles.bulkActionButton}
            textColor={theme.colors.error}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loading && notifications.length > 0 ? (
            <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={
          notifications.length === 0 ? { flex: 1 } : { paddingBottom: 80 }
        }
      />

      {/* FAB for quick actions */}
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={refresh}
        label="Refresh"
      />
    </View>
  );
}
