import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import SeriesManagementSection from '@/components/admin/SeriesManagementSection';
import { HeaderBar } from '@/components/admin/ui';

export default function SeriesAdminScreen() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Series Management" backButton />
        <View style={styles.content}>
          <SeriesManagementSection />
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
