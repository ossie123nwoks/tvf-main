import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ContentManagementSection from '@/components/admin/ContentManagementSection';

export default function ContentPage() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <AdminPageHeader title="Content Management" />
        <View style={styles.content}>
          <ContentManagementSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}


