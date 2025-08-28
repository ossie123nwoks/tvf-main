import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
  showLogo?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  logoSize?: number;
  titleSize?: number;
  subtitleSize?: number;
}

export default function SplashScreen({
  onAnimationComplete,
  duration = 3000,
  showLogo = true,
  showTitle = true,
  showSubtitle = true,
  logoSize = 120,
  titleSize = 32,
  subtitleSize = 18,
}: SplashScreenProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    logoIcon: {
      marginBottom: theme.spacing.lg,
    },
    logoCircle: {
      width: logoSize,
      height: logoSize,
      borderRadius: logoSize / 2,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.large,
    },
    logoInner: {
      width: logoSize * 0.6,
      height: logoSize * 0.6,
      borderRadius: (logoSize * 0.6) / 2,
      backgroundColor: theme.colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    logoText: {
      fontSize: logoSize * 0.2,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    title: {
      fontSize: titleSize,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: subtitleSize,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: 16,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      fontStyle: 'italic',
      maxWidth: screenWidth * 0.8,
      lineHeight: 24,
    },
    loadingContainer: {
      marginTop: theme.spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    loadingDots: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    version: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
  });

  useEffect(() => {
    const startAnimation = () => {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);

      // Create animation sequence
      const animationSequence = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);

      // Start animation
      animationSequence.start();

      // Schedule completion callback
      const timer = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    };

    startAnimation();
  }, [duration, onAnimationComplete]);

  const renderLoadingDots = () => {
    return (
      <View style={styles.loadingDots}>
        {[0, 1, 2].map(index => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: scaleAnim,
              },
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        {showLogo && (
          <View style={styles.logo}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInner}>
                <MaterialIcons
                  name="church"
                  size={logoSize * 0.3}
                  color={theme.colors.primary}
                  style={styles.logoIcon}
                />
                <Text style={styles.logoText}>T</Text>
              </View>
            </View>
          </View>
        )}

        {showTitle && (
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 20],
                    }),
                  },
                ],
              },
            ]}
          >
            TRUEVINE
          </Animated.Text>
        )}

        {showSubtitle && (
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 15],
                    }),
                  },
                ],
              },
            ]}
          >
            Fellowship Church
          </Animated.Text>
        )}

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              }),
            },
          ]}
        >
          "Building lives on the foundation of God's Word"
        </Animated.Text>

        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1],
              }),
            },
          ]}
        >
          <Text style={styles.loadingText}>Preparing your experience...</Text>
          {renderLoadingDots()}
        </Animated.View>
      </Animated.View>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}
