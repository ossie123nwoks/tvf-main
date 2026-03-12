import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  icon,
  compact = false,
}) => {
  const { theme } = useTheme();

  // Entrance animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(10)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.sequence([
      // Icon bounces in
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fades in
      Animated.parallel([
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlide, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-15deg', '8deg', '0deg'],
  });

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon && (
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.colors.primaryContainer,
              transform: [
                { scale: iconScale },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <Ionicons name={icon} size={28} color={theme.colors.primary} />
        </Animated.View>
      )}
      <Animated.Text
        style={[
          styles.title,
          { color: theme.colors.text },
          compact && styles.titleCompact,
          {
            opacity: titleFade,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        {title}
      </Animated.Text>
      {subtitle && (
        <Animated.Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary },
            {
              opacity: subtitleFade,
              transform: [{ translateY: subtitleSlide }],
            },
          ]}
        >
          {subtitle}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  containerCompact: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});

export default AuthHeader;
