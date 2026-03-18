import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import MediaUploadSection from '@/components/admin/MediaUploadSection';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function MediaUploadPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload completed:', files);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Upload Media" backButton />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
