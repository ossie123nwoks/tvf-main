import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import UserManagementSection from '@/components/admin/UserManagementSection';
import { HeaderBar } from '@/components/admin/ui';

export default function UserManagementPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title="User Management"
          subtitle="Manage app users, verify emails, and set roles"
          backButton
        />
        <View style={styles.content}>
          <UserManagementSection />
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
    padding: 16,
  },
});
