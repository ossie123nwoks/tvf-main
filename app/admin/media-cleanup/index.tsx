import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaCleanupSection from '@/components/admin/MediaCleanupSection';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function MediaCleanupPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleCleanupComplete = (result: any) => {
    console.log('Cleanup completed:', result);
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Media Cleanup" backButton />
        <View style={styles.content}>
          <MediaCleanupSection onCleanupComplete={handleCleanupComplete} />
        </View>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
