import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { HeaderBar, FormInput, ActionButton, EmptyState } from '@/components/admin/ui';

export default function EditTopicPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('label');

  useEffect(() => {
    const loadTopic = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Error', 'Invalid topic ID');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Topic not found');

        setName(data.name || '');
        setDescription(data.description || '');
        setColor(data.color || '#8B5CF6');
        setIcon(data.icon || 'label');
      } catch (error) {
        console.error('Error loading topic:', error);
        Alert.alert('Error', 'Failed to load topic');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadTopic();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Topic name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('topics')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Topic updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating topic:', error);
      Alert.alert('Error', 'Failed to update topic');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={loading ? 'Loading...' : 'Edit Topic'} backButton />

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
              label="Topic Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Faith, Hope, Love"
            />
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Short description of this topic"
              multiline
              numberOfLines={3}
            />
            <FormInput
              label="Color (hex)"
              value={color}
              onChangeText={setColor}
              placeholder="#8B5CF6"
            />
            <FormInput
              label="Icon Name"
              value={icon}
              onChangeText={setIcon}
              placeholder="e.g. label, favorite, star"
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
