import React from 'react';
import { Stack } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // For tablet, use sidebar + stack
  if (isTablet) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <AdminSidebar />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </View>
    );
  }

  // For mobile, just use stack with no headers (AdminPageHeader handles it)
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
