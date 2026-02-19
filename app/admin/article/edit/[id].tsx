import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { ArticleCreateForm } from '@/components/admin/ArticleCreateForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AdminService } from '@/lib/supabase/admin';
import { Article } from '@/types/content';

export default function EditArticlePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
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
    const loadArticle = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid article ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        // Clean the ID - remove any URL encoding or extra characters
        const cleanId = decodeURIComponent(id).trim();
        console.log('Loading article with ID:', cleanId);
        
        // Get article data
        const articleData = await AdminService.getArticleById(cleanId);
        console.log('Loaded article data:', articleData);
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
            <Appbar.Content title="Edit Article" />
          </Appbar.Header>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </View>
      </AdminAuthGuard>
    );
  }

  if (!article) {
    return (
      <AdminAuthGuard>
        <View style={styles.container}>
          <Appbar.Header style={styles.header}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Edit Article" />
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
          <Appbar.Content title="Edit Article" />
        </Appbar.Header>
        <ScrollView style={styles.content}>
          <ArticleCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isEdit={true}
            articleId={article.id}
            initialData={{
              title: article.title,
              content: article.content,
              description: article.description,
              author: article.author,
              thumbnailUrl: article.thumbnail_url,
              categoryId: article.category_id,
              isPublished: article.is_published,
              scheduledAt: article.scheduled_at,
            }}
          />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}
