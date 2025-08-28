import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { SignUpCredentials } from '@/types/user';
import { useRouter } from 'expo-router';
import { ErrorDisplay, InlineError } from './ErrorDisplay';
import { UserFeedback } from './UserFeedback';

interface SignUpScreenProps {
  onSwitchToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSwitchToSignIn }) => {
  const { theme } = useTheme();
  const { signUp, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  }>({});

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
    row: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    rowInput: {
      flex: 1,
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
    footer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.textSecondary,
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    termsText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
  });

  const validateForm = (): boolean => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      acceptTerms?: string;
    } = {};

    if (!credentials.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!credentials.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (credentials.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!credentials.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    clearError();
    const result = await signUp(credentials);

    if (!('code' in result)) {
      // Success case - redirect to email verification
      router.push('/email-verification');
    }
  };

  const handleInputChange = (field: keyof SignUpCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (formErrors.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.row}>
            <TextInput
              label="First Name"
              value={credentials.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              style={styles.rowInput}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="given-name"
              error={!!formErrors.firstName}
            />
            <TextInput
              label="Last Name"
              value={credentials.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              style={styles.rowInput}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="family-name"
              error={!!formErrors.lastName}
            />
          </View>
          {formErrors.firstName && <Text style={styles.errorText}>{formErrors.firstName}</Text>}
          {formErrors.lastName && <Text style={styles.errorText}>{formErrors.lastName}</Text>}

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
            autoComplete="new-password"
            error={!!formErrors.password}
          />
          {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            style={styles.input}
            mode="outlined"
            secureTextEntry
            autoComplete="new-password"
            error={!!formErrors.confirmPassword}
          />
          {formErrors.confirmPassword && (
            <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
          )}

          <View style={styles.termsRow}>
            <Checkbox
              status={credentials.acceptTerms ? 'checked' : 'unchecked'}
              onPress={() => handleInputChange('acceptTerms', !credentials.acceptTerms)}
              color={theme.colors.primary}
            />
            <Text style={styles.termsText}>I agree to the Terms of Service and Privacy Policy</Text>
          </View>
          {formErrors.acceptTerms && <Text style={styles.errorText}>{formErrors.acceptTerms}</Text>}

          {error && <ErrorDisplay error={error} onDismiss={() => clearError()} compact={true} />}

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Button mode="text" onPress={onSwitchToSignIn} style={styles.button}>
          Sign In
        </Button>
      </View>
    </View>
  );
};
