import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { SignInCredentials } from '@/types/user';
import { useRouter } from 'expo-router';
import { ErrorDisplay, InlineError } from './ErrorDisplay';
import { UserFeedback } from './UserFeedback';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleSignInOverlay } from './GoogleSignInOverlay';

interface SignInScreenProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSwitchToSignUp,
  onForgotPassword,
}) => {
  const { theme } = useTheme();
  const { signIn, signInWithGoogle, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<SignInCredentials>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    input: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    button: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    linkButton: {
      marginTop: theme.spacing.sm,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border || '#E0E0E0',
    },
    dividerText: {
      marginHorizontal: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    footer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.textSecondary,
    },
  });

  const validateForm = (): boolean => {
    const errors: Partial<SignInCredentials> = {};

    if (!credentials.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    clearError();
    await signIn(credentials);
  };

  const handleInputChange = (field: keyof SignInCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Google Sign-In button pressed');
    clearError();
    setGoogleLoading(true);
    try {
      console.log('Calling signInWithGoogle...');
      const result = await signInWithGoogle();
      console.log('Sign in with Google result:', result);
      
      // If there's an error, check if it's a cancellation (which is expected behavior)
      if ('code' in result && result.code) {
        // Don't show error for user cancellation - this is expected behavior
        if (result.code === 'USER_CANCELLED') {
          console.log('Google sign-in was cancelled by user');
          // Silently handle cancellation - no error message needed
        } else {
          // Only log/show error for actual errors, not cancellations
          console.error('Google sign in error:', result.message);
        }
      }
    } catch (error) {
      console.error('Error in handleGoogleSignIn:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        label="Email"
        value={credentials.email}
        onChangeText={value => handleInputChange('email', value)}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={!!formErrors.email}
      />
      {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

      <TextInput
        label="Password"
        value={credentials.password}
        onChangeText={value => handleInputChange('password', value)}
        style={styles.input}
        mode="outlined"
        secureTextEntry
        autoComplete="password"
        error={!!formErrors.password}
      />
      {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}

      {error && <ErrorDisplay error={error} onDismiss={() => clearError()} compact={true} />}

      <Button
        mode="contained"
        onPress={handleSignIn}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Sign In
      </Button>

      <Button
        mode="text"
        onPress={() => router.push('/password-reset')}
        style={styles.linkButton}
      >
        Forgot Password?
      </Button>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign-In Button */}
      <GoogleSignInButton
        onPress={handleGoogleSignIn}
        loading={googleLoading}
        disabled={loading}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Button mode="text" onPress={onSwitchToSignUp} style={styles.linkButton}>
          Sign Up
        </Button>
      </View>

      {/* Google Sign-In Overlay */}
      <GoogleSignInOverlay visible={googleLoading} />
    </View>
  );
};
