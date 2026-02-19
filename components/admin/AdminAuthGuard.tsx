import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminRole } from '@/types/admin';
import { hasPermission } from '@/lib/admin/rolePermissions';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: AdminRole;
  fallbackMessage?: string;
  showSignInButton?: boolean;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackMessage,
  showSignInButton = true,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    card: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
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
    roleInfo: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.sm,
      width: '100%',
    },
    roleText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  // Show loading while checking authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <MaterialIcons
            name="lock"
            size={60}
            color={theme.colors.error}
            style={styles.icon}
          />
          <Text style={styles.title}>Authentication Required</Text>
          <Text style={styles.message}>
            {fallbackMessage || 'Please sign in to access the admin dashboard'}
          </Text>
          {showSignInButton && (
            <Button
              mode="contained"
              onPress={() => router.push('/auth')}
              style={styles.button}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              Sign In
            </Button>
          )}
        </Card>
      </View>
    );
  }

  // Check if user has admin role
  if (!user.role || !['admin', 'moderator'].includes(user.role)) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <MaterialIcons
            name="admin-panel-settings"
            size={60}
            color={theme.colors.error}
            style={styles.icon}
          />
          <Text style={styles.title}>Access Denied</Text>
          <Text style={styles.message}>
            You don't have administrative privileges to access this section.
          </Text>
          <View style={styles.roleInfo}>
            <Text style={styles.roleText}>
              Current role: {user.role || 'None'}
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
          >
            Go Back
          </Button>
        </Card>
      </View>
    );
  }

  // Check specific role requirement
  if (requiredRole) {
    // Map 'admin' role to 'super_admin' for compatibility
    const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
    if (mappedRole !== requiredRole) {
      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <MaterialIcons
              name="shield"
              size={60}
              color={theme.colors.error}
              style={styles.icon}
            />
            <Text style={styles.title}>Insufficient Permissions</Text>
            <Text style={styles.message}>
              This section requires {requiredRole} role or higher.
            </Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleText}>
                Current role: {user.role}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card>
        </View>
      );
    }
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    // Map 'admin' role to 'super_admin' for compatibility
    const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(mappedRole as AdminRole, permission)
    );

    if (!hasAllPermissions) {
      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <MaterialIcons
              name="security"
              size={60}
              color={theme.colors.error}
              style={styles.icon}
            />
            <Text style={styles.title}>Permission Denied</Text>
            <Text style={styles.message}>
              You don't have the required permissions to access this feature.
            </Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleText}>
                Required permissions: {requiredPermissions.join(', ')}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card>
        </View>
      );
    }
  }

  // User has access, render children
  return <>{children}</>;
};

// Higher-order component for protecting admin components
export const withAdminAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AdminAuthGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AdminAuthGuard {...options}>
      <Component {...props} />
    </AdminAuthGuard>
  );

  WrappedComponent.displayName = `withAdminAuthGuard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for checking admin permissions
export const useAdminAuth = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    // Map 'admin' role to 'super_admin' for compatibility
    const mappedRole = user.role === 'admin' ? 'super_admin' : user.role;
    return hasPermission(mappedRole as AdminRole, permission);
  };

  const checkRole = (role: AdminRole): boolean => {
    return user?.role === role;
  };

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    checkPermission,
    checkRole,
    hasAdminAccess: isAuthenticated && user?.role && ['admin', 'moderator'].includes(user.role),
  };
};
