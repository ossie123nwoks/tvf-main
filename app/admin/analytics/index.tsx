import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar } from '@/components/admin/ui';
import UserAnalyticsSection from '@/components/admin/UserAnalyticsSection';

export default function AnalyticsPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title="Analytics" />
        <View style={styles.content}>
          <UserAnalyticsSection />
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
