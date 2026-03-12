import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AuthService } from '@/lib/supabase/auth';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { OTPInput } from '@/components/auth/OTPInput';
import { AuthButton } from '@/components/auth/AuthButton';
import type { AuthFlowType } from '@/types/user';

const RESEND_COOLDOWN = 60; // seconds

export default function OTPScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    emailOrPhone: string;
    type: 'email' | 'phone';
    flow: AuthFlowType;
  }>();

  const emailOrPhone = params.emailOrPhone || '';
  const type = (params.type as 'email' | 'phone') || 'email';
  const flow = (params.flow as AuthFlowType) || 'signin';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [isSuccess, setIsSuccess] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && !isVerifying && !isSuccess) {
      handleVerifyOtp();
    }
  }, [otpCode]);

  const playSuccessAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [successScale, successOpacity]);

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await AuthService.verifyOtpCode(emailOrPhone, otpCode, type);

      if ('code' in result) {
        // Error
        setError(result.message);
        setOtpCode('');
        setIsVerifying(false);
      } else {
        // Success
        setIsSuccess(true);
        playSuccessAnimation();

        // Navigate after animation
        setTimeout(() => {
          if (flow === 'signup') {
            router.replace({
              pathname: '/auth-profile-setup',
              params: { emailOrPhone, type },
            });
          } else {
            router.replace('/(tabs)/dashboard');
          }
        }, 1500);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtpCode('');
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const result = await AuthService.sendOtp(emailOrPhone, type);
      if (result.success) {
        setResendCooldown(RESEND_COOLDOWN);
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedContact = () => {
    if (type === 'email') {
      const [name, domain] = emailOrPhone.split('@');
      if (!name || !domain) return emailOrPhone;
      const masked = name.slice(0, 2) + '***';
      return `${masked}@${domain}`;
    }
    // Phone: show last 4 digits
    return '•••••' + emailOrPhone.slice(-4);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs}s`;
  };

  // Success overlay
  if (isSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: theme.colors.background }]}>
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <View
            style={[
              styles.successIconContainer,
              { backgroundColor: theme.colors.successContainer },
            ]}
          >
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Verified!
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
            {flow === 'signup'
              ? 'Account created. Let\'s set up your profile!'
              : 'Welcome back! Redirecting...'}
          </Text>
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.successSpinner}
          />
        </Animated.View>
      </View>
    );
  }

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
            title="Verify Your Identity"
            subtitle={`We sent a 6-digit code to ${maskedContact()}`}
            icon="shield-checkmark-outline"
          />

          {/* OTP Sent confirmation */}
          <View style={[styles.sentBanner, { backgroundColor: theme.colors.successContainer }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={[styles.sentBannerText, { color: theme.colors.success }]}>
              Code sent to {type === 'email' ? 'your email' : 'your phone'}
            </Text>
          </View>

          {/* OTP Input */}
          <OTPInput
            length={6}
            value={otpCode}
            onChange={(code) => {
              setOtpCode(code);
              if (error) setError('');
            }}
            error={error}
            disabled={isVerifying}
            autoFocus
          />

          {/* Verify Button */}
          <View style={styles.buttonContainer}>
            <AuthButton
              title="Verify Code"
              onPress={handleVerifyOtp}
              loading={isVerifying}
              disabled={otpCode.length !== 6 || isVerifying}
              icon="checkmark-circle-outline"
            />
          </View>

          {/* Resend section */}
          <View style={styles.resendContainer}>
            {resendCooldown > 0 ? (
              <View style={styles.resendTimerRow}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textTertiary} />
                <Text style={[styles.resendTimerText, { color: theme.colors.textTertiary }]}>
                  Resend code in {formatTime(resendCooldown)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={isResending}
                activeOpacity={0.7}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <View style={styles.resendRow}>
                    <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                    <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                      Resend Code
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Help text */}
          <View style={[styles.helpContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
              Can't find the code? Check your spam folder or try resending.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
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
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  sentBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendTimerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    padding: 8,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  // Success overlay styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  successSpinner: {
    marginTop: 24,
  },
});
