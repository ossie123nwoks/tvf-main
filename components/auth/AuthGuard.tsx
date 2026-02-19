import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  fallbackRoute?: string;
  showLoading?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  fallbackRoute = '/auth',
  showLoading = true,
}) => {
  const { user, isAuthenticated, isInitialized, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorText: {
      fontSize: 18,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      marginTop: 16,
    },
  });

  useEffect(() => {
    // Only redirect after authentication is initialized
    if (!isInitialized) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.replace(fallbackRoute);
      return;
    }

    // If email verification is required but user is not verified
    if (requireVerification && user && !user.isEmailVerified) {
      router.replace('/email-verification');
      return;
    }

    // If user is authenticated but trying to access auth page, redirect to dashboard
    if (isAuthenticated && fallbackRoute === '/auth') {
      router.replace('/(tabs)/dashboard');
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    user,
    requireAuth,
    requireVerification,
    fallbackRoute,
    router,
  ]);

  // Show loading while determining authentication state
  if (!isInitialized || loading) {
    if (!showLoading) return null;

    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (!showLoading) return null;

    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Authentication Required</Text>
        <Text style={styles.loadingText}>Please sign in to access this content</Text>
      </View>
    );
  }

  // If email verification is required but user is not verified
  if (requireVerification && user && !user.isEmailVerified) {
    if (!showLoading) return null;

    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Email Verification Required</Text>
        <Text style={styles.loadingText}>Please verify your email address to continue</Text>
      </View>
    );
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
};

// Higher-order component for protecting components
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for conditional rendering based on auth state
export const useAuthGuard = () => {
  const { user, isAuthenticated, isInitialized, loading } = useAuth();

  return {
    isAuthenticated,
    isInitialized,
    loading,
    user,
    canAccess: isAuthenticated && isInitialized && !loading,
    canAccessVerified: isAuthenticated && isInitialized && !loading && user?.isEmailVerified,
  };
};
