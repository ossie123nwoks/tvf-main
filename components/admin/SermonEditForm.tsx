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
import { Sermon } from '@/types/content';
import { useAdminAuth } from './AdminAuthGuard';

export default function SermonEditForm() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { checkPermission } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preacher: '',
    audio_url: '',
    thumbnail_url: '',
    duration: '',
    date: '',
    is_published: true,
  });

  const canEdit = checkPermission('content.sermons.edit');

  useEffect(() => {
    if (id) {
      loadSermon();
    }
  }, [id]);

  const loadSermon = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since we don't have a getSermonById method
      // In a real app, you'd call AdminService.getSermonById(id)
      const mockSermon = {
        id: id!,
        title: 'Sample Sermon',
        description: 'This is a sample sermon description',
        preacher: 'Pastor John Doe',
        audio_url: 'https://example.com/audio.mp3',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        duration: 1800, // 30 minutes in seconds
        date: new Date().toISOString(),
        is_published: true,
        category_id: '',
        tags: [],
        downloads: 0,
        views: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Sermon;
      setSermon(mockSermon);
      setFormData({
        title: mockSermon.title,
        description: mockSermon.description || '',
        preacher: mockSermon.preacher,
        audio_url: mockSermon.audio_url || '',
        thumbnail_url: mockSermon.thumbnail_url || '',
        duration: mockSermon.duration?.toString() || '',
        date: mockSermon.date ? new Date(mockSermon.date).toISOString().split('T')[0] : '',
        is_published: mockSermon.is_published,
      });
    } catch (error) {
      console.error('Error loading sermon:', error);
      Alert.alert('Error', 'Failed to load sermon details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to edit sermons');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Sermon title is required');
      return;
    }

    if (!formData.preacher.trim()) {
      Alert.alert('Validation Error', 'Preacher name is required');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      };

      // In a real app, you'd call AdminService.updateSermon(id, updateData)
      console.log('Updating sermon:', id, updateData);
      Alert.alert('Success', 'Sermon updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating sermon:', error);
      Alert.alert('Error', 'Failed to update sermon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to delete sermons');
      return;
    }

    Alert.alert(
      'Delete Sermon',
      'Are you sure you want to delete this sermon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              // In a real app, you'd call AdminService.deleteSermon(id)
              console.log('Deleting sermon:', id);
              Alert.alert('Success', 'Sermon deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting sermon:', error);
              Alert.alert('Error', 'Failed to delete sermon');
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
            Loading sermon...
          </Text>
        </View>
      </View>
    );
  }

  if (!sermon) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Sermon not found
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
              Edit Sermon
            </Text>

            <TextInput
              label="Sermon Title *"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Preacher *"
              value={formData.preacher}
              onChangeText={(text) => setFormData(prev => ({ ...prev, preacher: text }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Audio URL"
              value={formData.audio_url}
              onChangeText={(text) => setFormData(prev => ({ ...prev, audio_url: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="https://example.com/audio.mp3"
            />

            <TextInput
              label="Thumbnail URL"
              value={formData.thumbnail_url}
              onChangeText={(text) => setFormData(prev => ({ ...prev, thumbnail_url: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="https://example.com/thumbnail.jpg"
            />

            <TextInput
              label="Duration (seconds)"
              value={formData.duration}
              onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="1800"
              keyboardType="numeric"
            />

            <TextInput
              label="Date"
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
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
          Delete Sermon
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
