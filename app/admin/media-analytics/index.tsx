import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaAnalyticsSection from '@/components/admin/MediaAnalyticsSection';
import { useRouter } from 'expo-router';

export default function MediaAnalyticsPage() {
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

  const handleOptimizationAction = (action: string, data: any) => {
    console.log('Optimization action:', action, data);
    
    switch (action) {
      case 'cleanup':
        router.push('/admin/media-cleanup');
        break;
      case 'review':
        router.push('/admin/media');
        break;
      case 'optimize':
        // Handle image optimization
        console.log('Image optimization not implemented yet');
        break;
      case 'archive':
        // Handle file archiving
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
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Media Analytics" />
        </Appbar.Header>
        <View style={styles.content}>
          <MediaAnalyticsSection onOptimizationAction={handleOptimizationAction} />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
