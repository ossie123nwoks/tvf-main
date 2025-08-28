import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { useDeepLinking } from '@/lib/hooks/useDeepLinking';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Component to provide Paper theme based on our custom theme
function PaperThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useTheme();
  
  // Create Paper theme that matches our custom theme
  const paperTheme = isDark ? {
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
  } : {
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
  };

  return (
    <PaperProvider theme={paperTheme}>
      {children}
    </PaperProvider>
  );
}

// Component to initialize deep linking
function DeepLinkingInitializer({ children }: { children: React.ReactNode }) {
  // Initialize deep linking hook
  useDeepLinking();
  
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PaperThemeProvider>
            <DeepLinkingInitializer>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="sermon/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="article/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="password-reset" options={{ headerShown: false }} />
                <Stack.Screen name="email-verification" options={{ headerShown: false }} />
              </Stack>
            </DeepLinkingInitializer>
          </PaperThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
