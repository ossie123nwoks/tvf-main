import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Switch,
  List,
  Divider,
  Button,
  useTheme as usePaperTheme,
  Portal,
  Modal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationSchedule, NotificationFrequency } from '@/lib/notifications/preferencesService';

interface EnhancedNotificationSettingsProps {
  onClose?: () => void;
}

export default function EnhancedNotificationSettings({ onClose }: EnhancedNotificationSettingsProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    preferenceGroups,
    schedules,
    frequency,
    stats,
    loading,
    error,
    updatePreference,
    updatePreferenceGroup,
    saveSchedule,
    deleteSchedule,
    updateFrequency,
    resetPreferences,
    refreshData,
  } = useNotificationPreferences();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: true,
  });
  const [newFrequency, setNewFrequency] = useState({
    maxPerDay: frequency?.maxPerDay || 10,
    maxPerWeek: frequency?.maxPerWeek || 50,
    enabled: frequency?.enabled || true,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.md,
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
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
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
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    groupDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    preferenceContent: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    preferenceTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    preferenceDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    preferenceIcon: {
      marginRight: theme.spacing.sm,
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
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    statsLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statsValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    scheduleInfo: {
      flex: 1,
    },
    scheduleName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    scheduleTime: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    frequencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    frequencyText: {
      fontSize: 16,
      color: theme.colors.text,
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
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
    },
    chip: {
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
  });

  const handlePreferenceChange = async (category: string, preferenceId: string, enabled: boolean) => {
    try {
      await updatePreference(category, preferenceId, enabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  const handleGroupToggle = async (groupId: string, enabled: boolean) => {
    try {
      await updatePreferenceGroup(groupId, enabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update preference group. Please try again.');
    }
  };

  const handleSaveSchedule = async () => {
    if (!newSchedule.name.trim()) {
      Alert.alert('Error', 'Please enter a schedule name');
      return;
    }

    try {
      await saveSchedule(newSchedule);
      setShowScheduleModal(false);
      setNewSchedule({
        name: '',
        description: '',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: true,
      });
      Alert.alert('Success', 'Schedule saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSchedule(scheduleId);
              Alert.alert('Success', 'Schedule deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete schedule. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveFrequency = async () => {
    try {
      await updateFrequency(newFrequency);
      setShowFrequencyModal(false);
      Alert.alert('Success', 'Frequency settings updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update frequency settings. Please try again.');
    }
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all notification preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetPreferences();
              Alert.alert('Success', 'Preferences reset to defaults!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return 'content-copy';
      case 'reminders':
        return 'alarm';
      case 'updates':
        return 'update';
      case 'marketing':
        return 'campaign';
      default:
        return 'notifications';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content':
        return theme.colors.sermon;
      case 'reminders':
        return theme.colors.warning;
      case 'updates':
        return theme.colors.info;
      case 'marketing':
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>
            Customize how and when you receive notifications from TRUEVINE Fellowship Church.
          </Text>
        </View>

        {/* Statistics Card */}
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <Text style={styles.statsTitle}>Notification Statistics</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Total Received:</Text>
                <Text style={styles.statsValue}>{stats.totalReceived}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Read Rate:</Text>
                <Text style={styles.statsValue}>{stats.readRate.toFixed(1)}%</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Last Notification:</Text>
                <Text style={styles.statsValue}>
                  {stats.lastNotification 
                    ? new Date(stats.lastNotification).toLocaleDateString()
                    : 'Never'
                  }
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons 
              name="notifications" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.sectionIcon} 
            />
            Notification Types
          </Text>

          {preferenceGroups.map((group) => (
            <Card key={group.id} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.groupHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  </View>
                  <Switch
                    value={group.enabled}
                    onValueChange={(enabled) => handleGroupToggle(group.id, enabled)}
                    color={getCategoryColor(group.id)}
                  />
                </View>

                {group.preferences.map((preference) => (
                  <View key={preference.id} style={styles.preferenceItem}>
                    <View style={styles.preferenceContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons
                          name={preference.icon as any}
                          size={20}
                          color={getCategoryColor(group.id)}
                          style={styles.preferenceIcon}
                        />
                        <Text style={styles.preferenceTitle}>{preference.title}</Text>
                      </View>
                      <Text style={styles.preferenceDescription}>{preference.description}</Text>
                    </View>
                    <Switch
                      value={preference.enabled}
                      onValueChange={(enabled) => handlePreferenceChange(group.id, preference.id, enabled)}
                      disabled={preference.required}
                      color={getCategoryColor(group.id)}
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Notification Schedules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons 
              name="schedule" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.sectionIcon} 
            />
            Quiet Hours
          </Text>

          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {schedules.map((schedule) => (
                <View key={schedule.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>{schedule.name}</Text>
                    <Text style={styles.scheduleTime}>
                      {schedule.quietHoursStart} - {schedule.quietHoursEnd} ({schedule.timezone})
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={() => handleDeleteSchedule(schedule.id)}
                    textColor={theme.colors.error}
                    compact
                  >
                    Delete
                  </Button>
                </View>
              ))}

              <Button
                mode="outlined"
                onPress={() => setShowScheduleModal(true)}
                style={styles.button}
                textColor={theme.colors.primary}
                icon="plus"
              >
                Add Schedule
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Notification Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons 
              name="speed" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.sectionIcon} 
            />
            Frequency Limits
          </Text>

          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.frequencyInfo}>
                <Text style={styles.frequencyText}>
                  Max {frequency?.maxPerDay || 10} per day, {frequency?.maxPerWeek || 50} per week
                </Text>
                <Button
                  mode="text"
                  onPress={() => setShowFrequencyModal(true)}
                  textColor={theme.colors.primary}
                  compact
                >
                  Edit
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Button
            mode="outlined"
            onPress={handleResetPreferences}
            style={[styles.button, styles.secondaryButton]}
            textColor={theme.colors.warning}
            icon="refresh"
          >
            Reset to Defaults
          </Button>

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
      </ScrollView>

      {/* Schedule Modal */}
      <Portal>
        <Modal
          visible={showScheduleModal}
          onDismiss={() => setShowScheduleModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Add Quiet Hours Schedule</Text>
          
          <TextInput
            label="Schedule Name"
            value={newSchedule.name}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, name: text })}
            style={styles.input}
            mode="outlined"
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
            label="Description (optional)"
            value={newSchedule.description}
            onChangeText={(text) => setNewSchedule({ ...newSchedule, description: text })}
            style={styles.input}
            mode="outlined"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TextInput
              label="Start Time"
              value={newSchedule.quietHoursStart}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, quietHoursStart: text })}
              style={[styles.input, { flex: 1 }]}
              mode="outlined"
              placeholder="HH:MM"
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
              label="End Time"
              value={newSchedule.quietHoursEnd}
              onChangeText={(text) => setNewSchedule({ ...newSchedule, quietHoursEnd: text })}
              style={[styles.input, { flex: 1 }]}
              mode="outlined"
              placeholder="HH:MM"
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  onSurface: theme.colors.text,
                },
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Button
              mode="outlined"
              onPress={() => setShowScheduleModal(false)}
              style={[styles.button, { flex: 1 }]}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveSchedule}
              style={[styles.button, { flex: 1 }]}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Frequency Modal */}
      <Portal>
        <Modal
          visible={showFrequencyModal}
          onDismiss={() => setShowFrequencyModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Notification Frequency</Text>
          
          <TextInput
            label="Max Notifications Per Day"
            value={newFrequency.maxPerDay.toString()}
            onChangeText={(text) => setNewFrequency({ ...newFrequency, maxPerDay: parseInt(text) || 10 })}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
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
            label="Max Notifications Per Week"
            value={newFrequency.maxPerWeek.toString()}
            onChangeText={(text) => setNewFrequency({ ...newFrequency, maxPerWeek: parseInt(text) || 50 })}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Button
              mode="outlined"
              onPress={() => setShowFrequencyModal(false)}
              style={[styles.button, { flex: 1 }]}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveFrequency}
              style={[styles.button, { flex: 1 }]}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
