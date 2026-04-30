import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RESEND_COOLDOWN = 60;
const NUM_PARTICLES = 12;

// ─── Particle burst for success celebration ───
function SuccessParticles({
  visible,
  color,
}: {
  visible: boolean;
  color: string;
}) {
  const particles = useRef(
    Array.from({ length: NUM_PARTICLES }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2,
      distance: 50 + Math.random() * 80,
      size: 4 + Math.random() * 6,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    const animations = particles.map((p) => {
      const endX = Math.cos(p.angle) * p.distance;
      const endY = Math.sin(p.angle) * p.distance;
      return Animated.parallel([
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.scale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(p.translateX, {
          toValue: endX,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(p.translateY, {
          toValue: endY,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.stagger(30, animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={particleStyles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            particleStyles.dot,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: i % 3 === 0 ? color : i % 3 === 1 ? '#FFD700' : '#64DFDF',
              opacity: p.opacity,
              transform: [
                { translateX: p.translateX },
                { translateY: p.translateY },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const particleStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});

// ─── Progress dots (step indicator) — simple, no animations ───
const ProgressDots = React.memo(function ProgressDots({
  total,
  filled,
  theme,
}: {
  total: number;
  filled: number;
  theme: any;
}) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            {
              backgroundColor:
                i < filled ? theme.colors.primary : theme.colors.border,
              transform: [{ scale: i < filled ? 1.2 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );
});

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// ──────────────────────────────────────────────
// MAIN OTP SCREEN
// ──────────────────────────────────────────────
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
  const bannerSlide = useRef(new Animated.Value(-20)).current;
  const bannerFade = useRef(new Animated.Value(0)).current;

  // Success celebration
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successIconRotate = useRef(new Animated.Value(0)).current;
  const successRingScale = useRef(new Animated.Value(0.5)).current;
  const successRingOpacity = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const [showParticles, setShowParticles] = useState(false);

  // Verifying spinner
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Sent banner slides in after a delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerSlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(bannerFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
  }, []);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Stable OTP change handler — memoized to prevent OTPInput re-renders
  const handleOtpChange = useCallback((code: string) => {
    setOtpCode(code);
    if (error) setError('');
  }, [error]);

  // Ref to prevent double-submit (avoids disabling the input which kills keyboard)
  const isSubmittingRef = useRef(false);
  // Debounce timer ref to prevent keyboard race conditions
  const autoVerifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-verify when 6 digits entered (debounced to avoid keyboard flicker)
  useEffect(() => {
    if (autoVerifyTimer.current) {
      clearTimeout(autoVerifyTimer.current);
      autoVerifyTimer.current = null;
    }
    if (otpCode.length === 6 && !isSubmittingRef.current && !isSuccess) {
      autoVerifyTimer.current = setTimeout(() => {
        handleVerifyOtp();
      }, 300);
    }
    return () => {
      if (autoVerifyTimer.current) {
        clearTimeout(autoVerifyTimer.current);
      }
    };
  }, [otpCode, isSuccess]);

  // Spin animation for verifying state
  useEffect(() => {
    if (isVerifying) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isVerifying]);

  const playSuccessAnimation = useCallback(() => {
    setShowParticles(true);

    Animated.sequence([
      // Ring expands first
      Animated.parallel([
        Animated.spring(successRingScale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(successRingOpacity, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Then icon pops in
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 150,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successIconRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Ring fades
      Animated.timing(successRingOpacity, {
        toValue: 0.05,
        duration: 400,
        useNativeDriver: true,
      }),
      // Progress bar
      Animated.timing(progressValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    // Batch state updates: only set verifying, don't clear error separately
    // to minimize re-renders that could dismiss the keyboard
    setIsVerifying(true);
    setError('');

    try {
      const result = await AuthService.verifyOtpCode(
        emailOrPhone,
        otpCode,
        type
      );

      if ('code' in result) {
        setError(result.message);
        // Don't clear otpCode — let user see what they typed and re-enter
        setIsVerifying(false);
        isSubmittingRef.current = false;
      } else {
        // Set success first, then stop verifying in a single batch
        setIsSuccess(true);
        setIsVerifying(false);
        isSubmittingRef.current = false;
        playSuccessAnimation();

        setTimeout(() => {
          if (flow === 'signup') {
            router.replace({
              pathname: '/auth-profile-setup',
              params: { emailOrPhone, type },
            });
          } else {
            router.replace('/(tabs)/dashboard');
          }
        }, 2200);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsVerifying(false);
      isSubmittingRef.current = false;
    }
  }, [otpCode, emailOrPhone, type, flow, playSuccessAnimation, router]);

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
      return `${name.slice(0, 2)}***@${domain}`;
    }
    return '•••••' + emailOrPhone.slice(-4);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs}s`;
  };

  const iconRotateInterpolate = successIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ─── SUCCESS CELEBRATION SCREEN ───
  if (isSuccess) {
    return (
      <View
        style={[
          styles.successContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Expanding ring */}
        <Animated.View
          style={[
            styles.successRing,
            {
              borderColor: theme.colors.success,
              opacity: successRingOpacity,
              transform: [{ scale: successRingScale }],
            },
          ]}
        />

        {/* Particle burst */}
        <SuccessParticles visible={showParticles} color={theme.colors.success} />

        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                backgroundColor: theme.colors.successContainer,
                transform: [{ rotate: iconRotateInterpolate }],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={theme.colors.success}
            />
          </Animated.View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Verified!
          </Text>
          <Text
            style={[
              styles.successSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {flow === 'signup'
              ? "Account created. Let's set up your profile!"
              : 'Welcome back! Redirecting...'}
          </Text>

          {/* Animated progress bar */}
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.colors.success,
                  width: progressWidth as any,
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  // ─── MAIN OTP ENTRY SCREEN ───
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

          {/* Progress dots */}
          <ProgressDots
            total={6}
            filled={otpCode.replace(/\s/g, '').length}
            theme={theme}
          />

          {/* Sent confirmation banner */}
          <Animated.View
            style={[
              styles.sentBanner,
              {
                backgroundColor: theme.colors.successContainer,
                opacity: bannerFade,
                transform: [{ translateY: bannerSlide }],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={theme.colors.success}
            />
            <Text
              style={[styles.sentBannerText, { color: theme.colors.success }]}
            >
              Code sent to{' '}
              {type === 'email' ? 'your email' : 'your phone'}
            </Text>
          </Animated.View>

          {/* OTP Input */}
          <OTPInput
            length={6}
            value={otpCode}
            onChange={handleOtpChange}
            error={error}
            disabled={false}
            autoFocus
          />

          {/* Verifying indicator */}
          {isVerifying && (
            <View style={styles.verifyingRow}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons
                  name="sync"
                  size={18}
                  color={theme.colors.primary}
                />
              </Animated.View>
              <Text
                style={[
                  styles.verifyingText,
                  { color: theme.colors.primary },
                ]}
              >
                Verifying your code...
              </Text>
            </View>
          )}

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
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.resendTimerText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Resend code in{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {formatTime(resendCooldown)}
                  </Text>
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                onPress={handleResendOtp}
                disabled={isResending}
                activeOpacity={0.7}
              >
                {isResending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <View style={styles.resendRow}>
                    <Ionicons
                      name="refresh"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.resendText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Resend Code
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Help section */}
          <View
            style={[
              styles.helpContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.helpText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Can't find the code? Check your spam folder or try resending.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  backButton: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  content: { flex: 1, paddingHorizontal: 24 },
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  sentBannerText: { fontSize: 13, fontWeight: '600' },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifyingText: { fontSize: 14, fontWeight: '600' },
  buttonContainer: { marginTop: 8 },
  resendContainer: { alignItems: 'center', marginTop: 24 },
  resendTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendTimerText: { fontSize: 14, fontWeight: '500' },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: { fontSize: 15, fontWeight: '600' },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  helpText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // ─── Success styles ───
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
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
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  progressBarBg: {
    width: SCREEN_WIDTH * 0.5,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
