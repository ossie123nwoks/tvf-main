import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaCleanupSection from '@/components/admin/MediaCleanupSection';
import { useRouter } from 'expo-router';

export default function MediaCleanupPage() {
  const { theme } = useTheme();
  const router = useRouter();

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
      padding: theme.spacing.md,
    },
  });

  const handleCleanupComplete = (result: any) => {
    console.log('Cleanup completed:', result);
    // Handle cleanup completion
  };

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Media Cleanup" />
        </Appbar.Header>
        <View style={styles.content}>
          <MediaCleanupSection onCleanupComplete={handleCleanupComplete} />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
