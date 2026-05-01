import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import SermonManagementSection from '@/components/admin/SermonManagementSection';
import { HeaderBar } from '@/components/admin/ui';

export default function SermonsAdminScreen() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Manage Sermons" backButton />
        <View style={styles.content}>
          <SermonManagementSection />
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
