import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaAnalyticsSection from '@/components/admin/MediaAnalyticsSection';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function MediaAnalyticsPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleOptimizationAction = (action: string, data: any) => {
    switch (action) {
      case 'cleanup':
        router.push('/admin/media-cleanup');
        break;
      case 'review':
        router.push('/admin/media');
        break;
      case 'optimize':
        console.log('Image optimization not implemented yet');
        break;
      case 'archive':
        console.log('File archiving not implemented yet');
        break;
      case 'organize':
        router.push('/admin/media');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Media Analytics" backButton />
        <View style={styles.content}>
          <MediaAnalyticsSection onOptimizationAction={handleOptimizationAction} />
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
