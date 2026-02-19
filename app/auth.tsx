import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme as usePaperTheme, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'expo-router';
import { SignInScreen } from '@/components/auth/SignInScreen';
import { SignUpScreen } from '@/components/auth/SignUpScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const { theme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Redirect based on authentication and verification status
  useEffect(() => {
    if (isAuthenticated && user) {
      // If email is not verified, redirect to verification screen
      if (!user.isEmailVerified) {
        router.replace('/email-verification');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // Don't render auth screen if already authenticated and verified
  if (isAuthenticated && user && user.isEmailVerified) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingTop: theme.spacing.xl * 3, // More top padding like reference
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 120, // Ensure consistent header height
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xl * 3, // More top padding to center content better
      justifyContent: 'center', // Center content vertically
    },
    modeToggle: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
    modeButton: {
      flex: 1,
      borderRadius: theme.spacing.sm,
    },
    modeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    modeButtonInactive: {
      backgroundColor: 'transparent',
    },
    modeButtonText: {
      color: theme.colors.primary,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    footer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    termsText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  const handleSwitchToSignUp = () => {
    setAuthMode('signup');
  };

  const handleSwitchToSignIn = () => {
    setAuthMode('signin');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    console.log('Forgot password pressed');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Mode Toggle */}
        <View style={styles.content}>
          <View style={styles.modeToggle}>
            <Button
              mode={authMode === 'signin' ? 'contained' : 'text'}
              onPress={handleSwitchToSignIn}
              style={[
                styles.modeButton,
                authMode === 'signin' ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
              labelStyle={
                authMode === 'signin' ? styles.modeButtonTextActive : styles.modeButtonText
              }
            >
              Sign In
            </Button>
            <Button
              mode={authMode === 'signup' ? 'contained' : 'text'}
              onPress={handleSwitchToSignUp}
              style={[
                styles.modeButton,
                authMode === 'signup' ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
              labelStyle={
                authMode === 'signup' ? styles.modeButtonTextActive : styles.modeButtonText
              }
            >
              Sign Up
            </Button>
          </View>

          {/* Auth Forms */}
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            {authMode === 'signin' ? (
              <SignInScreen
                onSwitchToSignUp={handleSwitchToSignUp}
                onForgotPassword={handleForgotPassword}
              />
            ) : (
              <SignUpScreen onSwitchToSignIn={handleSwitchToSignIn} />
            )}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Welcome to TRUEVINE FELLOWSHIP Church</Text>
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy. Your account will
            be created and you'll have access to all church content, sermons, articles, and
            personalized features.
          </Text>
        </View>
      </View>
    </ErrorBoundary>
  );
}
