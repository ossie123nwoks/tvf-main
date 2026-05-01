import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  helperText?: string;
}

export default function FormInput({
  label,
  error,
  containerStyle,
  icon,
  rightIcon,
  onRightIconPress,
  helperText,
  style,
  ...props
}: FormInputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.label,
          { ...theme.typography.labelMedium, color: theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.error
              : isFocused
                ? theme.colors.primary
                : theme.colors.border,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
          },
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            {
              ...theme.typography.bodyLarge,
              color: theme.colors.text,
              paddingLeft: icon ? 0 : 16,
              paddingRight: rightIcon ? 0 : 16,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon && (
          <MaterialIcons
            name={rightIcon}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              ...theme.typography.caption,
              color: error ? theme.colors.error : theme.colors.textTertiary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 12,
  },
  leftIcon: {
    paddingHorizontal: 12,
  },
  rightIcon: {
    paddingHorizontal: 12,
  },
  helperText: {
    marginTop: 4,
    paddingLeft: 4,
  },
});
