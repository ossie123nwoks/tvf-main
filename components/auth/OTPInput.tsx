import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = true,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  const digits = value
    .split('')
    .concat(Array(length).fill(''))
    .slice(0, length);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Cursor blink
  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blinkLoop.start();
    return () => blinkLoop.stop();
  }, [cursorAnim]);

  // Shake on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleChange = useCallback(
    (text: string) => {
      if (disabled) return;
      const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
      onChange(cleaned);
    },
    [disabled, length, onChange]
  );

  const isComplete = value.replace(/\s/g, '').length === length && !error;
  const activeIndex = value.length < length ? value.length : length - 1;

  const getCellBorder = (index: number) => {
    const isFilled = !!digits[index];
    const isCellActive = isFocused && index === activeIndex;

    if (error) return { borderColor: theme.colors.error, borderWidth: 2 };
    if (isComplete) return { borderColor: theme.colors.success, borderWidth: 2 };
    if (isCellActive) return { borderColor: theme.colors.primary, borderWidth: 2 };
    if (isFilled) return { borderColor: theme.colors.primaryLight, borderWidth: 1.5 };
    return { borderColor: theme.colors.border, borderWidth: 1.5 };
  };

  const getCellBg = (index: number) => {
    if (error) return theme.colors.errorContainer;
    if (isComplete) return theme.colors.successContainer;
    return theme.colors.surface;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wrapper,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Visual cells */}
        <View style={styles.inputRow}>
          {Array.from({ length }).map((_, index) => {
            const isCellActive = isFocused && index === activeIndex;
            const isEmpty = !digits[index];

            return (
              <View
                key={index}
                style={[
                  styles.cell,
                  { backgroundColor: getCellBg(index) },
                  getCellBorder(index),
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    {
                      color: isComplete
                        ? theme.colors.success
                        : error
                        ? theme.colors.error
                        : theme.colors.text,
                    },
                  ]}
                >
                  {digits[index]}
                </Text>

                {/* Blinking cursor */}
                {isCellActive && isEmpty && (
                  <Animated.View
                    style={[
                      styles.cursor,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: cursorAnim,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Real TextInput overlaying the cells — transparent but tappable */}
        <TextInput
          ref={inputRef}
          style={styles.overlayInput}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="number-pad"
          maxLength={length}
          editable={!disabled}
          autoFocus={false}
          caretHidden
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          importantForAutofill="yes"
        />
      </Animated.View>

      {/* Status */}
      {isComplete && (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={[styles.statusText, { color: theme.colors.success }]}>
            Code entered
          </Text>
        </View>
      )}

      {error ? (
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <Text style={[styles.statusText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  wrapper: {
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cell: {
    width: 50,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 1,
    color: 'transparent',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OTPInput;
