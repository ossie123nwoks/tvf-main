import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
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

  const getButtonStyle = () => {
    const base: any = {
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
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

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary'
              ? theme.colors.onPrimary
              : theme.colors.primary
          }
        />
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
            <Ionicons
              name={icon}
              size={iconSize}
              color={iconColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
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
});

export default AuthButton;
