import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ContentManagementSection from '@/components/admin/ContentManagementSection';

export default function ContentPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        <AdminPageHeader title="Content Management" />
        <View style={staticStyles.content}>
          <ContentManagementSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
