import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import NotificationManagementSection from '@/components/admin/NotificationManagementSection';

export default function NotificationsPage() {
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
        <AdminPageHeader title="Notifications" />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <NotificationManagementSection />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}
