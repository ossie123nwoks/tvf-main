import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  List,
  Avatar,
  ActivityIndicator,
  Divider,
  RadioButton,
  Switch,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { pushNotificationService, PushNotificationData } from '@/lib/notifications/push';

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

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  type: 'general' | 'sermon' | 'article' | 'event' | 'announcement';
  targetAudience: 'all' | 'members' | 'admins' | 'moderators' | 'custom';
}

interface NotificationManagementSectionProps {
  onNotificationSent?: (notification: any) => void;
}

const NotificationManagementSection: React.FC<NotificationManagementSectionProps> = ({
  onNotificationSent,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  // Notification form state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationType, setNotificationType] = useState<'general' | 'sermon' | 'article' | 'event' | 'announcement'>('general');
  const [targetAudience, setTargetAudience] = useState<'all' | 'members' | 'admins' | 'moderators' | 'custom'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [scheduleNotification, setScheduleNotification] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Modal state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  // Templates
  const [templates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      title: 'New Sermon Available',
      body: 'A new sermon has been uploaded. Check it out in the app!',
      type: 'sermon',
      targetAudience: 'all',
    },
    {
      id: '2',
      title: 'Weekly Announcements',
      body: 'Check out this week\'s announcements and upcoming events.',
      type: 'announcement',
      targetAudience: 'all',
    },
    {
      id: '3',
      title: 'New Article Published',
      body: 'A new article has been published. Read it now!',
      type: 'article',
      targetAudience: 'all',
    },
    {
      id: '4',
      title: 'Event Reminder',
      body: 'Don\'t forget about our upcoming event this weekend!',
      type: 'event',
      targetAudience: 'members',
    },
  ]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    composeButton: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      lineHeight: 24,
    },
    templatesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
    },
    templateCard: {
      width: '48%',
      marginBottom: theme.spacing.md,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    templateCardLastInRow: {
      marginRight: 0,
    },
    templateCardContent: {
      padding: theme.spacing.md,
    },
    templateTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
      lineHeight: 20,
    },
    templateBody: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      lineHeight: 18,
    },
    templateType: {
      fontSize: 10,
      color: theme.colors.primary,
      textTransform: 'uppercase',
      lineHeight: 14,
    },
    recentNotifications: {
      marginTop: theme.spacing.lg,
    },
    notificationCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    notificationCardContent: {
      padding: theme.spacing.md,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    notificationInfo: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
      lineHeight: 20,
    },
    notificationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    notificationType: {
      fontSize: 10,
      color: theme.colors.primary,
      textTransform: 'uppercase',
      marginRight: theme.spacing.sm,
      lineHeight: 14,
    },
    notificationTimestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxWidth: 500,
      width: '100%',
      maxHeight: '90%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    formSection: {
      marginBottom: theme.spacing.md,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    textInput: {
      marginBottom: theme.spacing.sm,
    },
    radioGroup: {
      marginBottom: theme.spacing.sm,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    radioText: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    userSelectionContainer: {
      maxHeight: 200,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    userInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    userName: {
      fontSize: 14,
      fontWeight: '500',
    },
    userEmail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    selectedUser: {
      backgroundColor: theme.colors.primary + '10',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
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
  });

  // Load users for custom targeting
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.getUsers(1, 100);
      setUsers(result.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      Alert.alert('Error', 'Please fill in both title and body');
      return;
    }

    try {
      setSending(true);

      // Prepare notification data
      const notificationData: PushNotificationData = {
        title: notificationTitle,
        body: notificationBody,
        data: {
          type: notificationType,
          timestamp: new Date().toISOString(),
        },
        categoryId: notificationType === 'sermon' ? 'content' : 
                    notificationType === 'article' ? 'content' : 
                    notificationType === 'event' ? 'reminder' : 'general',
        sound: true,
        badge: 1,
      };

      let result: { sent: number; failed: number; skipped?: number } = { sent: 0, failed: 0 };

      // Handle scheduling if needed
      if (scheduleNotification && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
          Alert.alert('Error', 'Scheduled time must be in the future');
          setSending(false);
          return;
        }

        // Schedule the notification
        const notificationId = await pushNotificationService.scheduleNotification(
          notificationData,
          scheduledDateTime
        );

        if (!notificationId) {
          Alert.alert('Error', 'Failed to schedule notification');
          setSending(false);
          return;
        }

        Alert.alert('Success', `Notification scheduled for ${scheduledDateTime.toLocaleString()}`);
      } else {
        // Send notification immediately based on target audience
        if (targetAudience === 'all') {
          result = await pushNotificationService.sendNotificationToAllUsers(notificationData);
        } else if (targetAudience === 'custom' && selectedUsers.size > 0) {
          result = await pushNotificationService.sendNotificationToUsers(
            Array.from(selectedUsers),
            notificationData
          );
        } else if (targetAudience === 'members') {
          result = await pushNotificationService.sendNotificationByRole('member', notificationData);
        } else if (targetAudience === 'admins') {
          result = await pushNotificationService.sendNotificationByRole('admin', notificationData);
        } else if (targetAudience === 'moderators') {
          result = await pushNotificationService.sendNotificationByRole('moderator', notificationData);
        }

        // Show result with detailed feedback
        if (result.sent > 0) {
          const skippedMsg = result.skipped && result.skipped > 0 ? `\nSkipped (no token): ${result.skipped}` : '';
          const failedMsg = result.failed > 0 ? `\nFailed: ${result.failed}` : '';
          Alert.alert(
            'Success', 
            `Notification sent successfully!\nSent: ${result.sent}${failedMsg}${skippedMsg}`
          );
        } else {
          const skippedMsg = result.skipped && result.skipped > 0 ? `\nSkipped (no token): ${result.skipped}` : '';
          const failedMsg = result.failed > 0 ? `\nFailed: ${result.failed}` : '';
          Alert.alert(
            'Warning',
            `No notifications were sent.${failedMsg}${skippedMsg || '\nNo users found with push tokens.'}`
          );
        }
      }

      // Log the admin action
      await AdminService.logAdminAction({
        type: 'notification_sent',
        description: `Sent notification: ${notificationTitle}`,
        metadata: {
          notificationType,
          targetAudience,
          targetUserCount: targetAudience === 'custom' ? selectedUsers.size : 'all',
          scheduled: scheduleNotification,
          result,
        },
      });

      // Reset form
      setNotificationTitle('');
      setNotificationBody('');
      setSelectedUsers(new Set());
      setShowComposeModal(false);
      setScheduleNotification(false);
      setScheduledDate('');
      setScheduledTime('');
      
      if (onNotificationSent) {
        onNotificationSent(notificationData);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setNotificationTitle(template.title);
    setNotificationBody(template.body);
    setNotificationType(template.type);
    setTargetAudience(template.targetAudience);
    setShowTemplatesModal(false);
    setShowComposeModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(users.map(user => user.id)));
  };

  const clearUserSelection = () => {
    setSelectedUsers(new Set());
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sermon': return theme.colors.primary;
      case 'article': return theme.colors.secondary;
      case 'event': return theme.colors.warning;
      case 'announcement': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const renderTemplateCard = (template: NotificationTemplate, index: number) => {
    const isLastInRow = index % 2 === 1;
    return (
      <Card
        key={template.id}
        style={[
          styles.templateCard,
          isLastInRow && styles.templateCardLastInRow
        ]}
        onPress={() => handleTemplateSelect(template)}
        elevation={2}
      >
        <View style={styles.templateCardContent}>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <Text style={styles.templateBody}>{template.body}</Text>
          <Text style={[styles.templateType, { color: getTypeColor(template.type) }]}>
            {template.type}
          </Text>
        </View>
      </Card>
    );
  };

  const renderComposeModal = () => (
    <Portal>
      <Modal
        visible={showComposeModal}
        onDismiss={() => setShowComposeModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Compose Notification</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                mode="outlined"
                value={notificationTitle}
                onChangeText={setNotificationTitle}
                placeholder="Enter notification title"
                style={styles.textInput}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                mode="outlined"
                value={notificationBody}
                onChangeText={setNotificationBody}
                placeholder="Enter notification message"
                multiline
                numberOfLines={4}
                style={styles.textInput}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type</Text>
              <RadioButton.Group
                onValueChange={(value) => setNotificationType(value as any)}
                value={notificationType}
              >
                <View style={styles.radioGroup}>
                  <View style={styles.radioOption}>
                    <RadioButton value="general" />
                    <Text style={styles.radioText}>General</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="sermon" />
                    <Text style={styles.radioText}>Sermon</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="article" />
                    <Text style={styles.radioText}>Article</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="event" />
                    <Text style={styles.radioText}>Event</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="announcement" />
                    <Text style={styles.radioText}>Announcement</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Target Audience</Text>
              <RadioButton.Group
                onValueChange={(value) => setTargetAudience(value as any)}
                value={targetAudience}
              >
                <View style={styles.radioGroup}>
                  <View style={styles.radioOption}>
                    <RadioButton value="all" />
                    <Text style={styles.radioText}>All Users</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="members" />
                    <Text style={styles.radioText}>Members Only</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="admins" />
                    <Text style={styles.radioText}>Admins Only</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="moderators" />
                    <Text style={styles.radioText}>Moderators Only</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="custom" />
                    <Text style={styles.radioText}>Custom Selection</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {targetAudience === 'custom' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Users</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowUserSelectionModal(true)}
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  {selectedUsers.size > 0 
                    ? `${selectedUsers.size} users selected` 
                    : 'Select Users'
                  }
                </Button>
              </View>
            )}

            <View style={styles.formSection}>
              <View style={styles.radioOption}>
                <Switch
                  value={scheduleNotification}
                  onValueChange={setScheduleNotification}
                />
                <Text style={styles.radioText}>Schedule for later</Text>
              </View>
            </View>

            {scheduleNotification && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Schedule Date & Time</Text>
                <TextInput
                  mode="outlined"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder="YYYY-MM-DD"
                  style={styles.textInput}
                />
                <TextInput
                  mode="outlined"
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  placeholder="HH:MM"
                  style={styles.textInput}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSendNotification}
              loading={sending}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  const renderUserSelectionModal = () => (
    <Portal>
      <Modal
        visible={showUserSelectionModal}
        onDismiss={() => setShowUserSelectionModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Users</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
            <Button mode="outlined" onPress={selectAllUsers} compact>
              Select All
            </Button>
            <Button mode="outlined" onPress={clearUserSelection} compact>
              Clear All
            </Button>
          </View>

          <ScrollView style={styles.userSelectionContainer}>
            {users.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.userItem,
                  selectedUsers.has(user.id) && styles.selectedUser,
                ]}
                onTouchEnd={() => toggleUserSelection(user.id)}
              >
                <Avatar.Text
                  size={32}
                  label={`${user.first_name[0]}${user.last_name[0]}`}
                  style={{ backgroundColor: theme.colors.primary + '20' }}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                {selectedUsers.has(user.id) && (
                  <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowUserSelectionModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => setShowUserSelectionModal(false)}>
              Done
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  const renderTemplatesModal = () => (
    <Portal>
      <Modal
        visible={showTemplatesModal}
        onDismiss={() => setShowTemplatesModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Notification Templates</Text>
          
          <ScrollView>
            <View style={styles.templatesGrid}>
              {templates.map((template, index) => renderTemplateCard(template, index))}
            </View>
          </ScrollView>

          <Button
            mode="contained"
            onPress={() => setShowTemplatesModal(false)}
            style={{ marginTop: theme.spacing.lg }}
          >
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadUsers}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="outlined"
          onPress={() => setShowTemplatesModal(true)}
          icon="book-open-variant"
          compact
        >
          Templates
        </Button>
      </View>

      {/* Compose Button */}
      <Button
        mode="contained"
        onPress={() => setShowComposeModal(true)}
        icon="plus"
        style={styles.composeButton}
      >
        Compose New Notification
      </Button>

      {/* Quick Templates */}
      <Text style={styles.sectionTitle}>
        Quick Templates
      </Text>
      <View style={styles.templatesGrid}>
        {templates.slice(0, 4).map((template, index) => renderTemplateCard(template, index))}
      </View>

      {/* Recent Notifications Placeholder */}
      <View style={styles.recentNotifications}>
        <Text style={styles.sectionTitle}>
          Recent Notifications
        </Text>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="notifications-off"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            No recent notifications sent
          </Text>
        </View>
      </View>

      {/* Modals */}
      {renderComposeModal()}
      {renderUserSelectionModal()}
      {renderTemplatesModal()}
    </View>
  );
};

export default NotificationManagementSection;
