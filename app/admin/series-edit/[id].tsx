import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { HeaderBar, FormInput, ActionButton } from '@/components/admin/ui';

export default function EditSeriesPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    const loadSeries = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid series ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Series not found');

        setName(data.name || '');
        setDescription(data.description || '');
        setThumbnailUrl(data.thumbnail_url || '');
      } catch (error) {
        console.error('Error loading series:', error);
        Alert.alert('Error', 'Failed to load series');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Series name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('series')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Series updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating series:', error);
      Alert.alert('Error', 'Failed to update series');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={loading ? 'Loading...' : 'Edit Series'} backButton />

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            <FormInput
              label="Series Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Gospel of John"
            />
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the series"
              multiline
              numberOfLines={3}
            />
            <FormInput
              label="Thumbnail URL"
              value={thumbnailUrl}
              onChangeText={setThumbnailUrl}
              placeholder="https://example.com/image.jpg"
            />

            <View style={styles.actions}>
              <ActionButton
                label="Cancel"
                variant="outline"
                onPress={() => router.back()}
                style={{ marginRight: 12 }}
              />
              <ActionButton
                label="Save Changes"
                icon="save"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
});
