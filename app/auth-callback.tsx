import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService } from '@/lib/supabase/auth';

/**
 * OAuth callback page for handling Google Sign-In redirects
 * This page receives the OAuth callback and processes the authentication
 */
export default function AuthCallback() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback received with params:', params);

        // Check if there's an error in the callback
        if (params.error) {
          console.error('OAuth error:', params.error);
          // Redirect back to auth screen with error
          router.replace('/auth?error=' + encodeURIComponent(params.error));
          return;
        }

        // If there's a code or hash, the OAuth flow is working
        if (params.code || params.access_token || params.type) {
          // Supabase should have already processed the callback
          // and the onAuthStateChange listener in AuthContext should handle the state update
          console.log('OAuth callback processed, waiting for auth state update...');
          
          // Give Supabase a moment to process the callback
          setTimeout(() => {
            // Check if we're authenticated
            AuthService.getCurrentUser().then(user => {
              if (user) {
                console.log('User authenticated:', user);
                router.replace('/(tabs)/dashboard');
              } else {
                console.log('No user found, redirecting to auth');
                router.replace('/auth');
              }
            });
          }, 1000);
        } else {
          console.log('No auth code found in callback, redirecting to auth screen');
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        router.replace('/auth?error=' + encodeURIComponent('Failed to complete authentication'));
      }
    };

    handleCallback();
  }, [params, router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.title}>Completing sign in...</Text>
      <Text style={styles.subtitle}>Please wait while we finish your authentication</Text>
    </View>
  );
}

