import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Image,
  Easing,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const { updateProfile, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const avatarScale = useRef(new Animated.Value(0.3)).current;
  const avatarRotate = useRef(new Animated.Value(0)).current;
  const avatarGlow = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(15)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;

  // Completion celebration
  const completionScale = useRef(new Animated.Value(0)).current;
  const completionOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  // Skip button press
  const skipScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Orchestrated entrance
    Animated.sequence([
      // Phase 1: Content fades in + avatar bounces
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
        Animated.spring(avatarScale, {
          toValue: 1,
          tension: 120,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Form slides in
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Motivation card
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Avatar glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validate = (): boolean => {
    const errs: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const playCompletionAnimation = () => {
    setIsComplete(true);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(completionScale, {
          toValue: 1,
          tension: 150,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(completionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSaveProfile = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if ('code' in result) {
        setErrors({ firstName: result.message });
      } else {
        playCompletionAnimation();
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1500);
      }
    } catch (error) {
      setErrors({
        firstName: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Animated.sequence([
      Animated.timing(skipScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(skipScale, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/(tabs)/dashboard');
    });
  };

  const getInitials = () => {
    const f = firstName.trim()[0] || '';
    const l = lastName.trim()[0] || '';
    return (f + l).toUpperCase() || '?';
  };

  const avatarRotateInterpolate = avatarRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-15deg', '5deg', '0deg'],
  });

  const glowOpacity = avatarGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.2],
  });

  // ─── Completion overlay ───
  if (isComplete) {
    return (
      <View
        style={[
          styles.completionContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Animated.View
          style={[
            styles.completionContent,
            {
              opacity: completionOpacity,
              transform: [{ scale: completionScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.completionCheckContainer,
              {
                backgroundColor: theme.colors.successContainer,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            <Ionicons
              name="person-circle"
              size={64}
              color={theme.colors.success}
            />
          </Animated.View>
          <Text
            style={[styles.completionTitle, { color: theme.colors.text }]}
          >
            You're All Set!
          </Text>
          <Text
            style={[
              styles.completionSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Welcome to TRUEVINE FELLOWSHIP, {firstName.trim()}!
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Skip button */}
          <Pressable
            onPress={handleSkip}
            onPressIn={() => {
              Animated.timing(skipScale, {
                toValue: 0.92,
                duration: 80,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(skipScale, {
                toValue: 1,
                tension: 300,
                friction: 6,
                useNativeDriver: true,
              }).start();
            }}
            style={styles.skipButton}
          >
            <Animated.Text
              style={[
                styles.skipText,
                {
                  color: theme.colors.textSecondary,
                  transform: [{ scale: skipScale }],
                },
              ]}
            >
              Skip for now
            </Animated.Text>
          </Pressable>

          <AuthHeader
            title="Set Up Your Profile"
            subtitle="Tell us a bit about yourself so we can personalize your experience"
            icon="person-outline"
          />

          {/* Avatar Preview with glow */}
          <Animated.View
            style={[
              styles.avatarSection,
              {
                transform: [
                  { scale: avatarScale },
                  { rotate: avatarRotateInterpolate },
                ],
              },
            ]}
          >
            {/* Pulsing glow ring */}
            <Animated.View
              style={[
                styles.avatarGlow,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: glowOpacity,
                },
              ]}
            />
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: theme.colors.primary },
                  ]}
                >
                  {getInitials()}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.avatarHint,
                { color: theme.colors.textTertiary },
              ]}
            >
              Your profile picture
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: formFade,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <AuthInput
              label="First Name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName)
                  setErrors((e) => ({ ...e, firstName: undefined }));
              }}
              placeholder="Your first name"
              icon="person-outline"
              autoCapitalize="words"
              autoComplete="given-name"
              error={errors.firstName}
              returnKeyType="next"
            />

            <AuthInput
              label="Last Name (Optional)"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName)
                  setErrors((e) => ({ ...e, lastName: undefined }));
              }}
              placeholder="Your last name"
              icon="person-outline"
              autoCapitalize="words"
              autoComplete="family-name"
              error={errors.lastName}
              returnKeyType="done"
              onSubmitEditing={handleSaveProfile}
            />

            <View style={styles.buttonContainer}>
              <AuthButton
                title="Complete Setup"
                onPress={handleSaveProfile}
                loading={isLoading}
                disabled={isLoading || !firstName.trim()}
                icon="checkmark-circle-outline"
              />
            </View>
          </Animated.View>

          {/* Motivational card */}
          <Animated.View
            style={[
              styles.motivationCard,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: cardFade,
                transform: [{ translateY: cardSlide }],
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={20}
              color={theme.colors.accent}
            />
            <Text
              style={[
                styles.motivationText,
                { color: theme.colors.textSecondary },
              ]}
            >
              You're all set to explore sermons, connect with your church
              family, and grow in faith!
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -15,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
    gap: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // Completion styles
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionCheckContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  completionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
