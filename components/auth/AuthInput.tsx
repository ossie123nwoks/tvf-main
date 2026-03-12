import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInput['props']['keyboardType'];
  autoCapitalize?: RNTextInput['props']['autoCapitalize'];
  autoComplete?: RNTextInput['props']['autoComplete'];
  error?: string;
  editable?: boolean;
  maxLength?: number;
  returnKeyType?: RNTextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<RNTextInput>;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  error,
  editable = true,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
          },
          isFocused && {
            borderWidth: 2,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
            style={styles.icon}
          />
        )}
        <RNTextInput
          ref={inputRef as any}
          style={[
            styles.input,
            { color: theme.colors.text },
            !editable && { opacity: 0.6 },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.textTertiary}
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          />
        )}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AuthInput;
