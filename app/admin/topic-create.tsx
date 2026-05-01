import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { HeaderBar, FormInput, ActionButton } from '@/components/admin/ui';

export default function CreateTopicPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('label');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Topic name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('topics')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          is_active: true,
          sort_order: 0,
        });

      if (error) throw error;

      Alert.alert('Success', 'Topic created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating topic:', error);
      Alert.alert('Error', 'Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Create Topic" backButton />

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
              label="Create Topic"
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
