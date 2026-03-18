import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { SermonCreateForm } from '@/components/admin/SermonCreateForm';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function CreateSermonPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const handleSuccess = (sermon: any) => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Create Sermon" backButton />
        <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
          <SermonCreateForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
