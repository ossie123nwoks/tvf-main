import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CarouselManagementSection from '@/components/admin/CarouselManagementSection';

export default function CarouselPage() {
  const { theme } = useTheme();

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        <AdminPageHeader title="Carousel Management" />
        <View style={staticStyles.content}>
          <CarouselManagementSection />
        </View>
      </View>
    </AdminAuthGuard>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
