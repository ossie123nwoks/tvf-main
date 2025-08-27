import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider>
          <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sermon/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="article/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="password-reset" options={{ headerShown: false }} />
          <Stack.Screen name="email-verification" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
