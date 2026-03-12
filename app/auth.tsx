import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthButton } from '@/components/auth/AuthButton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const { width, height } = Dimensions.get('window');

// ─── Animated floating circle (decorative element) ───
function FloatingCircle({
  size,
  color,
  top,
  left,
  delay,
  duration,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      delay,
      useNativeDriver: true,
    }).start();

    // Floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -12,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top,
        left,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// ─── Animated feature chip ───
function FeatureChip({
  icon,
  label,
  theme,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: any;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable
      onPressIn={() => {
        Animated.spring(pressScale, {
          toValue: 0.9,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressScale, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Animated.View
        style={[
          chipStyles.container,
          {
            backgroundColor: theme.colors.surfaceVariant,
            transform: [{ scale: Animated.multiply(scale, pressScale) }],
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
        <Text style={[chipStyles.text, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});

// ──────────────────────────────────────────────
// MAIN WELCOME SCREEN
// ──────────────────────────────────────────────
export default function AuthWelcome() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Core entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;

  // Logo glow pulse
  const logoGlow = useRef(new Animated.Value(0.1)).current;
  // Church name letter spacing animation
  const nameSpacing = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Orchestrated entrance
    Animated.sequence([
      // Phase 1: Logo appears with spring + rotation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Content slides up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(nameSpacing, {
          toValue: 4,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Logo glow pulse (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 0.25,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlow, {
          toValue: 0.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.isEmailVerified) {
        router.replace('/email-verification');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user && user.isEmailVerified) {
    return null;
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-10deg', '5deg', '0deg'],
  });

  return (
    <ErrorBoundary>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* ─── Hero Section ─── */}
        <View
          style={[
            styles.heroSection,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <View
            style={[
              styles.heroOverlay,
              { backgroundColor: theme.colors.primaryDark },
            ]}
          />

          {/* Floating decorative circles */}
          <FloatingCircle
            size={180}
            color={`${theme.colors.primaryLight}22`}
            top={-40}
            left={width - 100}
            delay={200}
            duration={3500}
          />
          <FloatingCircle
            size={140}
            color={`${theme.colors.accent}14`}
            top={height * 0.22}
            left={-50}
            delay={600}
            duration={4000}
          />
          <FloatingCircle
            size={60}
            color="rgba(255,255,255,0.08)"
            top={30}
            left={40}
            delay={800}
            duration={2800}
          />
          <FloatingCircle
            size={40}
            color="rgba(255,255,255,0.06)"
            top={height * 0.15}
            left={width * 0.65}
            delay={1000}
            duration={3200}
          />

          {/* Logo / Branding */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotateInterpolate },
                ],
              },
            ]}
          >
            {/* Pulsing glow behind logo */}
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  backgroundColor: '#FFFFFF',
                  opacity: logoGlow,
                },
              ]}
            />
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Ionicons name="heart" size={44} color="#FFFFFF" />
            </View>
            <Animated.Text
              style={[
                styles.churchName,
                { letterSpacing: nameSpacing as any },
              ]}
            >
              TRUEVINE
            </Animated.Text>
            <Text style={styles.churchSubname}>FELLOWSHIP</Text>
          </Animated.View>
        </View>

        {/* ─── Content Section ─── */}
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text
              style={[styles.welcomeTitle, { color: theme.colors.text }]}
            >
              Welcome Home
            </Text>
            <Text
              style={[
                styles.welcomeSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Connect with your church family, access sermons, and grow in
              faith — all in one place.
            </Text>
          </Animated.View>

          {/* Feature highlights with staggered entrance */}
          <Animated.View
            style={[styles.featuresContainer, { opacity: buttonFade }]}
          >
            <View style={styles.featureRow}>
              <FeatureChip
                icon="musical-notes"
                label="Sermons"
                theme={theme}
                delay={700}
              />
              <FeatureChip
                icon="book"
                label="Articles"
                theme={theme}
                delay={800}
              />
              <FeatureChip
                icon="people"
                label="Community"
                theme={theme}
                delay={900}
              />
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: buttonFade,
                transform: [{ translateY: buttonSlide }],
              },
            ]}
          >
            <AuthButton
              title="Sign In"
              onPress={() => router.push('/auth-signin')}
              variant="primary"
              icon="log-in-outline"
            />
            <View style={styles.buttonSpacer} />
            <AuthButton
              title="Create Account"
              onPress={() => router.push('/auth-signup')}
              variant="outline"
              icon="person-add-outline"
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: buttonFade }]}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.textTertiary },
              ]}
            >
              By continuing, you agree to our Terms of Service
              {'\n'}and Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 15 },
  heroSection: {
    height: height * 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -16,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  churchName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  churchSubname: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 6,
    marginTop: 4,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  textContainer: { alignItems: 'center' },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
  },
  featuresContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonsContainer: { gap: 0 },
  buttonSpacer: { height: 12 },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
