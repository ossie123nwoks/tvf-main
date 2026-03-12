import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  size = 'large',
}) => {
  const { theme } = useTheme();

  // Press animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;
  const iconSlideAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.965,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, elevationAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, elevationAnim]);

  // Micro-interaction: slide icon on press
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    // Quick icon nudge animation
    if (icon && iconPosition === 'right') {
      Animated.sequence([
        Animated.timing(iconSlideAnim, {
          toValue: 4,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(iconSlideAnim, {
          toValue: 0,
          tension: 300,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress();
  }, [onPress, disabled, loading, icon, iconPosition, iconSlideAnim]);

  const getButtonStyle = () => {
    const base: any = {
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      overflow: 'hidden' as const,
    };

    switch (size) {
      case 'small':
        base.paddingVertical = 10;
        base.paddingHorizontal = 20;
        break;
      case 'medium':
        base.paddingVertical = 14;
        base.paddingHorizontal = 24;
        break;
      case 'large':
      default:
        base.paddingVertical = 17;
        base.paddingHorizontal = 32;
        break;
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = theme.colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = theme.colors.primaryContainer;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = theme.colors.border;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = () => {
    const base: any = {
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    };

    switch (size) {
      case 'small':
        base.fontSize = 14;
        break;
      case 'medium':
        base.fontSize = 15;
        break;
      case 'large':
      default:
        base.fontSize = 16;
        break;
    }

    switch (variant) {
      case 'primary':
        base.color = theme.colors.onPrimary;
        break;
      case 'secondary':
        base.color = theme.colors.primary;
        break;
      case 'outline':
      case 'ghost':
        base.color = theme.colors.primary;
        break;
    }

    return base;
  };

  const iconColor =
    variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary;
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 18 : 20;

  // Shadow interpolation for depth effect on press
  const shadowOpacity = elevationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [variant === 'primary' ? 0.15 : 0.05, 0.05],
  });
  const shadowTranslateY = elevationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 1],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleAnim },
            { translateY: shadowTranslateY },
          ],
          opacity: scaleAnim, // subtle opacity shift on press
        },
        variant === 'primary' && {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: shadowOpacity as unknown as number,
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
    >
      <Pressable
        style={getButtonStyle()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        android_ripple={
          variant === 'primary'
            ? { color: 'rgba(255,255,255,0.2)', borderless: false }
            : { color: theme.colors.ripple, borderless: false }
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={
                variant === 'primary'
                  ? theme.colors.onPrimary
                  : theme.colors.primary
              }
            />
            <Text style={[getTextStyle(), styles.loadingText]}>
              Please wait...
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={iconSize}
                color={iconColor}
                style={styles.iconLeft}
              />
            )}
            <Text style={getTextStyle()}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Animated.View
                style={{ transform: [{ translateX: iconSlideAnim }] }}
              >
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={iconColor}
                  style={styles.iconRight}
                />
              </Animated.View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    marginLeft: 4,
  },
});

export default AuthButton;
