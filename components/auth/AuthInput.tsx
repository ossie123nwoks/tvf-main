import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
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

  // Animated values
  const borderAnim = useRef(new Animated.Value(0)).current; // 0 = unfocused, 1 = focused
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconColorAnim = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;

  // Focus/blur animation
  useEffect(() => {
    const toValue = isFocused ? 1 : 0;
    Animated.parallel([
      Animated.spring(borderAnim, {
        toValue,
        tension: 300,
        friction: 15,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(iconColorAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  // Shake on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const animatedBorderColor = error
    ? theme.colors.error
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.border, theme.colors.primary],
      });

  const animatedBorderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2],
  });

  const animatedGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.06],
  });

  const animatedLabelColor = error
    ? theme.colors.error
    : labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.textSecondary, theme.colors.primary],
      });

  const handleEyePress = useCallback(() => {
    // Micro-interaction: quick scale bounce on the eye icon
    Animated.sequence([
      Animated.timing(eyeScale, {
        toValue: 0.7,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(eyeScale, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible, eyeScale]);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: errorShake }] },
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          { color: animatedLabelColor as any },
        ]}
      >
        {label}
      </Animated.Text>
      <View style={styles.inputWrapper}>
        {/* Background glow */}
        <Animated.View
          style={[
            styles.glowLayer,
            {
              backgroundColor: error ? theme.colors.error : theme.colors.primary,
              opacity: error ? 0.04 : (animatedGlowOpacity as any),
              borderRadius: 16,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.inputContainer,
            {
              borderColor: animatedBorderColor as any,
              borderWidth: animatedBorderWidth as any,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {icon && (
            <Animated.View
              style={{
                marginRight: 12,
                opacity: iconColorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              }}
            >
              <Ionicons
                name={icon}
                size={20}
                color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
              />
            </Animated.View>
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
            <Animated.View style={{ transform: [{ scale: eyeScale }] }}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textTertiary}
                style={styles.eyeIcon}
                onPress={handleEyePress}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </Animated.View>
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
  inputWrapper: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 54,
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
