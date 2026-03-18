import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export default function ActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
}: ActionButtonProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          border: 'transparent',
          text: theme.colors.onPrimary,
        };
      case 'secondary':
        return {
          bg: theme.colors.primaryContainer,
          border: 'transparent',
          text: theme.colors.primary,
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: theme.colors.border,
          text: theme.colors.text,
        };
      case 'danger':
        return {
          bg: theme.colors.error,
          border: 'transparent',
          text: '#FFFFFF',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          text: theme.colors.primary,
        };
      default:
        return {
          bg: theme.colors.primary,
          border: 'transparent',
          text: theme.colors.onPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingV: theme.spacing.sm,
          paddingH: theme.spacing.md,
          font: theme.typography.labelMedium,
          iconSize: 16,
        };
      case 'large':
        return {
          paddingV: theme.spacing.md + 2,
          paddingH: theme.spacing.xl,
          font: theme.typography.titleMedium,
          iconSize: 22,
        };
      case 'medium':
      default:
        return {
          paddingV: theme.spacing.md,
          paddingH: theme.spacing.lg,
          font: theme.typography.labelLarge,
          iconSize: 18,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const opacity = disabled || loading ? 0.6 : 1;

  const renderIcon = () => {
    if (!icon || loading) return null;
    return (
      <MaterialIcons
        name={icon}
        size={sizeStyles.iconSize}
        color={variantStyles.text}
        style={{
          marginLeft: iconPosition === 'right' ? theme.spacing.sm : 0,
          marginRight: iconPosition === 'left' ? theme.spacing.sm : 0,
        }}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: theme.borderRadius.md,
          paddingVertical: sizeStyles.paddingV,
          paddingHorizontal: sizeStyles.paddingH,
          opacity,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {iconPosition === 'left' && renderIcon()}

        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyles.text}
            style={{ marginRight: theme.spacing.sm }}
          />
        ) : null}

        <Text
          style={[sizeStyles.font, { color: variantStyles.text, textAlign: 'center' }, labelStyle]}
        >
          {label}
        </Text>

        {iconPosition === 'right' && renderIcon()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
