import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AuthGuard } from './AuthGuard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export const ProtectedTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <AuthGuard requireAuth={true} requireVerification={true} fallbackRoute="/auth">
      <ErrorBoundary>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textTertiary,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.borderLight,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
              paddingTop: 8,
              elevation: 0,
              shadowOpacity: 0,
            },
            tabBarLabelStyle: {
              ...theme.typography.labelSmall,
              marginTop: 2,
            },
            tabBarIconStyle: {
              marginBottom: -2,
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="sermons"
            options={{
              title: 'Sermons',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="headphones" size={size} color={color} />
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
                <MaterialCommunityIcons name="account-circle" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </ErrorBoundary>
    </AuthGuard>
  );
};
