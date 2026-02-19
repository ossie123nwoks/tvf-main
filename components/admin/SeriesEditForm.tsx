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
import { Series } from '@/types/content';
import { useAdminAuth } from './AdminAuthGuard';

export default function SeriesEditForm() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { checkPermission } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [series, setSeries] = useState<Series | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976D2',
    icon: 'book',
    is_active: true,
  });

  const canEdit = checkPermission('series.manage');

  useEffect(() => {
    if (id) {
      loadSeries();
    }
  }, [id]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since we don't have a getSeriesById method
      // In a real app, you'd call AdminService.getSeriesById(id)
      const mockSeries = {
        id: id!,
        name: 'Sample Series',
        description: 'This is a sample series description',
        color: '#1976D2',
        icon: 'book',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Series;
      setSeries(mockSeries);
      setFormData({
        name: mockSeries.name,
        description: mockSeries.description || '',
        color: (mockSeries as any).color || '#1976D2',
        icon: (mockSeries as any).icon || 'book',
        is_active: mockSeries.is_active,
      });
    } catch (error) {
      console.error('Error loading series:', error);
      Alert.alert('Error', 'Failed to load series details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to edit series');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Series name is required');
      return;
    }

    try {
      setSaving(true);
      // In a real app, you'd call AdminService.updateSeries(id, formData)
      console.log('Updating series:', id, formData);
      Alert.alert('Success', 'Series updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating series:', error);
      Alert.alert('Error', 'Failed to update series');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to delete series');
      return;
    }

    Alert.alert(
      'Delete Series',
      'Are you sure you want to delete this series? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              // In a real app, you'd call AdminService.deleteSeries(id)
              console.log('Deleting series:', id);
              Alert.alert('Success', 'Series deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting series:', error);
              Alert.alert('Error', 'Failed to delete series');
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
            Loading series...
          </Text>
        </View>
      </View>
    );
  }

  if (!series) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Series not found
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
              Edit Series
            </Text>

            <TextInput
              label="Series Name *"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
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
              label="Color (Hex Code)"
              value={formData.color}
              onChangeText={(text) => setFormData(prev => ({ ...prev, color: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="#1976D2"
            />

            <TextInput
              label="Icon Name"
              value={formData.icon}
              onChangeText={(text) => setFormData(prev => ({ ...prev, icon: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="book"
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                Active
              </Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
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
          Delete Series
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
