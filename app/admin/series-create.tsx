import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { HeaderBar, FormInput, ActionButton } from '@/components/admin/ui';

export default function CreateSeriesPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Series name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('series')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('Success', 'Series created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating series:', error);
      Alert.alert('Error', 'Failed to create series');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Create Series" backButton />

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
              label="Create Series"
              icon="add"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
});
