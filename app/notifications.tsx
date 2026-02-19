import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Appbar,
  useTheme as usePaperTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'expo-router';
import NotificationHistoryManager from '@/components/ui/NotificationHistoryManager';
import NotificationDetailsModal from '@/components/ui/NotificationDetailsModal';
import EnhancedNotificationSettings from '@/components/ui/EnhancedNotificationSettings';
import { NotificationHistoryItem } from '@/lib/notifications/historyService';
import { ContentGuard } from '@/components/auth/ContentGuard';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedView, setSelectedView] = useState<'history' | 'settings'>('history');
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    content: {
      flex: 1,
    },
    viewSelector: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });

  const handleNotificationPress = (notification: NotificationHistoryItem) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleAnalyticsPress = (notification: NotificationHistoryItem) => {
    // Navigate to analytics screen or show analytics modal
    router.push({
      pathname: '/analytics',
      params: { notificationId: notification.id },
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    // This is handled by the NotificationHistoryManager component
    console.log('Mark as read:', notificationId);
  };

  const handleMarkAsUnread = (notificationId: string) => {
    // This is handled by the NotificationHistoryManager component
    console.log('Mark as unread:', notificationId);
  };

  const handleDelete = (notificationId: string) => {
    // This is handled by the NotificationHistoryManager component
    console.log('Delete:', notificationId);
  };

  const handleArchive = (notificationId: string) => {
    // This is handled by the NotificationHistoryManager component
    console.log('Archive:', notificationId);
  };

  return (
    <ContentGuard
      requireAuth={true}
      requireVerification={true}
      fallbackMessage="Sign in to view your notifications"
    >
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Notifications" />
        </Appbar.Header>

        <View style={styles.viewSelector}>
          <SegmentedButtons
            value={selectedView}
            onValueChange={(value) => setSelectedView(value as 'history' | 'settings')}
            buttons={[
              { value: 'history', label: 'History' },
              { value: 'settings', label: 'Settings' },
            ]}
          />
        </View>

        <View style={styles.content}>
          {selectedView === 'history' ? (
            <NotificationHistoryManager
              onNotificationPress={handleNotificationPress}
              onAnalyticsPress={handleAnalyticsPress}
              showFilters={true}
              showSearch={true}
              showBulkActions={true}
            />
          ) : (
            <EnhancedNotificationSettings />
          )}
        </View>

        {/* Notification Details Modal */}
        <NotificationDetailsModal
          visible={showDetailsModal}
          onDismiss={() => {
            setShowDetailsModal(false);
            setSelectedNotification(null);
          }}
          notification={selectedNotification}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      </View>
    </ContentGuard>
  );
}

