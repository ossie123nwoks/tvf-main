import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, Switch, HelperText, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { ContentFormData } from '@/types/admin';
import { supabase } from '@/lib/supabase/client';
import { DashboardCard, FormInput, ActionButton } from '@/components/admin/ui';
import ImageUpload from '@/components/ui/ImageUpload';
import AudioUpload from '@/components/ui/AudioUpload';
import { Category } from '@/types/content';

interface SermonCreateFormProps {
  onSuccess?: (sermon: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ContentFormData>;
  sermonId?: string;
  isEdit?: boolean;
}

export const SermonCreateForm: React.FC<SermonCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  sermonId,
  isEdit = false,
}) => {
  const { theme } = useTheme();

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    preacher: '',
    date: '',
    categoryId: '',
    topicIds: [],
    seriesId: '',
    isPublished: false,
    isFeatured: false,
    scheduledAt: '',
    thumbnailUrl: '',
    audioUrl: '',
    videoUrl: '',
    duration: 0,
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Category picker state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.preacher?.trim()) newErrors.preacher = 'Preacher is required';
    if (!formData.date?.trim()) newErrors.date = 'Date is required';
    if (!formData.categoryId?.trim()) newErrors.categoryId = 'Category is required';

<<<<<<< HEAD
    if (!formData.audioUrl?.trim() && !formData.videoUrl?.trim()) {
      newErrors.audioUrl = 'At least one media source (Audio or Video URL) is required';
=======
    // audio_url is optional — only validate format if a value was provided
    if (formData.audioUrl?.trim() && !isValidUrl(formData.audioUrl)) {
      newErrors.audioUrl = 'Please enter a valid audio URL';
>>>>>>> 66b68e48bc9cadf2e32cddda52ff8a8492e697bf
    }

    if (formData.audioUrl?.trim() && !isValidUrl(formData.audioUrl)) {
      newErrors.audioUrl = 'Please enter a valid audio URL';
    }

    if (formData.videoUrl?.trim() && !isValidUrl(formData.videoUrl)) {
      newErrors.videoUrl = 'Please enter a valid URL';
    }

    if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
      newErrors.thumbnailUrl = 'Please enter a valid URL';
    }

    if (formData.duration && (formData.duration < 0 || formData.duration > 1440)) {
      newErrors.duration = 'Duration must be between 0 and 1440 minutes';
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

      const sermonData = isEdit
        ? {
            title: formData.title.trim(),
            preacher: formData.preacher?.trim() || '',
            date: formData.date?.trim() || new Date().toISOString(),
            description: formData.description?.trim() || undefined,
            audio_url: formData.audioUrl?.trim() || undefined,
            video_url: formData.videoUrl?.trim() || undefined,
            thumbnail_url: formData.thumbnailUrl?.trim() || undefined,
            duration: formData.duration ?? 0,
            category_id: formData.categoryId || undefined,
            series_id: formData.seriesId || undefined,
            is_published: formData.isPublished,
            is_featured: formData.isFeatured ?? false,
            scheduled_at: formData.scheduledAt || undefined,
          }
        : {
            title: formData.title.trim(),
            preacher: formData.preacher?.trim() || '',
            date: formData.date?.trim() || new Date().toISOString(),
            description: formData.description?.trim() || undefined,
            audio_url: formData.audioUrl?.trim() || undefined,
            video_url: formData.videoUrl?.trim() || undefined,
            thumbnail_url: formData.thumbnailUrl?.trim() || undefined,
            duration: formData.duration ?? 0,
            category_id: formData.categoryId || undefined,
            series_id: formData.seriesId || undefined,
            is_published: formData.isPublished,
            is_featured: formData.isFeatured ?? false,
            scheduled_at: formData.scheduledAt || undefined,
          };

      let sermon;
      if (isEdit && sermonId) {
        const cleanId = sermonId.trim();
          const updatePayload = {
          title: sermonData.title,
          preacher: sermonData.preacher,
          audio_url: sermonData.audio_url,
          video_url: sermonData.video_url,
          category_id: sermonData.category_id,
          description: sermonData.description,
          thumbnail_url: sermonData.thumbnail_url,
          duration: sermonData.duration,
          is_published: sermonData.is_published,
          is_featured: sermonData.is_featured,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('sermons')
          .update(updatePayload)
          .eq('id', cleanId)
          .select();

        if (updateError) {
          try {
            const { error: rpcError } = await supabase.rpc('update_sermon_basic', {
              p_id: cleanId,
              p_title: sermonData.title,
              p_preacher: sermonData.preacher,
            });
            if (rpcError) throw updateError;
          } catch (e) {
            throw updateError;
          }
        }

        if (formData.thumbnailUrl) {
          try {
            await supabase.rpc('update_sermon_thumbnail', {
              p_id: cleanId,
              p_thumbnail_url: formData.thumbnailUrl,
            });
          } catch (e) {}
        }

        const { data: updatedSermon } = await supabase
          .from('sermons')
          .select('*')
          .eq('id', cleanId)
          .single();

        sermon = updatedSermon;
        Alert.alert('Success', 'Sermon updated successfully!');
      } else {
        sermon = await AdminService.createSermon(sermonData);
        Alert.alert('Success', 'Sermon created successfully!');
      }

      onSuccess?.(sermon);
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} sermon:`, error);
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} sermon. Please try again.`);
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

  const renderCategoryPicker = () => (
    <View style={styles.fieldContainer}>
      <Text style={{ ...theme.typography.labelLarge, color: theme.colors.textSecondary, marginBottom: 8 }}>
        Category *
      </Text>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: errors.categoryId ? theme.colors.error : theme.colors.cardBorder,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => setCategoryPickerVisible(true)}
        activeOpacity={0.7}
      >
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Text
              style={{
                ...theme.typography.bodyMedium,
                color: selectedCategory ? theme.colors.text : theme.colors.textTertiary,
                flex: 1,
              }}
            >
              {selectedCategory ? selectedCategory.name : 'Select a category...'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.textSecondary} />
          </>
        )}
      </TouchableOpacity>
      {errors.categoryId && (
        <HelperText type="error">{errors.categoryId}</HelperText>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryPickerVisible(false)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.cardBorder }]}>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text }}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {categories.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textTertiary }}>
                  No categories found
                </Text>
              </View>
            ) : (
              <FlatList
                data={categories}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = formData.categoryId === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary + '18'
                            : 'transparent',
                          borderBottomColor: theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        handleInputChange('categoryId', item.id);
                        setCategoryPickerVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: item.color || theme.colors.primary },
                        ]}
                      />
                      <Text
                        style={{
                          ...theme.typography.bodyMedium,
                          color: isSelected ? theme.colors.primary : theme.colors.text,
                          flex: 1,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={{ maxHeight: 360 }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <DashboardCard title="Basic Information" style={styles.card}>
        <FormInput
          label="Title"
          value={formData.title}
          onChangeText={text => handleInputChange('title', text)}
          error={errors.title}
          placeholder="Enter sermon title"
        />
        <FormInput
          label="Preacher"
          value={formData.preacher || ''}
          onChangeText={text => handleInputChange('preacher', text)}
          error={errors.preacher}
          placeholder="Enter preacher name"
        />
        <FormInput
          label="Date"
          value={formData.date || ''}
          onChangeText={text => handleInputChange('date', text)}
          error={errors.date}
          placeholder="YYYY-MM-DD"
        />
        {renderCategoryPicker()}
        <FormInput
          label="Description"
          value={formData.description || ''}
          onChangeText={text => handleInputChange('description', text)}
          error={errors.description}
          placeholder="Enter sermon description"
          multiline
          numberOfLines={4}
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
<<<<<<< HEAD
            Audio File <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>(optional if video provided)</Text>
=======
            Audio File
            <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}> (optional)</Text>
>>>>>>> 66b68e48bc9cadf2e32cddda52ff8a8492e697bf
          </Text>
          <AudioUpload
            value={formData.audioUrl || ''}
            onChange={url => handleInputChange('audioUrl', url || '')}
            placeholder="Upload sermon audio file (optional)"
            folder="sermons"
            maxFileSize={200 * 1024 * 1024}
          />
          {errors.audioUrl && <HelperText type="error">{errors.audioUrl}</HelperText>}
        </View>

        <FormInput
          label="Video URL (optional)"
          value={formData.videoUrl || ''}
          onChangeText={text => handleInputChange('videoUrl', text)}
          error={errors.videoUrl}
          placeholder="https://youtube.com/watch?v=... or Supabase URL"
          autoCapitalize="none"
          keyboardType="url"
        />


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
            placeholder="Upload sermon thumbnail image"
            folder="sermons"
            aspectRatio={[16, 9]}
          />
          {errors.thumbnailUrl && <HelperText type="error">{errors.thumbnailUrl}</HelperText>}
        </View>

        <FormInput
          label="Duration (minutes)"
          value={formData.duration?.toString() || ''}
          onChangeText={text => handleInputChange('duration', parseInt(text) || 0)}
          error={errors.duration}
          placeholder="0"
          keyboardType="numeric"
        />
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

        <View style={styles.switchContainer}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.text }}>
              Mark as Featured
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 }}>
              Featured sermons are highlighted with a star badge
            </Text>
          </View>
          <Switch
            value={formData.isFeatured ?? false}
            onValueChange={value => handleInputChange('isFeatured', value)}
            color={theme.colors.accent || theme.colors.primary}
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
          label={isEdit ? 'Update Sermon' : 'Create Sermon'}
          loading={loading}
          onPress={handleSubmit}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
};

export default SermonCreateForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    minHeight: 52,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSheet: {
    width: '100%',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyCategories: {
    padding: 32,
    alignItems: 'center',
  },
});
