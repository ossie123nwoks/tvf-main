import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AdminService } from '@/lib/supabase/admin';
import { Article } from '@/types/content';
import { useAdminAuth } from './AdminAuthGuard';

export default function ArticleEditForm() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { checkPermission } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    thumbnail_url: '',
    is_published: true,
  });

  const canEdit = checkPermission('content.articles.edit');

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since we don't have a getArticleById method
      // In a real app, you'd call AdminService.getArticleById(id)
      const mockArticle: Article = {
        id: id!,
        title: 'Sample Article',
        content: 'This is a sample article content with detailed information about the topic.',
        excerpt: 'This is a sample article excerpt.',
        author: 'John Doe',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        category_id: 'general',
        tags: [],
        views: 0,
        is_featured: false,
        is_published: true,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setArticle(mockArticle);
      setFormData({
        title: mockArticle.title,
        content: mockArticle.content || '',
        author: mockArticle.author,
        thumbnail_url: mockArticle.thumbnail_url || '',
        is_published: mockArticle.is_published,
      });
    } catch (error) {
      console.error('Error loading article:', error);
      Alert.alert('Error', 'Failed to load article details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to edit articles');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Article title is required');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Validation Error', 'Article content is required');
      return;
    }

    if (!formData.author.trim()) {
      Alert.alert('Validation Error', 'Author name is required');
      return;
    }

    try {
      setSaving(true);
      // In a real app, you'd call AdminService.updateArticle(id, formData)
      console.log('Updating article:', id, formData);
      Alert.alert('Success', 'Article updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating article:', error);
      Alert.alert('Error', 'Failed to update article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to delete articles');
      return;
    }

    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              // In a real app, you'd call AdminService.deleteArticle(id)
              console.log('Deleting article:', id);
              Alert.alert('Success', 'Article deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading article...
          </Text>
        </View>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Article not found
          </Text>
          <Button mode="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Edit Article
            </Text>

            <TextInput
              label="Article Title *"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Author *"
              value={formData.author}
              onChangeText={(text) => setFormData(prev => ({ ...prev, author: text }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Content *"
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={8}
            />

            <TextInput
              label="Thumbnail URL"
              value={formData.thumbnail_url}
              onChangeText={(text) => setFormData(prev => ({ ...prev, thumbnail_url: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="https://example.com/thumbnail.jpg"
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                Published
              </Text>
              <Switch
                value={formData.is_published}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_published: value }))}
              />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={[styles.button, { borderColor: theme.colors.outline }]}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          loading={saving}
          disabled={saving || !canEdit}
        >
          Save Changes
        </Button>
      </View>

      {canEdit && (
        <Button
          mode="outlined"
          onPress={handleDelete}
          style={[styles.deleteButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
          disabled={saving}
        >
          Delete Article
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  deleteButton: {
    margin: 16,
    marginTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});
