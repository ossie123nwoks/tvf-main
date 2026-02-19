import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AuditLogSection from '@/components/admin/AuditLogSection';
import { useRouter } from 'expo-router';

export default function AuditLogsPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
  });

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Audit Logs" />
        </Appbar.Header>
        <View style={styles.content}>
          <AuditLogSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}
