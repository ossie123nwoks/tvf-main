import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar } from '@/components/admin/ui';
import MediaLibrarySection from '@/components/admin/MediaLibrarySection';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function MediaLibraryPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleFileSelect = (file: any) => {
    console.log('File selected:', file);
  };

  const handleFileEdit = (file: any) => {
    router.push(`/admin/media-metadata?fileId=${file.id}`);
  };

  const handleFileDelete = (file: any) => {
    console.log('Delete file:', file);
  };

  const rightActions = (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={() => router.push('/admin/media-upload')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="upload" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={() => router.push('/admin/media-analytics')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="bar-chart" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
        onPress={() => router.push('/admin/media-cleanup')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="delete-sweep" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title="Media Library"
          subtitle="Manage your app's media files"
          backButton
          rightAction={rightActions}
        />
        <View style={styles.content}>
          <MediaLibrarySection
            onFileSelect={handleFileSelect}
            onFileEdit={handleFileEdit}
            onFileDelete={handleFileDelete}
            selectionMode={false}
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
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
});
