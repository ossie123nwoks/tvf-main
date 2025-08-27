import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Switch, List, Divider, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'content' | 'reminders' | 'updates' | 'marketing';
}

interface NotificationSettingsProps {
  preferences: NotificationPreference[];
  onPreferenceChange: (id: string, enabled: boolean) => void;
  onSaveSettings?: () => void;
  onResetDefaults?: () => void;
  showSaveButton?: boolean;
  showResetButton?: boolean;
}

export default function NotificationSettings({
  preferences,
  onPreferenceChange,
  onSaveSettings,
  onResetDefaults,
  showSaveButton = true,
  showResetButton = true
}: NotificationSettingsProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  
  const [hasChanges, setHasChanges] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

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
      lineHeight: 24,
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
    preferenceCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      ...theme.shadows.small,
    },
    preferenceContent: {
      padding: theme.spacing.md,
    },
    preferenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    preferenceTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    preferenceDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    preferenceIcon: {
      marginRight: theme.spacing.sm,
    },
    categoryHeader: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.md,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    resetButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    resetButtonText: {
      color: theme.colors.text,
    },
    infoCard: {
      backgroundColor: theme.colors.info,
      marginBottom: theme.spacing.lg,
    },
    infoContent: {
      padding: theme.spacing.md,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: theme.spacing.xs,
    },
    infoText: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
      lineHeight: 20,
    },
  });

  const handlePreferenceChange = (id: string, enabled: boolean) => {
    const updatedPreferences = localPreferences.map(pref =>
      pref.id === id ? { ...pref, enabled } : pref
    );
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
    onPreferenceChange(id, enabled);
  };

  const handleSaveSettings = () => {
    setHasChanges(false);
    if (onSaveSettings) {
      onSaveSettings();
    }
  };

  const handleResetDefaults = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
    if (onResetDefaults) {
      onResetDefaults();
    }
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

  const groupedPreferences = localPreferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  const categoryLabels = {
    content: 'Content Notifications',
    reminders: 'Reminders & Alerts',
    updates: 'App Updates',
    marketing: 'News & Updates',
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

        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              <MaterialIcons name="info" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              Important Note
            </Text>
            <Text style={styles.infoText}>
              Some notifications are essential for app functionality and cannot be disabled. 
              You can always change these settings later.
            </Text>
          </Card.Content>
        </Card>

        {Object.entries(groupedPreferences).map(([category, prefs]) => (
          <View key={category} style={styles.section}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Text>
            </View>

            {prefs.map((preference) => (
              <Card key={preference.id} style={styles.preferenceCard}>
                <Card.Content style={styles.preferenceContent}>
                  <View style={styles.preferenceHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <MaterialIcons
                        name={preference.icon as any}
                        size={20}
                        color={getCategoryColor(preference.category)}
                        style={styles.preferenceIcon}
                      />
                      <Text style={styles.preferenceTitle}>{preference.title}</Text>
                    </View>
                    <Switch
                      value={preference.enabled}
                      onValueChange={(enabled) => handlePreferenceChange(preference.id, enabled)}
                      color={theme.colors.primary}
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
                  <Text style={styles.preferenceDescription}>
                    {preference.description}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        ))}

        {(showSaveButton || showResetButton) && (
          <View style={styles.actions}>
            {showSaveButton && (
              <Button
                mode="contained"
                onPress={handleSaveSettings}
                style={styles.saveButton}
                labelStyle={styles.saveButtonText}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            )}
            {showResetButton && (
              <Button
                mode="outlined"
                onPress={handleResetDefaults}
                style={styles.resetButton}
                labelStyle={styles.resetButtonText}
              >
                Reset to Defaults
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

