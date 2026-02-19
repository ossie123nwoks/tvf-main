import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Switch,
  List,
  Divider,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useContentNotifications } from '@/lib/hooks/useContentNotifications';
import { ContentNotificationOptions } from '@/lib/notifications/contentNotifications';

interface NotificationManagerProps {
  onClose?: () => void;
}

export default function NotificationManager({ onClose }: NotificationManagerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    notifyNewSermon,
    notifyNewArticle,
    notifyFeaturedContent,
    notifySeriesUpdate,
    notifyChurchAnnouncement,
    getNotificationStats,
  } = useContentNotifications();

  // State for notification form
  const [notificationType, setNotificationType] = useState<'sermon' | 'article' | 'series' | 'announcement'>('announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contentId, setContentId] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [sermonCount, setSermonCount] = useState('1');
  
  // Notification options
  const [sendToAllUsers, setSendToAllUsers] = useState(true);
  const [delay, setDelay] = useState('0');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  
  // Loading and stats
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalSent: number;
    totalFailed: number;
    byContentType: Record<string, number>;
    recentNotifications: any[];
  } | null>(null);

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
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
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
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    switchText: {
      color: theme.colors.text,
      fontSize: 16,
      flex: 1,
      marginRight: theme.spacing.md,
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
  });

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const options: ContentNotificationOptions = {
        sendToAllUsers,
        delay: parseInt(delay) || 0,
        priority,
      };

      let result: { sent: number; failed: number };

      switch (notificationType) {
        case 'sermon':
          // For demo purposes, create a mock sermon object
          const mockSermon = {
            id: contentId || 'demo-sermon',
            title,
            description: message,
            preacher: 'Pastor',
            date: new Date().toISOString(),
            audio_url: '',
            duration: 0,
            category_id: '',
            series_id: null,
            series_name: null,
            tags: [],
            is_published: true,
            is_featured: false,
            downloads: 0,
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          result = await notifyNewSermon(mockSermon, options);
          break;

        case 'article':
          // For demo purposes, create a mock article object
          const mockArticle = {
            id: contentId || 'demo-article',
            title,
            content: message,
            excerpt: message.substring(0, 150),
            author: 'Author',
            published_at: new Date().toISOString(),
            category_id: '',
            tags: [],
            is_published: true,
            is_featured: false,
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          result = await notifyNewArticle(mockArticle, options);
          break;

        case 'series':
          result = await notifySeriesUpdate(
            contentId || 'demo-series',
            seriesName || 'Demo Series',
            parseInt(sermonCount) || 1,
            options
          );
          break;

        case 'announcement':
          result = await notifyChurchAnnouncement(title, message, options);
          break;

        default:
          throw new Error('Invalid notification type');
      }

      Alert.alert(
        'Notification Sent',
        `Successfully sent to ${result.sent} users. ${result.failed} failed.`,
        [{ text: 'OK' }]
      );

      // Refresh stats
      await loadStats();
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const notificationStats = await getNotificationStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Manager</Text>
          <Text style={styles.subtitle}>
            Send push notifications to app users for new content and announcements.
          </Text>
        </View>

        {/* Stats Card */}
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <Text style={styles.statsTitle}>Notification Statistics</Text>
              <Text style={styles.statsText}>Total Sent: {stats.totalSent}</Text>
              <Text style={styles.statsText}>Total Failed: {stats.totalFailed}</Text>
              <Text style={styles.statsText}>
                Success Rate: {stats.totalSent > 0 ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100) : 0}%
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Notification Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Type</Text>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <List.Item
                title="New Sermon"
                description="Notify users about a new sermon"
                left={() => <List.Icon icon="music-note" />}
                right={() => (
                  <Switch
                    value={notificationType === 'sermon'}
                    onValueChange={() => setNotificationType('sermon')}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="New Article"
                description="Notify users about a new article"
                left={() => <List.Icon icon="article" />}
                right={() => (
                  <Switch
                    value={notificationType === 'article'}
                    onValueChange={() => setNotificationType('article')}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Series Update"
                description="Notify users about new sermons in a series"
                left={() => <List.Icon icon="library-music" />}
                right={() => (
                  <Switch
                    value={notificationType === 'series'}
                    onValueChange={() => setNotificationType('series')}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Church Announcement"
                description="Send a general church announcement"
                left={() => <List.Icon icon="bullhorn" />}
                right={() => (
                  <Switch
                    value={notificationType === 'announcement'}
                    onValueChange={() => setNotificationType('announcement')}
                  />
                )}
              />
            </Card.Content>
          </Card>
        </View>

        {/* Notification Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Content</Text>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <TextInput
                label="Title"
                value={title}
                onChangeText={setTitle}
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
                label="Message"
                value={message}
                onChangeText={setMessage}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                theme={{
                  ...paperTheme,
                  colors: {
                    ...paperTheme.colors,
                    primary: theme.colors.primary,
                    onSurface: theme.colors.text,
                  },
                }}
              />

              {notificationType === 'sermon' || notificationType === 'article' ? (
                <TextInput
                  label="Content ID (optional)"
                  value={contentId}
                  onChangeText={setContentId}
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
              ) : null}

              {notificationType === 'series' && (
                <>
                  <TextInput
                    label="Series Name"
                    value={seriesName}
                    onChangeText={setSeriesName}
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
                    label="New Sermon Count"
                    value={sermonCount}
                    onChangeText={setSermonCount}
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
                </>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Notification Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Send to all users</Text>
                <Switch
                  value={sendToAllUsers}
                  onValueChange={setSendToAllUsers}
                />
              </View>

              <TextInput
                label="Delay (milliseconds)"
                value={delay}
                onChangeText={setDelay}
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
            </Card.Content>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleSendNotification}
            loading={loading}
            disabled={loading || !title.trim() || !message.trim()}
            style={[styles.button, styles.primaryButton]}
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
          >
            Send Notification
          </Button>

          <Button
            mode="outlined"
            onPress={loadStats}
            style={[styles.button, styles.secondaryButton]}
            textColor={theme.colors.primary}
          >
            Refresh Stats
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
    </View>
  );
}
