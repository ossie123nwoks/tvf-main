import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EmailVerificationRequest, EmailVerificationConfirm } from '@/types/user';
import { ErrorDisplay, InlineError } from '@/components/auth/ErrorDisplay';
import { UserFeedback } from '@/components/auth/UserFeedback';
import { AuthService } from '@/lib/supabase/auth';

type VerificationMode = 'request' | 'confirm';

export default function EmailVerification() {
  const { theme } = useTheme();
  const { user, requestEmailVerification, loading, error, clearError, refreshUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Determine mode from URL params or default to request
  const [mode, setMode] = useState<VerificationMode>(params.token ? 'confirm' : 'request');

  // Request mode state
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

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
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 24,
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
    infoCard: {
      backgroundColor: theme.colors.info,
      marginBottom: theme.spacing.md,
    },
    infoText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 14,
    },
    footer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.textSecondary,
    },
    stepsContainer: {
      marginBottom: theme.spacing.lg,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    stepNumberText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    stepText: {
      color: theme.colors.text,
      fontSize: 14,
      flex: 1,
    },
  });

  // Auto-verify if token is present
  useEffect(() => {
    if (params.token && !isVerifying && !isSuccess) {
      handleAutoVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  // Check if user becomes verified (e.g., from another tab/device)
  useEffect(() => {
    if (user?.isEmailVerified && !isSuccess) {
      setIsSuccess(true);
      setSuccessMessage('Email verified successfully! You can now access all features of the app.');
    }
  }, [user?.isEmailVerified]);

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

  const handleRequestVerification = async () => {
    if (!validateEmail()) return;

    clearError();
    setVerificationError(null);
    const result = await requestEmailVerification({ email: email.trim() });

    if (result.success) {
      setIsSuccess(true);
      setSuccessMessage(
        'Verification email sent! Please check your inbox and click the verification link.'
      );
    } else {
      setVerificationError(result.error || 'Failed to send verification email');
    }
  };

  const handleAutoVerification = async () => {
    setIsVerifying(true);
    clearError();
    setVerificationError(null);

    try {
      // Supabase processes email verification tokens automatically when the deep link
      // is handled. The token in the URL params is processed by Supabase's auth system.
      // We need to refresh the user session to check if verification succeeded.
      
      // Wait a moment for Supabase to process the token
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh user data to get latest verification status
      await refreshUser();
      
      // Check again after refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get current user to check verification status
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser?.isEmailVerified) {
        setIsVerifying(false);
        setIsSuccess(true);
        setSuccessMessage('Email verified successfully! You can now access all features of the app.');
      } else {
        // If still not verified, try to verify with the token
        const token = params.token as string;
        if (token) {
          const verifyResult = await AuthService.verifyEmail(token);
          if (verifyResult.success) {
            await refreshUser();
            setIsVerifying(false);
            setIsSuccess(true);
            setSuccessMessage('Email verified successfully! You can now access all features of the app.');
          } else {
            setIsVerifying(false);
            setVerificationError(verifyResult.error || 'Email verification failed. Please try requesting a new verification email.');
          }
        } else {
          setIsVerifying(false);
          setVerificationError('Verification token not found. Please request a new verification email.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setIsVerifying(false);
      setVerificationError('An error occurred during verification. Please try again.');
    }
  };

  const handleBackToSignIn = () => {
    router.replace('/auth');
  };

  const handleBackToDashboard = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleInputChange = (value: string) => {
    if (emailError) setEmailError('');
    setEmail(value);
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRUEVINE FELLOWSHIP</Text>
          <Text style={styles.headerSubtitle}>Email Verification</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.successCard}>
            <Card.Content>
              <Text style={styles.successText}>{successMessage}</Text>
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={handleBackToDashboard} style={styles.button}>
            Continue to Dashboard
          </Button>

          <Button mode="outlined" onPress={handleBackToSignIn} style={styles.button}>
            Back to Sign In
          </Button>
        </View>
      </View>
    );
  }

  if (isVerifying) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TRUEVINE FELLOWSHIP</Text>
          <Text style={styles.headerSubtitle}>Verifying Email</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Verifying Your Email</Text>
              <Text style={styles.description}>
                Please wait while we verify your email address...
              </Text>
            </Card.Content>
          </Card>
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
            {mode === 'request' ? 'Verify Your Email' : 'Email Verification'}
          </Text>
        </View>

        <View style={styles.content}>
          {mode === 'request' ? (
            /* Request Email Verification */
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.title}>Email Verification Required</Text>
                <Text style={styles.description}>
                  To access all features of the TRUEVINE FELLOWSHIP Church app, please verify your
                  email address.
                </Text>

                <View style={styles.stepsContainer}>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Enter your email address below</Text>
                  </View>

                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Check your inbox for verification email</Text>
                  </View>

                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Click the verification link in the email</Text>
                  </View>
                </View>

                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={handleInputChange}
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
                {verificationError && (
                  <ErrorDisplay error={verificationError} onDismiss={() => setVerificationError(null)} compact={true} />
                )}

                <Button
                  mode="contained"
                  onPress={handleRequestVerification}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Send Verification Email
                </Button>
              </Card.Content>
            </Card>
          ) : (
            /* Confirm Email Verification */
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.title}>Verifying Your Email</Text>
                <Text style={styles.description}>
                  We're processing your email verification. This may take a moment.
                </Text>
                {verificationError && (
                  <ErrorDisplay error={verificationError} onDismiss={() => setVerificationError(null)} compact={true} />
                )}
                <Button
                  mode="outlined"
                  onPress={handleRequestVerification}
                  disabled={loading || isVerifying}
                  style={styles.button}
                >
                  Resend Verification Email
                </Button>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoText}>
                Having trouble? Check your spam folder or contact support for assistance.
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already verified? </Text>
            <Button mode="text" onPress={handleBackToSignIn} style={styles.button}>
              Sign In
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
