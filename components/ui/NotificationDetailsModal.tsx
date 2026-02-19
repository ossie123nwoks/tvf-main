import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Text,
  useTheme as usePaperTheme,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  IconButton,
  DataTable,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { NotificationHistoryItem } from '@/lib/notifications/historyService';
import { useNotificationHistory } from '@/lib/hooks/useNotificationHistory';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface NotificationDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  notification: NotificationHistoryItem | null;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onArchive?: (notificationId: string) => void;
}

export default function NotificationDetailsModal({
  visible,
  onDismiss,
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onArchive,
}: NotificationDetailsModalProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { getNotificationAnalytics, getNotificationEngagement } = useNotificationHistory();

  const [analytics, setAnalytics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const styles = StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.background,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
    },
    notificationCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    notificationTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    notificationBody: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    notificationMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.xs,
    },
    metaValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    analyticsSection: {
      marginTop: theme.spacing.lg,
    },
    analyticsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    analyticsCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    analyticsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    analyticsItem: {
      width: '48%',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    analyticsValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    analyticsLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    engagementList: {
      marginTop: theme.spacing.md,
    },
    engagementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    engagementIcon: {
      marginRight: theme.spacing.sm,
    },
    engagementContent: {
      flex: 1,
    },
    engagementAction: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    engagementTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    dataSection: {
      marginTop: theme.spacing.lg,
    },
    dataTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    dataContent: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
      fontFamily: 'monospace',
      fontSize: 12,
      color: theme.colors.text,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    if (visible && notification) {
      loadAnalytics();
    }
  }, [visible, notification]);

  const loadAnalytics = async () => {
    if (!notification) return;

    setLoadingAnalytics(true);
    try {
      const [analyticsData, engagementData] = await Promise.all([
        getNotificationAnalytics(notification.id),
        getNotificationEngagement(notification.id),
      ]);

      setAnalytics(analyticsData);
      setEngagement(engagementData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleMarkAsRead = () => {
    if (notification && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsUnread = () => {
    if (notification && onMarkAsUnread) {
      onMarkAsUnread(notification.id);
    }
  };

  const handleDelete = () => {
    if (notification && onDelete) {
      onDelete(notification.id);
      onDismiss();
    }
  };

  const handleArchive = () => {
    if (notification && onArchive) {
      onArchive(notification.id);
      onDismiss();
    }
  };

  const handleNavigateToContent = () => {
    if (notification?.data?.contentId && notification?.data?.contentType) {
      router.push(`/${notification.data.contentType}/${notification.data.contentId}`);
      onDismiss();
    }
  };

  const handleOpenDeepLink = () => {
    if (notification?.data?.deepLink) {
      Linking.openURL(notification.data.deepLink);
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
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEngagementTime = (date: Date) => {
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

  if (!notification) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notification Details</Text>
            <IconButton
              icon="close"
              onPress={onDismiss}
              iconColor={theme.colors.text}
            />
          </View>

          {/* Notification Content */}
          <View style={styles.content}>
            <Card style={styles.notificationCard}>
              <Card.Content>
                <View style={styles.notificationHeader}>
                  <MaterialIcons
                    name={getNotificationIcon(notification.type) as any}
                    size={24}
                    color={getNotificationColor(notification.type)}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Chip
                    icon={getNotificationIcon(notification.type)}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    textStyle={{ color: theme.colors.primary }}
                  >
                    {notification.type}
                  </Chip>

                  {notification.priority && notification.priority !== 'normal' && (
                    <Chip
                      compact
                      style={{
                        backgroundColor: getPriorityColor(notification.priority) + '20',
                        marginLeft: theme.spacing.sm,
                      }}
                      textStyle={{ color: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority}
                    </Chip>
                  )}
                </View>

                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>

                <View style={styles.notificationMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Sent:</Text>
                    <Text style={styles.metaValue}>{formatDate(notification.sentAt)}</Text>
                  </View>

                  {notification.readAt && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Read:</Text>
                      <Text style={styles.metaValue}>{formatDate(notification.readAt)}</Text>
                    </View>
                  )}

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Status:</Text>
                    <Chip
                      compact
                      style={{
                        backgroundColor: notification.isRead
                          ? theme.colors.successContainer
                          : theme.colors.warningContainer,
                      }}
                      textStyle={{
                        color: notification.isRead
                          ? theme.colors.success
                          : theme.colors.warning,
                      }}
                    >
                      {notification.isRead ? 'Read' : 'Unread'}
                    </Chip>
                  </View>

                  {notification.source && notification.source !== 'system' && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Source:</Text>
                      <Text style={styles.metaValue}>{notification.source}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <View style={styles.actionButtons}>
                    {notification.isRead ? (
                      <Button
                        mode="outlined"
                        onPress={handleMarkAsUnread}
                        textColor={theme.colors.primary}
                        icon="mark-email-unread"
                      >
                        Mark Unread
                      </Button>
                    ) : (
                      <Button
                        mode="contained"
                        onPress={handleMarkAsRead}
                        buttonColor={theme.colors.primary}
                        textColor="#FFFFFF"
                        icon="mark-email-read"
                      >
                        Mark Read
                      </Button>
                    )}

                    {notification.data?.contentId && (
                      <Button
                        mode="outlined"
                        onPress={handleNavigateToContent}
                        textColor={theme.colors.primary}
                        icon="open-in-new"
                      >
                        View Content
                      </Button>
                    )}

                    {notification.data?.deepLink && (
                      <Button
                        mode="outlined"
                        onPress={handleOpenDeepLink}
                        textColor={theme.colors.primary}
                        icon="link"
                      >
                        Open Link
                      </Button>
                    )}
                  </View>

                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="archive"
                      onPress={handleArchive}
                      iconColor={theme.colors.textSecondary}
                    />
                    <IconButton
                      icon="delete"
                      onPress={handleDelete}
                      iconColor={theme.colors.error}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Analytics Section */}
            <View style={styles.analyticsSection}>
              <Text style={styles.analyticsTitle}>Analytics</Text>

              {loadingAnalytics ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.emptyStateText}>Loading analytics...</Text>
                </View>
              ) : analytics ? (
                <Card style={styles.analyticsCard}>
                  <Card.Content>
                    <View style={styles.analyticsGrid}>
                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.sentCount}</Text>
                        <Text style={styles.analyticsLabel}>Sent</Text>
                      </View>

                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.deliveredCount}</Text>
                        <Text style={styles.analyticsLabel}>Delivered</Text>
                      </View>

                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.openedCount}</Text>
                        <Text style={styles.analyticsLabel}>Opened</Text>
                      </View>

                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.clickedCount}</Text>
                        <Text style={styles.analyticsLabel}>Clicked</Text>
                      </View>

                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.deliveryRate.toFixed(1)}%</Text>
                        <Text style={styles.analyticsLabel}>Delivery Rate</Text>
                      </View>

                      <View style={styles.analyticsItem}>
                        <Text style={styles.analyticsValue}>{analytics.openRate.toFixed(1)}%</Text>
                        <Text style={styles.analyticsLabel}>Open Rate</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No analytics data available</Text>
                </View>
              )}

              {/* Engagement History */}
              {engagement.length > 0 && (
                <View style={styles.engagementList}>
                  <Text style={styles.dataTitle}>Recent Engagement</Text>

                  {engagement.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.engagementItem}>
                      <MaterialIcons
                        name={
                          item.action === 'opened' ? 'visibility' :
                            item.action === 'clicked' ? 'touch-app' :
                              item.action === 'dismissed' ? 'close' : 'info'
                        }
                        size={20}
                        color={getNotificationColor(notification.type)}
                        style={styles.engagementIcon}
                      />

                      <View style={styles.engagementContent}>
                        <Text style={styles.engagementAction}>
                          {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                        </Text>
                        <Text style={styles.engagementTime}>
                          {formatEngagementTime(new Date(item.timestamp))}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Notification Data */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <View style={styles.dataSection}>
                <Text style={styles.dataTitle}>Notification Data</Text>
                <Text style={styles.dataContent}>
                  {JSON.stringify(notification.data, null, 2)}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
