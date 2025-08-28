import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PasswordResetRequest, PasswordResetConfirm } from '@/types/user';
import { ErrorDisplay, InlineError } from '@/components/auth/ErrorDisplay';
import { UserFeedback } from '@/components/auth/UserFeedback';

type ResetMode = 'request' | 'confirm';

export default function PasswordReset() {
  const { theme } = useTheme();
  const { requestPasswordReset, confirmPasswordReset, loading, error, clearError } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Determine mode from URL params or default to request
  const [mode, setMode] = useState<ResetMode>(params.token ? 'confirm' : 'request');

  // Request mode state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Confirm mode state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 20,
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
    successCard: {
      backgroundColor: theme.colors.success,
      marginBottom: theme.spacing.md,
    },
    successText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
    },
    footer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.textSecondary,
    },
  });

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (): boolean => {
    let isValid = true;

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleRequestReset = async () => {
    if (!validateEmail()) return;

    clearError();
    const result = await requestPasswordReset({ email: email.trim() });

    if (result.success) {
      setIsSuccess(true);
      setSuccessMessage(
        'Password reset email sent! Please check your inbox and follow the instructions.'
      );
    }
  };

  const handleConfirmReset = async () => {
    if (!validatePassword()) return;

    const token = params.token as string;
    if (!token) {
      setPasswordError('Reset token is missing. Please request a new password reset.');
      return;
    }

    clearError();
    const result = await confirmPasswordReset({
      token,
      newPassword: password,
    });

    if ('code' in result) {
      // Error case
      setPasswordError(result.message);
    } else {
      // Success case
      setIsSuccess(true);
      setSuccessMessage('Password successfully reset! You can now sign in with your new password.');
    }
  };

  const handleBackToSignIn = () => {
    router.replace('/auth');
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear field errors when user starts typing
    if (field === 'email' && emailError) setEmailError('');
    if (field === 'password' && passwordError) setPasswordError('');
    if (field === 'confirmPassword' && confirmPasswordError) setConfirmPasswordError('');

    // Update state
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRUEVINE FELLOWSHIP</Text>
          <Text style={styles.headerSubtitle}>Password Reset</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.successCard}>
            <Card.Content>
              <Text style={styles.successText}>{successMessage}</Text>
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={handleBackToSignIn} style={styles.button}>
            Back to Sign In
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRUEVINE FELLOWSHIP</Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'request' ? 'Reset Your Password' : 'Set New Password'}
          </Text>
        </View>

        <View style={styles.content}>
          {mode === 'request' ? (
            /* Request Password Reset */
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.title}>Forgot Your Password?</Text>
                <Text
                  style={[
                    styles.footerText,
                    { marginBottom: theme.spacing.lg, textAlign: 'center' },
                  ]}
                >
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={value => handleInputChange('email', value)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                />
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

                {error && (
                  <ErrorDisplay error={error} onDismiss={() => clearError()} compact={true} />
                )}

                <Button
                  mode="contained"
                  onPress={handleRequestReset}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Send Reset Email
                </Button>
              </Card.Content>
            </Card>
          ) : (
            /* Confirm Password Reset */
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.title}>Set New Password</Text>
                <Text
                  style={[
                    styles.footerText,
                    { marginBottom: theme.spacing.lg, textAlign: 'center' },
                  ]}
                >
                  Enter your new password below.
                </Text>

                <TextInput
                  label="New Password"
                  value={password}
                  onChangeText={value => handleInputChange('password', value)}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  autoComplete="new-password"
                  error={!!passwordError}
                />
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                <TextInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={value => handleInputChange('confirmPassword', value)}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  autoComplete="new-password"
                  error={!!confirmPasswordError}
                />
                {confirmPasswordError && (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}

                {error && (
                  <ErrorDisplay error={error} onDismiss={() => clearError()} compact={true} />
                )}

                <Button
                  mode="contained"
                  onPress={handleConfirmReset}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Reset Password
                </Button>
              </Card.Content>
            </Card>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Button mode="text" onPress={handleBackToSignIn} style={styles.button}>
              Sign In
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
