import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import MediaLibrarySection from '@/components/admin/MediaLibrarySection';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function MediaLibraryPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    actionButton: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
  });

  const handleFileSelect = (file: any) => {
    console.log('File selected:', file);
    // Handle file selection
  };

  const handleFileEdit = (file: any) => {
    console.log('Edit file:', file);
    router.push(`/admin/media-metadata?fileId=${file.id}`);
  };

  const handleFileDelete = (file: any) => {
    console.log('Delete file:', file);
    // Handle file deletion
  };

  const rightActions = (
    <>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push('/admin/media-upload')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="upload" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push('/admin/media-analytics')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="bar-chart" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push('/admin/media-cleanup')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="delete-sweep" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </>
  );

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <AdminPageHeader title="Media Library" rightAction={rightActions} />
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