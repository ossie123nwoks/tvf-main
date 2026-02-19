import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CarouselManagementSection from '@/components/admin/CarouselManagementSection';

export default function CarouselPage() {
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
        <AdminPageHeader title="Carousel Management" />
        <View style={styles.content}>
          <CarouselManagementSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}


