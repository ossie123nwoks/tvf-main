import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AuditLogSection from '@/components/admin/AuditLogSection';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/admin/ui';

export default function AuditLogsPage() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Audit Logs" backButton />
        <View style={styles.content}>
          <AuditLogSection />
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
