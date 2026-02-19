import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { useDeepLinking } from '@/lib/hooks/useDeepLinking';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Component to initialize deep linking
function DeepLinkingInitializer({ children }: { children: React.ReactNode }) {
  // Initialize deep linking hook
  useDeepLinking();

  return <>{children}</>;
}

// Component to initialize push notifications
function PushNotificationInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { registerForPushNotifications } = usePushNotifications();

  // Register for push notifications when user is authenticated
  React.useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user, registerForPushNotifications]);

  return <>{children}</>;
}

// Component to provide Paper theme based on our custom theme
function AppContent() {
  const { theme, isDark } = useTheme();

  // Create Paper theme that matches our custom theme
  const paperTheme = useMemo(() => isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          surfaceVariant: theme.colors.surfaceVariant,
          onBackground: theme.colors.onBackground,
          onSurface: theme.colors.onSurface,
          onSurfaceVariant: theme.colors.onSurfaceVariant,
          error: theme.colors.error,
          onError: theme.colors.onBackground,
          errorContainer: theme.colors.error,
          onErrorContainer: theme.colors.onBackground,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          surfaceVariant: theme.colors.surfaceVariant,
          onBackground: theme.colors.onBackground,
          onSurface: theme.colors.onSurface,
          onSurfaceVariant: theme.colors.onSurfaceVariant,
          error: theme.colors.error,
          onError: theme.colors.onBackground,
          errorContainer: theme.colors.error,
          onErrorContainer: theme.colors.onBackground,
        },
      }, [theme, isDark]);

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <PushNotificationInitializer>
          <DeepLinkingInitializer>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sermon/[id]" />
              <Stack.Screen name="article/[id]" />
              <Stack.Screen name="saved" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="password-reset" />
              <Stack.Screen name="email-verification" />
              <Stack.Screen name="admin" />
            </Stack>
          </DeepLinkingInitializer>
        </PushNotificationInitializer>
      </PaperProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
