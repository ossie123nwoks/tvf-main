import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import UserManagementSection from '@/components/admin/UserManagementSection';

export default function UserManagementPage() {
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
        <AdminPageHeader title="User Management" />
        <View style={styles.content}>
          <UserManagementSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
