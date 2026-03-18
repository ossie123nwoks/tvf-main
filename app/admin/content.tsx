import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar } from '@/components/admin/ui';
import ContentManagementSection from '@/components/admin/ContentManagementSection';

export default function ContentPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title="Content Management"
          subtitle="Manage sermons, articles, and other posts"
          backButton
        />
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
