import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AuthGuard } from './AuthGuard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export const ProtectedTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <AuthGuard requireAuth={true} fallbackRoute="/auth">
      <ErrorBoundary>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="sermons"
            options={{
              title: 'Sermons',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="microphone" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="articles"
            options={{
              title: 'Articles',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </ErrorBoundary>
    </AuthGuard>
  );
};
