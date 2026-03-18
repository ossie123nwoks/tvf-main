import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { ArticleCreateForm } from '@/components/admin/ArticleCreateForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AdminService } from '@/lib/supabase/admin';
import { Article } from '@/types/content';
import { HeaderBar, EmptyState } from '@/components/admin/ui';

export default function EditArticlePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid article ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const cleanId = decodeURIComponent(id).trim();
        const articleData = await AdminService.getArticleById(cleanId);
        setArticle(articleData);
      } catch (error) {
        console.error('Error loading article:', error);
        Alert.alert('Error', 'Failed to load article');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, router]);

  const handleSuccess = (updatedArticle: any) => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={article ? 'Edit Article' : 'Loading Article...'} backButton />

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !article ? (
          <View style={styles.stateContainer}>
            <EmptyState
              icon="error-outline"
              title="Article Not Found"
              description="Could not find the article you are looking for."
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
            <ArticleCreateForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              isEdit={true}
              articleId={article.id}
              initialData={{
                title: article.title,
                content: article.content || '',
                excerpt: article.excerpt || '',
                author: article.author || '',
                thumbnailUrl: article.thumbnail_url || '',
                categoryId: article.category_id || '',
                isPublished: article.is_published,
                scheduledAt: (article as any).scheduled_at,
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
