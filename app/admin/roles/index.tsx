import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import RoleManagementSection from '@/components/admin/RoleManagementSection';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function RoleManagementPage() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Role Management" backButton />
        <View style={styles.content}>
          <RoleManagementSection />
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
