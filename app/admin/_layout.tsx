import React from 'react';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    />
  );
}
