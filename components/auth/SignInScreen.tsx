import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { SignInCredentials } from '@/types/user';
import { useRouter } from 'expo-router';
import { ErrorDisplay, InlineError } from './ErrorDisplay';
import { UserFeedback } from './UserFeedback';

interface SignInScreenProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSwitchToSignUp,
  onForgotPassword,
}) => {
  const { theme } = useTheme();
  const { signIn, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<SignInCredentials>>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    card: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    button: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    linkButton: {
      marginTop: theme.spacing.sm,
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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Welcome Back</Text>
          
          <TextInput
            label="Email"
            value={credentials.email}
            onChangeText={(value) => handleInputChange('email', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={!!formErrors.email}
          />
          {formErrors.email && (
            <Text style={styles.errorText}>{formErrors.email}</Text>
          )}

          <TextInput
            label="Password"
            value={credentials.password}
            onChangeText={(value) => handleInputChange('password', value)}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            autoComplete="password"
            error={!!formErrors.password}
          />
          {formErrors.password && (
            <Text style={styles.errorText}>{formErrors.password}</Text>
          )}

          {error && (
            <ErrorDisplay
              error={error}
              onDismiss={() => clearError()}
              compact={true}
            />
          )}

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
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Button
          mode="text"
          onPress={onSwitchToSignUp}
          style={styles.linkButton}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
};
