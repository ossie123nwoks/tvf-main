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
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
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
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const avatarScale = useRef(new Animated.Value(0.5)).current;

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
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = (): boolean => {
    const errs: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    // lastName is optional
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
        // Error
        setErrors({ firstName: result.message });
      } else {
        // Success -> go to dashboard
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      setErrors({ firstName: 'Failed to save profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  const getInitials = () => {
    const f = firstName.trim()[0] || '';
    const l = lastName.trim()[0] || '';
    return (f + l).toUpperCase() || '?';
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
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>

          <AuthHeader
            title="Set Up Your Profile"
            subtitle="Tell us a bit about yourself so we can personalize your experience"
            icon="person-outline"
          />

          {/* Avatar Preview */}
          <Animated.View
            style={[
              styles.avatarSection,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
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
                <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>
                  {getInitials()}
                </Text>
              )}
            </View>
            <Text style={[styles.avatarHint, { color: theme.colors.textTertiary }]}>
              Your profile picture
            </Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.formContainer}>
            <AuthInput
              label="First Name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
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
                if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
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
          </View>

          {/* Motivational text */}
          <View style={[styles.motivationCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
            <Text style={[styles.motivationText, { color: theme.colors.textSecondary }]}>
              You're all set to explore sermons, connect with your church family, and grow in faith!
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
});
