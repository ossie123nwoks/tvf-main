import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  useTheme as usePaperTheme,
  Portal,
  Modal,
  List,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useReminders } from '@/lib/hooks/useReminders';
import { Reminder } from '@/lib/notifications/reminderService';
import { MaterialIcons } from '@expo/vector-icons';

interface ReminderManagerProps {
  contentType: 'sermon' | 'article';
  contentId: string;
  contentTitle: string;
  onClose?: () => void;
}

interface ReminderFormData {
  reminderTime: string;
  message: string;
}

export default function ReminderManager({
  contentType,
  contentId,
  contentTitle,
  onClose,
}: ReminderManagerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    reminders,
    upcomingReminders,
    stats,
    loading,
    error,
    createReminder,
    updateReminder,
    cancelReminder,
    deleteReminder,
    getReminderByContent,
    refreshReminders,
  } = useReminders();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [existingReminder, setExistingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState<ReminderFormData>({
    reminderTime: '',
    message: '',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      ...theme.shadows.small,
    },
    cardContent: {
      padding: theme.spacing.lg,
    },
    button: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
    },
    reminderItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    reminderTime: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    reminderMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    statsCard: {
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.lg,
    },
    statsContent: {
      padding: theme.spacing.md,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    statsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
  });

  // Check for existing reminder when component mounts
  useEffect(() => {
    checkExistingReminder();
  }, [contentId, contentType]);

  const checkExistingReminder = async () => {
    try {
      const reminder = await getReminderByContent(contentType, contentId);
      setExistingReminder(reminder);
    } catch (error) {
      console.error('Error checking existing reminder:', error);
    }
  };

  const handleCreateReminder = async () => {
    if (!formData.reminderTime) {
      Alert.alert('Error', 'Please select a reminder time');
      return;
    }

    try {
      const reminderTime = new Date(formData.reminderTime);
      if (reminderTime <= new Date()) {
        Alert.alert('Error', 'Reminder time must be in the future');
        return;
      }

      await createReminder({
        contentType,
        contentId,
        reminderTime,
        message: formData.message.trim() || undefined,
      });

      Alert.alert('Success', 'Reminder created successfully!');
      setShowCreateModal(false);
      setFormData({ reminderTime: '', message: '' });
      await checkExistingReminder();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reminder';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    Alert.alert(
      'Cancel Reminder',
      'Are you sure you want to cancel this reminder?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReminder(reminderId);
              Alert.alert('Success', 'Reminder cancelled successfully!');
              await checkExistingReminder();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reminder';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to permanently delete this reminder?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminderId);
              Alert.alert('Success', 'Reminder deleted successfully!');
              await checkExistingReminder();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete reminder';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const formatReminderTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getReminderStatus = (reminder: Reminder): string => {
    const now = new Date();
    const reminderTime = new Date(reminder.reminderTime);
    
    if (!reminder.isActive) {
      return 'Cancelled';
    } else if (reminderTime <= now) {
      return 'Due';
    } else {
      return 'Scheduled';
    }
  };

  const getReminderStatusColor = (reminder: Reminder): string => {
    const status = getReminderStatus(reminder);
    switch (status) {
      case 'Scheduled':
        return theme.colors.success;
      case 'Due':
        return theme.colors.warning;
      case 'Cancelled':
        return theme.colors.textTertiary;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.subtitle}>
          Set reminders for "{contentTitle}"
        </Text>
      </View>

      {/* Stats Card */}
      {stats && (
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <Text style={styles.statsTitle}>Your Reminders</Text>
            <Text style={styles.statsText}>Total: {stats.totalReminders}</Text>
            <Text style={styles.statsText}>Active: {stats.activeReminders}</Text>
            <Text style={styles.statsText}>Upcoming: {stats.upcomingReminders}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Current Reminder Status */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.title}>
            {existingReminder ? 'Current Reminder' : 'No Reminder Set'}
          </Text>
          
          {existingReminder ? (
            <View>
              <Text style={styles.reminderTime}>
                {formatReminderTime(existingReminder.reminderTime)}
              </Text>
              {existingReminder.message && (
                <Text style={styles.reminderMessage}>
                  "{existingReminder.message}"
                </Text>
              )}
              <Text style={[styles.reminderTime, { color: getReminderStatusColor(existingReminder) }]}>
                Status: {getReminderStatus(existingReminder)}
              </Text>
              
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => handleCancelReminder(existingReminder.id)}
                  style={[styles.actionButton, styles.secondaryButton]}
                  textColor={theme.colors.warning}
                  disabled={!existingReminder.isActive}
                >
                  Cancel
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleDeleteReminder(existingReminder.id)}
                  style={[styles.actionButton, styles.secondaryButton]}
                  textColor={theme.colors.error}
                >
                  Delete
                </Button>
              </View>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setShowCreateModal(true)}
              style={[styles.button, styles.primaryButton]}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
              icon="alarm-plus"
            >
              Set Reminder
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Upcoming Reminders</Text>
            {upcomingReminders.slice(0, 3).map((reminder) => (
              <View key={reminder.id} style={styles.reminderItem}>
                <Text style={styles.reminderTitle}>
                  {reminder.contentType === 'sermon' ? 'Sermon' : 'Article'} Reminder
                </Text>
                <Text style={styles.reminderTime}>
                  {formatReminderTime(reminder.reminderTime)}
                </Text>
                {reminder.message && (
                  <Text style={styles.reminderMessage}>
                    "{reminder.message}"
                  </Text>
                )}
              </View>
            ))}
            {upcomingReminders.length > 3 && (
              <Button
                mode="text"
                onPress={() => setShowManageModal(true)}
                textColor={theme.colors.primary}
              >
                View All ({upcomingReminders.length})
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Create Reminder Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Create Reminder</Text>
          
          <TextInput
            label="Reminder Time"
            value={formData.reminderTime}
            onChangeText={(text) => setFormData({ ...formData, reminderTime: text })}
            style={styles.input}
            mode="outlined"
            placeholder="YYYY-MM-DDTHH:MM"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />
          
          <TextInput
            label="Message (optional)"
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Add a custom message for your reminder..."
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateModal(false)}
              style={[styles.actionButton, styles.secondaryButton]}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateReminder}
              loading={loading}
              style={[styles.actionButton, styles.primaryButton]}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Manage All Reminders Modal */}
      <Portal>
        <Modal
          visible={showManageModal}
          onDismiss={() => setShowManageModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>All Reminders</Text>
          
          {reminders.length === 0 ? (
            <Text style={styles.subtitle}>No reminders set</Text>
          ) : (
            <List.Section>
              {reminders.map((reminder) => (
                <List.Item
                  key={reminder.id}
                  title={`${reminder.contentType === 'sermon' ? 'Sermon' : 'Article'} Reminder`}
                  description={`${formatReminderTime(reminder.reminderTime)} - ${getReminderStatus(reminder)}`}
                  left={() => (
                    <List.Icon 
                      icon="alarm" 
                      color={getReminderStatusColor(reminder)}
                    />
                  )}
                  right={() => (
                    <IconButton
                      icon="delete"
                      iconColor={theme.colors.error}
                      onPress={() => handleDeleteReminder(reminder.id)}
                    />
                  )}
                />
              ))}
            </List.Section>
          )}

          <Button
            mode="outlined"
            onPress={() => setShowManageModal(false)}
            style={[styles.button, styles.secondaryButton]}
            textColor={theme.colors.primary}
          >
            Close
          </Button>
        </Modal>
      </Portal>

      {/* Close Button */}
      {onClose && (
        <Button
          mode="outlined"
          onPress={onClose}
          style={[styles.button, styles.secondaryButton]}
          textColor={theme.colors.primary}
        >
          Close
        </Button>
      )}
    </View>
  );
}
