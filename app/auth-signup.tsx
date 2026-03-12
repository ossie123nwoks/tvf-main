import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthService } from '@/lib/supabase/auth';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { GoogleSignInOverlay } from '@/components/auth/GoogleSignInOverlay';

export default function SignUpScreen() {
  const { theme } = useTheme();
  const { signInWithGoogle, clearError, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, user]);

  const isEmail = (input: string) => /\S+@\S+\.\S+/.test(input);
  const isPhone = (input: string) => /^\+?[1-9]\d{7,14}$/.test(input.replace(/\s/g, ''));

  const validateInput = (): boolean => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed) {
      setInputError('Please enter your email or phone number');
      return false;
    }
    if (!isEmail(trimmed) && !isPhone(trimmed)) {
      setInputError('Please enter a valid email or phone number');
      return false;
    }
    if (!termsAccepted) {
      setGeneralError('Please accept the Terms of Service to continue');
      return false;
    }
    setInputError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    setGeneralError('');

    const trimmed = emailOrPhone.trim();
    const type = isEmail(trimmed) ? 'email' : 'phone';

    try {
      const result = await AuthService.sendOtp(trimmed, type);
      if (result.success) {
        router.push({
          pathname: '/auth-otp',
          params: {
            emailOrPhone: trimmed,
            type,
            flow: 'signup',
          },
        });
      } else {
        setGeneralError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      setGeneralError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setGoogleLoading(true);
    setGeneralError('');
    try {
      const result = await signInWithGoogle();
      if ('code' in result && result.code && result.code !== 'USER_CANCELLED') {
        setGeneralError(result.message);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <AuthHeader
            title="Create Account"
            subtitle="Join the TRUEVINE FELLOWSHIP community. Enter your email or phone to get started."
            icon="person-add-outline"
          />

          {/* Input */}
          <View style={styles.formContainer}>
            <AuthInput
              label="Email or Phone"
              value={emailOrPhone}
              onChangeText={(text) => {
                setEmailOrPhone(text);
                if (inputError) setInputError('');
                if (generalError) setGeneralError('');
              }}
              placeholder="name@email.com or +1234567890"
              icon="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
              error={inputError}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setTermsAccepted(!termsAccepted);
                if (generalError) setGeneralError('');
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: termsAccepted ? theme.colors.primary : theme.colors.border,
                    backgroundColor: termsAccepted ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
                )}
              </View>
              <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                I agree to the{' '}
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Error message */}
            {generalError ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
                <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
                  {generalError}
                </Text>
              </View>
            ) : null}

            {/* Send OTP Button */}
            <AuthButton
              title="Continue"
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={isLoading || !emailOrPhone.trim()}
              icon="arrow-forward"
              iconPosition="right"
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>
                or sign up with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Google Sign-In */}
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={isLoading}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/auth-signin')} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                {' '}Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <GoogleSignInOverlay visible={googleLoading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  backButton: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
