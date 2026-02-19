import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaMetadataSection from '@/components/admin/MediaMetadataSection';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function MediaMetadataPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { fileId } = useLocalSearchParams();

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

  // Mock file data - in real app, this would be fetched based on fileId
  const mockFile = {
    id: fileId as string || '1',
    filename: 'sermon_thumbnail.jpg',
    originalName: 'sermon_thumbnail.jpg',
    mimeType: 'image/jpeg',
    size: 245760,
    url: 'https://example.com/uploads/sermon_thumbnail.jpg',
    uploadedBy: 'admin_user',
    uploadedAt: '2024-01-15T10:30:00Z',
    isUsed: true,
    usageCount: 3,
    metadata: {
      dimensions: { width: 1920, height: 1080 },
      description: 'Thumbnail for Sunday sermon',
      tags: ['sermon', 'thumbnail', 'worship'],
    },
  };

  const handleMetadataUpdate = (file: any) => {
    console.log('Metadata updated:', file);
    // Handle metadata update
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={handleClose} />
          <Appbar.Content title="File Metadata" />
        </Appbar.Header>
        <View style={styles.content}>
          <MediaMetadataSection
            file={mockFile}
            onMetadataUpdate={handleMetadataUpdate}
            onClose={handleClose}
          />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
