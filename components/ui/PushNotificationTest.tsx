import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { pushNotificationService } from '@/lib/notifications/push';
import { useAuth } from '@/lib/auth/AuthContext';

export default function PushNotificationTest() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    button: {
      marginBottom: theme.spacing.sm,
    },
    status: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.sm,
    },
  });

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const currentToken = await pushNotificationService.getExpoPushToken();
      setToken(currentToken);
      setIsRegistered(!!currentToken);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const registerForPushNotifications = async () => {
    setIsLoading(true);
    try {
      const newToken = await pushNotificationService.registerForPushNotifications();
      if (newToken) {
        setToken(newToken);
        setIsRegistered(true);
        Alert.alert('Success', 'Push notifications registered successfully!');
      } else {
        Alert.alert('Error', 'Failed to register for push notifications');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', `Failed to register: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to send test notifications');
      return;
    }

    setIsLoading(true);
    try {
      const success = await pushNotificationService.sendNotificationToUser(
        user.id,
        {
          title: 'Test Notification',
          body: 'This is a test notification from TRUEVINE FELLOWSHIP app!',
          data: { type: 'test' },
        }
      );

      if (success) {
        Alert.alert('Success', 'Test notification sent!');
      } else {
        Alert.alert('Error', 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      Alert.alert('Error', `Failed to send: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const unregisterFromPushNotifications = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.unregisterFromPushNotifications();
      setToken(null);
      setIsRegistered(false);
      Alert.alert('Success', 'Push notifications unregistered');
    } catch (error) {
      console.error('Unregistration error:', error);
      Alert.alert('Error', `Failed to unregister: ${(error as any).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: theme.spacing.md }}>
            Push Notifications Test
          </Text>

          <View style={styles.status}>
            <Text variant="bodyMedium">
              Status: {isRegistered ? '✅ Registered' : '❌ Not Registered'}
            </Text>
            {token && (
              <Text variant="bodySmall" style={{ marginTop: theme.spacing.xs }}>
                Token: {token.substring(0, 20)}...
              </Text>
            )}
          </View>

          {isLoading && (
            <View style={{ marginVertical: theme.spacing.md }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}

          {!isRegistered ? (
            <Button
              mode="contained"
              onPress={registerForPushNotifications}
              style={styles.button}
              disabled={isLoading}
            >
              Register for Push Notifications
            </Button>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={sendTestNotification}
                style={styles.button}
                disabled={isLoading || !user}
              >
                Send Test Notification
              </Button>

              <Button
                mode="outlined"
                onPress={unregisterFromPushNotifications}
                style={styles.button}
                disabled={isLoading}
              >
                Unregister
              </Button>
            </>
          )}

          {!user && (
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
              Sign in to send test notifications
            </Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}
