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
import { ContentFormData } from '@/types/admin';
import ImageUpload from '@/components/ui/ImageUpload';
import AudioUpload from '@/components/ui/AudioUpload';
import { supabase } from '@/lib/supabase/client';

interface SermonCreateFormProps {
  onSuccess?: (sermon: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ContentFormData>;
  sermonId?: string; // For edit mode
  isEdit?: boolean; // Flag to indicate edit mode
}

export const SermonCreateForm: React.FC<SermonCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  sermonId,
  isEdit = false
}) => {
  const { theme } = useTheme();
  
  // Form state
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
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    durationInput: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    durationLabel: {
      fontSize: 16,
      color: theme.colors.text,
      minWidth: 80,
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

    if (!formData.preacher?.trim()) {
      newErrors.preacher = 'Preacher is required';
    }

    if (!formData.date?.trim()) {
      newErrors.date = 'Date is required';
    }

    if (!formData.categoryId?.trim()) {
      newErrors.categoryId = 'Category is required';
    }

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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // For update mode, use minimal data to avoid issues
      const sermonData = isEdit ? {
        title: formData.title.trim(),
        preacher: formData.preacher?.trim() || '',
      } : {
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
        try {
          // Ensure sermonId is properly formatted
          const cleanId = sermonId.trim();
          console.log('Updating sermon with ID:', cleanId);
          console.log('Update data:', sermonData);
          
          // Step 1: Update basic sermon information using direct update
          console.log('Step 1: Updating basic sermon information');
          console.log('Updating sermon with ID:', cleanId);
          console.log('Update data:', {
            title: sermonData.title || '',
            preacher: sermonData.preacher || '',
            updated_at: new Date().toISOString()
          });
          
          // First, let's check if the sermon exists
          console.log('Checking if sermon exists...');
          const { data: existingSermon, error: checkError } = await supabase
            .from('sermons')
            .select('id, title, preacher, updated_at')
            .eq('id', cleanId)
            .single();
            
          if (checkError) {
            console.error('Error checking if sermon exists:', checkError);
            throw new Error(`Sermon not found: ${checkError.message}`);
          }
          
          console.log('Existing sermon data:', existingSermon);
          
          // Get current audio_url from database
          const { data: fullSermon, error: fetchError } = await supabase
            .from('sermons')
            .select('audio_url')
            .eq('id', cleanId)
            .single();
          
          const currentAudioUrl = fullSermon?.audio_url || '';
          
          // Check if the data is actually different
          const isTitleDifferent = existingSermon.title !== (sermonData.title || '');
          const isPreacherDifferent = existingSermon.preacher !== (sermonData.preacher || '');
          const isAudioUrlDifferent = currentAudioUrl !== (formData.audioUrl?.trim() || '');
          
          console.log('Data comparison:', {
            titleChanged: isTitleDifferent,
            preacherChanged: isPreacherDifferent,
            audioUrlChanged: isAudioUrlDifferent,
            currentTitle: existingSermon.title,
            newTitle: sermonData.title || '',
            currentPreacher: existingSermon.preacher,
            newPreacher: sermonData.preacher || '',
            currentAudioUrl: currentAudioUrl,
            newAudioUrl: formData.audioUrl?.trim() || ''
          });
          
          if (!isTitleDifferent && !isPreacherDifferent && !isAudioUrlDifferent) {
            console.log('No changes detected, skipping update');
            // Still proceed to thumbnail update and return the existing sermon
          } else {
            console.log('Changes detected, proceeding with update...');
            
            const updatePayload = {
              title: sermonData.title || '',
              preacher: sermonData.preacher || '',
              audio_url: formData.audioUrl?.trim() || undefined,
              updated_at: new Date().toISOString()
            };
            
            console.log('Update payload:', updatePayload);
            console.log('Target ID:', cleanId);
            
            const { data: updateData, error: updateError } = await supabase
              .from('sermons')
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
                  .rpc('update_sermon_basic', {
                    p_id: cleanId,
                    p_title: sermonData.title || '',
                    p_preacher: sermonData.preacher || ''
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
                    .rpc('update_sermon_basic', {
                      p_id: cleanId,
                      p_title: sermonData.title || '',
                      p_preacher: sermonData.preacher || ''
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
                .rpc('update_sermon_thumbnail', {
                  p_id: cleanId,
                  p_thumbnail_url: formData.thumbnailUrl
                });
                
              if (thumbnailError) {
                console.error('Thumbnail update error:', thumbnailError);
                // Don't throw error here, just log it - we still want to return the sermon
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
          
          // Step 3: Fetch the updated sermon with all fields
          console.log('Step 3: Fetching updated sermon');
          const { data: updatedSermon, error: fetchUpdatedError } = await supabase
            .from('sermons')
            .select('*')
            .eq('id', cleanId)
            .single();
            
          if (fetchUpdatedError) {
            console.error('Error fetching updated sermon:', fetchUpdatedError);
            throw fetchUpdatedError;
          }
          
          sermon = updatedSermon;
          console.log('Update successful:', sermon);
          Alert.alert('Success', 'Sermon updated successfully!');
        } catch (updateError) {
          console.error('Specific update error:', updateError);
          throw updateError;
        }
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
              placeholder="Enter sermon title"
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}
            
            <TextInput
              label="Preacher *"
              value={formData.preacher || ''}
              onChangeText={(text) => handleInputChange('preacher', text)}
              style={styles.formField}
              error={!!errors.preacher}
              placeholder="Enter preacher name"
            />
            {errors.preacher && <HelperText type="error">{errors.preacher}</HelperText>}
            
            <TextInput
              label="Date *"
              value={formData.date || ''}
              onChangeText={(text) => handleInputChange('date', text)}
              style={styles.formField}
              error={!!errors.date}
              placeholder="YYYY-MM-DD"
            />
            {errors.date && <HelperText type="error">{errors.date}</HelperText>}
            
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
              numberOfLines={4}
              placeholder="Enter sermon description"
            />
          </Card.Content>
        </Card>

        {/* Media Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Media Information</Text>
            
            <AudioUpload
              value={formData.audioUrl || ''}
              onChange={(url) => handleInputChange('audioUrl', url || '')}
              placeholder="Upload sermon audio file"
              folder="sermons"
              maxFileSize={50 * 1024 * 1024} // 50MB
            />
            {errors.audioUrl && <HelperText type="error">{errors.audioUrl}</HelperText>}
            
            <ImageUpload
              value={formData.thumbnailUrl || ''}
              onChange={(url) => handleInputChange('thumbnailUrl', url || '')}
              placeholder="Upload sermon thumbnail image"
              folder="sermons"
              aspectRatio={[16, 9]}
            />
            
            <View style={styles.durationContainer}>
              <Text style={styles.durationLabel}>Duration:</Text>
              <TextInput
                label="Minutes"
                value={formData.duration?.toString() || ''}
                onChangeText={(text) => handleInputChange('duration', parseInt(text) || 0)}
                style={styles.durationInput}
                error={!!errors.duration}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            {errors.duration && <HelperText type="error">{errors.duration}</HelperText>}
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
          {loading ? <ActivityIndicator size="small" color="white" /> : (isEdit ? 'Update Sermon' : 'Create Sermon')}
        </Button>
      </View>
    </View>
  );
};

export default SermonCreateForm;
