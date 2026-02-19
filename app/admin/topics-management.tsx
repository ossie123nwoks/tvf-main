import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import TopicManagementSection from '@/components/admin/TopicManagementSection';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '@/components/admin/AdminAuthGuard';

export default function TopicsAdminScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { checkPermission } = useAdminAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    unauthorizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    unauthorizedText: {
      fontSize: 18,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
  });

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check permissions
  const hasPermission = checkPermission('topics.create') || checkPermission('topics.manage');
  if (!hasPermission) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Text style={styles.unauthorizedText}>
          You don't have permission to access this page.
        </Text>
        <Appbar.BackAction onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Topic Management" />
      </Appbar.Header>
      <View style={styles.content}>
        <TopicManagementSection />
      </View>
    </View>
  );
}
