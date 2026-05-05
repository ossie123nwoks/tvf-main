import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { SermonCreateForm } from '@/components/admin/SermonCreateForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AdminService } from '@/lib/supabase/admin';
import { Sermon } from '@/types/content';
import { HeaderBar, EmptyState } from '@/components/admin/ui';

export default function EditSermonPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSermon = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid sermon ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const cleanId = decodeURIComponent(id).trim();
        const sermonData = await AdminService.getSermonById(cleanId);
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
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={sermon ? 'Edit Sermon' : 'Loading Sermon...'} backButton />

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !sermon ? (
          <View style={styles.stateContainer}>
            <EmptyState
              icon="error-outline"
              title="Sermon Not Found"
              description="Could not find the sermon you are looking for."
              actionLabel="Go Back"
              onAction={() => router.back()}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
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
                videoUrl: sermon.video_url,
                thumbnailUrl: sermon.thumbnail_url,
                duration: sermon.duration,
                categoryId: sermon.category_id,
                seriesId: sermon.series_id,
                isPublished: sermon.is_published,
                scheduledAt: (sermon as any).scheduled_at,
              }}
            />
          </ScrollView>
        )}
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
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
