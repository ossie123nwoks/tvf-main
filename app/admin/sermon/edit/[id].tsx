import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { SermonCreateForm } from '@/components/admin/SermonCreateForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AdminService } from '@/lib/supabase/admin';
import { Sermon } from '@/types/content';

export default function EditSermonPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

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
    },
  });

  useEffect(() => {
    const loadSermon = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid sermon ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        // Clean the ID - remove any URL encoding or extra characters
        const cleanId = decodeURIComponent(id).trim();
        console.log('Loading sermon with ID:', cleanId);

        // Get sermon data
        const sermonData = await AdminService.getSermonById(cleanId);
        console.log('Loaded sermon data:', sermonData);
        setSermon(sermonData);
      } catch (error) {
        console.error('Error loading sermon:', error);
        Alert.alert('Error', 'Failed to load sermon');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadSermon();
  }, [id, router]);

  const handleSuccess = (updatedSermon: any) => {
    // Navigate back to admin dashboard
    router.back();
  };

  const handleCancel = () => {
    // Navigate back to admin dashboard
    router.back();
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <View style={styles.container}>
          <Appbar.Header style={styles.header}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Edit Sermon" />
          </Appbar.Header>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </AdminAuthGuard>
    );
  }

  if (!sermon) {
    return (
      <AdminAuthGuard>
        <View style={styles.container}>
          <Appbar.Header style={styles.header}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Edit Sermon" />
          </Appbar.Header>
          <View style={styles.loadingContainer}>
            {/* Error state - would show error message */}
          </View>
        </View>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Edit Sermon" />
        </Appbar.Header>
        <ScrollView style={styles.content}>
          <SermonCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isEdit={true}
            sermonId={sermon.id}
            initialData={{
              title: sermon.title,
              description: sermon.description,
              preacher: sermon.preacher,
              date: sermon.date,
              audioUrl: sermon.audio_url,
              thumbnailUrl: sermon.thumbnail_url,
              duration: sermon.duration,
              categoryId: sermon.category_id,
              seriesId: sermon.series_id,
              isPublished: sermon.is_published,
              scheduledAt: (sermon as any).scheduled_at,
            }}
          />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}
