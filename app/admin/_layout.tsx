import React from 'react';
import { Stack } from 'expo-router';
import { AdminLayout } from '@/components/admin/ui';

export default function Layout() {
  return (
    <AdminLayout scrollable={false}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </AdminLayout>
  );
}
