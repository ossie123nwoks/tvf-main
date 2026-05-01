import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import ArticleManagementSection from '@/components/admin/ArticleManagementSection';
import { HeaderBar } from '@/components/admin/ui';

export default function ArticlesAdminScreen() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Manage Articles" backButton />
        <View style={styles.content}>
          <ArticleManagementSection />
        </View>
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
