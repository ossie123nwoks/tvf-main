import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthGuard } from './AuthGuard';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface ContentGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  fallbackMessage?: string;
  showSignInButton?: boolean;
  showVerificationButton?: boolean;
}

export const ContentGuard: React.FC<ContentGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  fallbackMessage,
  showSignInButton = true,
  showVerificationButton = true,
}) => {
  const { canAccess, canAccessVerified, loading } = useAuthGuard();
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      alignItems: 'center',
      maxWidth: 400,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
      lineHeight: 24,
    },
    button: {
      marginTop: theme.spacing.sm,
      minWidth: 200,
    },
  });

  // Show loading while determining authentication state
  if (loading) {
    return null;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !canAccess) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>Authentication Required</Text>
          <Text style={styles.message}>
            {fallbackMessage || 'Please sign in to access this content'}
          </Text>
          {showSignInButton && (
            <Button mode="contained" onPress={() => router.push('/auth')} style={styles.button}>
              Sign In
            </Button>
          )}
        </Card>
      </View>
    );
  }

  // If email verification is required but user is not verified
  if (requireVerification && !canAccessVerified) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>Email Verification Required</Text>
          <Text style={styles.message}>
            Please verify your email address to access this content
          </Text>
          {showVerificationButton && (
            <Button
              mode="contained"
              onPress={() => router.push('/auth?mode=verify')}
              style={styles.button}
            >
              Verify Email
            </Button>
          )}
        </Card>
      </View>
    );
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
};

// Hook for conditional content rendering
export const useContentGuard = () => {
  const { canAccess, canAccessVerified, loading } = useAuthGuard();

  return {
    canAccess,
    canAccessVerified,
    loading,
    showContent: canAccess && !loading,
    showVerifiedContent: canAccessVerified && !loading,
  };
};

// Higher-order component for protecting content
export const withContentGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ContentGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ContentGuard {...options}>
      <Component {...props} />
    </ContentGuard>
  );

  WrappedComponent.displayName = `withContentGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
