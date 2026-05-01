import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar } from '@/components/admin/ui';
import NotificationManagementSection from '@/components/admin/NotificationManagementSection';

export default function NotificationsPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Notifications" backButton />
        <View style={styles.content}>
          <NotificationManagementSection />
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
