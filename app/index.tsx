import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function Index() {
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const { theme } = useStyles();

  // Show loading spinner while determining authentication state
  if (loading || !isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // If user is not authenticated, redirect to auth screen
  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

// Helper function to get theme colors
function useStyles() {
  const { theme } = useTheme();
  return { theme };
}
