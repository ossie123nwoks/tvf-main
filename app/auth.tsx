import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthButton } from '@/components/auth/AuthButton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const { width, height } = Dimensions.get('window');

export default function AuthWelcome() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Redirect if already authenticated
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Decorative top section */}
        <View style={[styles.heroSection, { backgroundColor: theme.colors.primary }]}>
          <View style={[styles.heroOverlay, { backgroundColor: theme.colors.primaryDark }]} />
          
          {/* Decorative circles */}
          <View style={[styles.decorCircle1, { backgroundColor: theme.colors.primaryLight, opacity: 0.15 }]} />
          <View style={[styles.decorCircle2, { backgroundColor: theme.colors.accent, opacity: 0.08 }]} />

          {/* Logo / Branding */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="heart" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.churchName}>TRUEVINE</Text>
            <Text style={styles.churchSubname}>FELLOWSHIP</Text>
          </Animated.View>
        </View>

        {/* Content Section */}
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
            <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
              Welcome Home
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
              Connect with your church family, access sermons, and grow in faith — all in one place.
            </Text>
          </Animated.View>

          {/* Feature highlights */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                opacity: buttonFade,
                transform: [{ translateY: buttonSlide }],
              },
            ]}
          >
            <View style={styles.featureRow}>
              <FeatureChip icon="musical-notes" label="Sermons" theme={theme} />
              <FeatureChip icon="book" label="Articles" theme={theme} />
              <FeatureChip icon="people" label="Community" theme={theme} />
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
            <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
              By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </View>
    </ErrorBoundary>
  );
}

// Feature chip component
function FeatureChip({
  icon,
  label,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: any;
}) {
  return (
    <View style={[chipStyles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={[chipStyles.text, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
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
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
    right: -60,
  },
  decorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -30,
    left: -50,
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 1,
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
    letterSpacing: 4,
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
  textContainer: {
    alignItems: 'center',
  },
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
  buttonsContainer: {
    gap: 0,
  },
  buttonSpacer: {
    height: 12,
  },
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
