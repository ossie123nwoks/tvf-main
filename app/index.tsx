import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';
import SplashScreen from '@/components/ui/SplashScreen';

export default function Index() {
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const { theme } = useStyles();
  const [showSplash, setShowSplash] = useState(true);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 Index render state:', {
      loading,
      isInitialized,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
    });
  }, [loading, isInitialized, isAuthenticated, user]);

  // Show splash screen for 3 seconds, then show loading spinner
  if (showSplash) {
    return (
      <SplashScreen
        onAnimationComplete={() => setShowSplash(false)}
        duration={3000}
      />
    );
  }

  // Show loading spinner while determining authentication state
  if (loading || !isInitialized) {
    console.log('⏳ Showing loading screen:', { loading, isInitialized });
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If user is authenticated, check email verification
  if (isAuthenticated && user) {
    // If email is not verified, redirect to verification screen
    if (!user.isEmailVerified) {
      console.log('⚠️ User not verified, redirecting to verification');
      return <Redirect href="/email-verification" />;
    }
    console.log('✅ Redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // If user is not authenticated, redirect to auth screen
  console.log('🔒 Redirecting to auth screen');
  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

// Helper function to get theme colors
function useStyles() {
  const { theme } = useTheme();
  return { theme };
}
