import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Switch, HelperText, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { ContentFormData } from '@/types/admin';
import { supabase } from '@/lib/supabase/client';
import { DashboardCard, FormInput, ActionButton } from '@/components/admin/ui';
import ImageUpload from '@/components/ui/ImageUpload';
import AudioUpload from '@/components/ui/AudioUpload';

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
    scheduledAt: '',
    thumbnailUrl: '',
    audioUrl: '',
    duration: 0,
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.preacher?.trim()) newErrors.preacher = 'Preacher is required';
    if (!formData.date?.trim()) newErrors.date = 'Date is required';
    if (!formData.categoryId?.trim()) newErrors.categoryId = 'Category is required';

    if (!formData.audioUrl?.trim()) {
      newErrors.audioUrl = 'Audio URL is required';
    } else if (!isValidUrl(formData.audioUrl)) {
      newErrors.audioUrl = 'Please enter a valid URL';
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
            audio_url: formData.audioUrl?.trim() || '',
            thumbnail_url: formData.thumbnailUrl?.trim() || undefined,
            duration: formData.duration || undefined,
            category_id: formData.categoryId || undefined,
            series_id: formData.seriesId || undefined,
            is_published: formData.isPublished,
            scheduled_at: formData.scheduledAt || undefined,
          }
        : {
            title: formData.title.trim(),
            preacher: formData.preacher?.trim() || '',
            date: formData.date?.trim() || new Date().toISOString(),
            description: formData.description?.trim() || undefined,
            audio_url: formData.audioUrl?.trim() || '',
            thumbnail_url: formData.thumbnailUrl?.trim() || undefined,
            duration: formData.duration || undefined,
            category_id: formData.categoryId || undefined,
            series_id: formData.seriesId || undefined,
            is_published: formData.isPublished,
            scheduled_at: formData.scheduledAt || undefined,
          };

      let sermon;
      if (isEdit && sermonId) {
        // Standard supabase update logic using rpc and fallback
        const cleanId = sermonId.trim();
        const updatePayload = {
          title: sermonData.title,
          preacher: sermonData.preacher,
          audio_url: sermonData.audio_url,
          updated_at: new Date().toISOString(),
        };

        const { data: updateData, error: updateError } = await supabase
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

  return (
    <View style={styles.container}>
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
        <FormInput
          label="Category ID"
          value={formData.categoryId || ''}
          onChangeText={text => handleInputChange('categoryId', text)}
          error={errors.categoryId}
          placeholder="Enter category ID"
        />
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
            Audio File
          </Text>
          <AudioUpload
            value={formData.audioUrl || ''}
            onChange={url => handleInputChange('audioUrl', url || '')}
            placeholder="Upload sermon audio file"
            folder="sermons"
            maxFileSize={50 * 1024 * 1024}
          />
          {errors.audioUrl && <HelperText type="error">{errors.audioUrl}</HelperText>}
        </View>

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
