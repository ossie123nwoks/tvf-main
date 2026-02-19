import React, { useState } from 'react';
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
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { ContentService } from '@/lib/supabase/content';
import { ContentFormData } from '@/types/admin';
import ImageUpload from '@/components/ui/ImageUpload';
import { supabase } from '@/lib/supabase/client';

interface ArticleCreateFormProps {
  onSuccess?: (article: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ContentFormData>;
  articleId?: string; // For edit mode
  isEdit?: boolean; // Flag to indicate edit mode
}

export const ArticleCreateForm: React.FC<ArticleCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  articleId,
  isEdit = false
}) => {
  const { theme } = useTheme();
  
  // Form state
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
    ...initialData
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    formField: {
      marginBottom: theme.spacing.md,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    switchLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    contentEditor: {
      minHeight: 200,
      textAlignVertical: 'top',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
    },
    actionButton: {
      marginLeft: theme.spacing.sm,
      minWidth: 100,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: theme.spacing.xs,
    },
  });

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author?.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.categoryId?.trim()) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    }

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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

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
        try {
          // Ensure articleId is properly formatted
          const cleanId = articleId.trim();
          console.log('Updating article with ID:', cleanId);
          console.log('Update data:', articleData);
          
          // Step 1: Update basic article information using direct update
          console.log('Step 1: Updating basic article information');
          console.log('Updating article with ID:', cleanId);
          console.log('Update data:', {
            title: articleData.title || '',
            author: articleData.author || '',
            updated_at: new Date().toISOString()
          });
          
          // First, let's check if the article exists
          console.log('Checking if article exists...');
          const { data: existingArticle, error: checkError } = await supabase
            .from('articles')
            .select('id, title, author, updated_at')
            .eq('id', cleanId)
            .single();
            
          if (checkError) {
            console.error('Error checking if article exists:', checkError);
            throw new Error(`Article not found: ${checkError.message}`);
          }
          
          console.log('Existing article data:', existingArticle);
          
          // Check if the data is actually different
          const isTitleDifferent = existingArticle.title !== (articleData.title || '');
          const isAuthorDifferent = existingArticle.author !== (articleData.author || '');
          
          console.log('Data comparison:', {
            titleChanged: isTitleDifferent,
            authorChanged: isAuthorDifferent,
            currentTitle: existingArticle.title,
            newTitle: articleData.title || '',
            currentAuthor: existingArticle.author,
            newAuthor: articleData.author || ''
          });
          
          if (!isTitleDifferent && !isAuthorDifferent) {
            console.log('No changes detected, skipping update');
            // Still proceed to thumbnail update and return the existing article
          } else {
            console.log('Changes detected, proceeding with update...');
            
            const updatePayload = {
              title: articleData.title || '',
              author: articleData.author || '',
              updated_at: new Date().toISOString()
            };
            
            console.log('Update payload:', updatePayload);
            console.log('Target ID:', cleanId);
            
            const { data: updateData, error: updateError } = await supabase
              .from('articles')
              .update(updatePayload)
              .eq('id', cleanId)
              .select();
              
            if (updateError) {
              console.error('Direct update error:', updateError);
              console.error('Error details:', JSON.stringify(updateError, null, 2));
              
              // Try fallback with RPC function
              console.log('Trying fallback RPC method...');
              try {
                const { data: rpcData, error: rpcError } = await supabase
                  .rpc('update_article_basic', {
                    p_id: cleanId,
                    p_title: articleData.title || '',
                    p_author: articleData.author || ''
                  });
                
                if (rpcError) {
                  console.error('RPC fallback error:', rpcError);
                  throw updateError; // Throw original error
                }
                
                console.log('RPC fallback successful:', rpcData);
              } catch (rpcFallbackError) {
                console.error('RPC fallback failed:', rpcFallbackError);
                throw updateError; // Throw original error
              }
            } else {
              console.log('Update result:', updateData);
              if (!updateData || updateData.length === 0) {
                console.log('Direct update returned empty result, trying RPC fallback...');
                try {
                  const { data: rpcData, error: rpcError } = await supabase
                    .rpc('update_article_basic', {
                      p_id: cleanId,
                      p_title: articleData.title || '',
                      p_author: articleData.author || ''
                    });
                  
                  if (rpcError) {
                    console.error('RPC fallback error:', rpcError);
                    throw new Error('No rows were updated and RPC fallback failed');
                  }
                  
                  console.log('RPC fallback successful:', rpcData);
                } catch (rpcFallbackError) {
                  console.error('RPC fallback failed:', rpcFallbackError);
                  throw new Error('No rows were updated and RPC fallback failed');
                }
              } else {
                console.log('Basic update successful:', updateData[0]);
              }
            }
          }
          
          // Step 2: Update thumbnail URL if provided
          if (formData.thumbnailUrl) {
            console.log('Step 2: Updating thumbnail URL:', formData.thumbnailUrl);
            try {
              const { data: thumbnailData, error: thumbnailError } = await supabase
                .rpc('update_article_thumbnail', {
                  p_id: cleanId,
                  p_thumbnail_url: formData.thumbnailUrl
                });
                
              if (thumbnailError) {
                console.error('Thumbnail update error:', thumbnailError);
                // Don't throw error here, just log it - we still want to return the article
              } else {
                console.log('Thumbnail update result:', thumbnailData);
              }
            } catch (thumbnailUpdateError) {
              console.error('Exception during thumbnail update:', thumbnailUpdateError);
              // Continue despite thumbnail error
            }
          } else {
            console.log('No thumbnail URL provided, skipping thumbnail update');
          }
          
          // Step 3: Fetch the updated article with all fields
          console.log('Step 3: Fetching updated article');
          const { data: updatedArticle, error: fetchError } = await supabase
            .from('articles')
            .select('*')
            .eq('id', cleanId)
            .single();
            
          if (fetchError) {
            console.error('Error fetching updated article:', fetchError);
            throw fetchError;
          }
          
          article = updatedArticle;
          console.log('Update successful:', article);
          
          // Assign topics and series
          if (formData.topicIds && formData.topicIds.length > 0) {
            await ContentService.assignTopicsToArticle(article.id, formData.topicIds);
          }
          if (formData.seriesId) {
            await ContentService.assignSeriesToArticle(article.id, [formData.seriesId]);
          }
          
          Alert.alert('Success', 'Article updated successfully!');
        } catch (updateError) {
          console.error('Specific update error:', updateError);
          throw updateError;
        }
      } else {
        article = await AdminService.createArticle(articleData);
        
        // Assign topics and series
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

  // Handle input changes
  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Basic Information</Text>
            
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              style={styles.formField}
              error={!!errors.title}
              placeholder="Enter article title"
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}
            
            <TextInput
              label="Author *"
              value={formData.author || ''}
              onChangeText={(text) => handleInputChange('author', text)}
              style={styles.formField}
              error={!!errors.author}
              placeholder="Enter author name"
            />
            {errors.author && <HelperText type="error">{errors.author}</HelperText>}
            
            <TextInput
              label="Category ID *"
              value={formData.categoryId || ''}
              onChangeText={(text) => handleInputChange('categoryId', text)}
              style={styles.formField}
              error={!!errors.categoryId}
              placeholder="Enter category ID"
            />
            {errors.categoryId && <HelperText type="error">{errors.categoryId}</HelperText>}
            
            <TextInput
              label="Description"
              value={formData.description || ''}
              onChangeText={(text) => handleInputChange('description', text)}
              style={styles.formField}
              multiline
              numberOfLines={3}
              placeholder="Enter article description"
            />
          </Card.Content>
        </Card>

        {/* Content */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Content</Text>
            
            <TextInput
              label="Article Content *"
              value={formData.content || ''}
              onChangeText={(text) => handleInputChange('content', text)}
              style={[styles.formField, styles.contentEditor]}
              multiline
              numberOfLines={10}
              error={!!errors.content}
              placeholder="Write your article content here..."
            />
            {errors.content && <HelperText type="error">{errors.content}</HelperText>}
          </Card.Content>
        </Card>

        {/* Media Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Media Information</Text>
            
            <ImageUpload
              value={formData.thumbnailUrl || ''}
              onChange={(url) => handleInputChange('thumbnailUrl', url || '')}
              placeholder="Upload article thumbnail image"
              folder="articles"
              aspectRatio={[16, 9]}
            />
          </Card.Content>
        </Card>

        {/* Publishing Options */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Publishing Options</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Publish immediately</Text>
              <Switch
                value={formData.isPublished}
                onValueChange={(value) => handleInputChange('isPublished', value)}
              />
            </View>
            
            {!formData.isPublished && (
              <TextInput
                label="Schedule for (optional)"
                value={formData.scheduledAt || ''}
                onChangeText={(text) => handleInputChange('scheduledAt', text)}
                style={styles.formField}
                placeholder="YYYY-MM-DD HH:MM"
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onCancel}
          disabled={loading}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.actionButton}
        >
          {loading ? <ActivityIndicator size="small" color="white" /> : (isEdit ? 'Update Article' : 'Create Article')}
        </Button>
      </View>
    </View>
  );
};

export default ArticleCreateForm;
