import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaUploadSection from '@/components/admin/MediaUploadSection';
import { useRouter } from 'expo-router';

export default function MediaUploadPage() {
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

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload completed:', files);
    // Handle successful upload
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // Handle upload error
  };

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Media Upload" />
        </Appbar.Header>
        <View style={styles.content}>
          <MediaUploadSection
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={10}
            maxFileSize={50}
          />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
