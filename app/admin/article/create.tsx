import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { ArticleCreateForm } from '@/components/admin/ArticleCreateForm';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function CreateArticlePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const handleSuccess = (article: any) => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Create Article" backButton />
        <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
          <ArticleCreateForm onSuccess={handleSuccess} onCancel={handleCancel} />
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
