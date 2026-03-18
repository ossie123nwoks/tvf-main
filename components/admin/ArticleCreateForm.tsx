import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Switch, HelperText, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { ContentService } from '@/lib/supabase/content';
import { ContentFormData } from '@/types/admin';
import { supabase } from '@/lib/supabase/client';
import { DashboardCard, FormInput, ActionButton } from '@/components/admin/ui';
import ImageUpload from '@/components/ui/ImageUpload';

interface ArticleCreateFormProps {
  onSuccess?: (article: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ContentFormData>;
  articleId?: string;
  isEdit?: boolean;
}

export const ArticleCreateForm: React.FC<ArticleCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  articleId,
  isEdit = false,
}) => {
  const { theme } = useTheme();

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content: '',
    author: '',
    categoryId: '',
    topicIds: [],
    seriesId: '',
    isPublished: false,
    scheduledAt: '',
    thumbnailUrl: '',
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author?.trim()) newErrors.author = 'Author is required';
    if (!formData.categoryId?.trim()) newErrors.categoryId = 'Category is required';
    if (!formData.content?.trim()) newErrors.content = 'Content is required';

    if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
      newErrors.thumbnailUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const articleData = {
        title: formData.title.trim(),
        author: formData.author?.trim() || '',
        description: formData.description?.trim() || undefined,
        content: formData.content?.trim() || '',
        excerpt: formData.description?.trim() || formData.content?.trim().substring(0, 200) || '',
        thumbnail_url: formData.thumbnailUrl?.trim() || undefined,
        category_id: formData.categoryId || undefined,
        is_published: formData.isPublished,
        published_at: formData.isPublished ? new Date().toISOString() : undefined,
        scheduled_at: formData.scheduledAt || undefined,
      };

      let article;
      if (isEdit && articleId) {
        const cleanId = articleId.trim();
        const updatePayload = {
          title: articleData.title,
          author: articleData.author,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('articles')
          .update(updatePayload)
          .eq('id', cleanId)
          .select();

        if (updateError) {
          try {
            const { error: rpcError } = await supabase.rpc('update_article_basic', {
              p_id: cleanId,
              p_title: articleData.title,
              p_author: articleData.author,
            });
            if (rpcError) throw updateError;
          } catch (e) {
            throw updateError;
          }
        }

        if (formData.thumbnailUrl) {
          try {
            await supabase.rpc('update_article_thumbnail', {
              p_id: cleanId,
              p_thumbnail_url: formData.thumbnailUrl,
            });
          } catch (e) {}
        }

        const { data: updatedArticle } = await supabase
          .from('articles')
          .select('*')
          .eq('id', cleanId)
          .single();

        article = updatedArticle;

        if (formData.topicIds && formData.topicIds.length > 0) {
          await ContentService.assignTopicsToArticle(article.id, formData.topicIds);
        }
        if (formData.seriesId) {
          await ContentService.assignSeriesToArticle(article.id, [formData.seriesId]);
        }

        Alert.alert('Success', 'Article updated successfully!');
      } else {
        article = await AdminService.createArticle(articleData);

        if (formData.topicIds && formData.topicIds.length > 0) {
          await ContentService.assignTopicsToArticle(article.id, formData.topicIds);
        }
        if (formData.seriesId) {
          await ContentService.assignSeriesToArticle(article.id, [formData.seriesId]);
        }

        Alert.alert('Success', 'Article created successfully!');
      }

      onSuccess?.(article);
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} article:`, error);
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} article. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <DashboardCard title="Basic Information" style={styles.card}>
        <FormInput
          label="Title"
          value={formData.title}
          onChangeText={text => handleInputChange('title', text)}
          error={errors.title}
          placeholder="Enter article title"
        />
        <FormInput
          label="Author"
          value={formData.author || ''}
          onChangeText={text => handleInputChange('author', text)}
          error={errors.author}
          placeholder="Enter author name"
        />
        <FormInput
          label="Category ID"
          value={formData.categoryId || ''}
          onChangeText={text => handleInputChange('categoryId', text)}
          error={errors.categoryId}
          placeholder="Enter category ID"
        />
        <FormInput
          label="Description / Excerpt"
          value={formData.description || ''}
          onChangeText={text => handleInputChange('description', text)}
          error={errors.description}
          placeholder="Enter article description"
          multiline
          numberOfLines={3}
        />
      </DashboardCard>

      <DashboardCard title="Content" style={styles.card}>
        <FormInput
          label="Article Content"
          value={formData.content || ''}
          onChangeText={text => handleInputChange('content', text)}
          error={errors.content}
          placeholder="Write your article content here..."
          multiline
          numberOfLines={10}
        />
      </DashboardCard>

      <DashboardCard title="Media Information" style={styles.card}>
        <View style={styles.uploadSection}>
          <Text
            style={{
              ...theme.typography.labelLarge,
              color: theme.colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Thumbnail Image
          </Text>
          <ImageUpload
            value={formData.thumbnailUrl || ''}
            onChange={url => handleInputChange('thumbnailUrl', url || '')}
            placeholder="Upload article thumbnail image"
            folder="articles"
            aspectRatio={[16, 9]}
          />
          {errors.thumbnailUrl && <HelperText type="error">{errors.thumbnailUrl}</HelperText>}
        </View>
      </DashboardCard>

      <DashboardCard title="Publishing Options" style={styles.card}>
        <View style={styles.switchContainer}>
          <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.text }}>
            Publish immediately
          </Text>
          <Switch
            value={formData.isPublished}
            onValueChange={value => handleInputChange('isPublished', value)}
            color={theme.colors.primary}
          />
        </View>

        {!formData.isPublished && (
          <FormInput
            label="Schedule for (optional)"
            value={formData.scheduledAt || ''}
            onChangeText={text => handleInputChange('scheduledAt', text)}
            placeholder="YYYY-MM-DD HH:MM"
          />
        )}
      </DashboardCard>

      <View style={styles.actions}>
        <ActionButton
          label="Cancel"
          variant="outline"
          onPress={() => onCancel && onCancel()}
          disabled={loading}
          style={{ flex: 1, marginRight: 8 }}
        />
        <ActionButton
          label={isEdit ? 'Update Article' : 'Create Article'}
          loading={loading}
          onPress={handleSubmit}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
};

export default ArticleCreateForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  uploadSection: {
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
});
