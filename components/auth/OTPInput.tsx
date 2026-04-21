import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  Pressable,
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
  const hiddenInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // ─── Animations ───
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const entranceAnims = useRef(
    Array.from({ length }, () => new Animated.Value(0))
  ).current;
  const entranceSlides = useRef(
    Array.from({ length }, () => new Animated.Value(-12))
  ).current;
  const completionScale = useRef(new Animated.Value(1)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  const digits = value
    .split('')
    .concat(Array(length).fill(''))
    .slice(0, length);

  // ─── Staggered entrance animation ───
  useEffect(() => {
    const animations = entranceAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 250,
          delay: i * 60,
          useNativeDriver: true,
        }),
        Animated.timing(entranceSlides[i], {
          toValue: 0,
          duration: 250,
          delay: i * 60,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(0, animations).start();
  }, []);

  // ─── Auto-focus hidden input ───
  useEffect(() => {
    if (autoFocus && hiddenInputRef.current) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, length * 60 + 300);
    }
  }, [autoFocus, length]);

  // ─── Cursor blink ───
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

  // ─── Shake on error ───
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 12,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -12,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 4,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

  // ─── Completion bounce ───
  useEffect(() => {
    const filledCount = value.replace(/\s/g, '').length;
    if (filledCount === length && !error) {
      Animated.sequence([
        Animated.spring(completionScale, {
          toValue: 1.04,
          tension: 300,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(completionScale, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      completionScale.setValue(1);
    }
  }, [value, length, error, completionScale]);

  // ─── Handle text change from hidden input ───
  const handleChange = useCallback(
    (text: string) => {
      if (disabled) return;
      const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
      onChange(cleaned);
    },
    [disabled, length, onChange]
  );

  // ─── Focus hidden input when cells tapped ───
  const handlePress = () => {
    if (!disabled) {
      hiddenInputRef.current?.focus();
    }
  };

  const isComplete = value.replace(/\s/g, '').length === length && !error;
  const activeIndex = value.length < length ? value.length : length - 1;

  const getCellStyle = (index: number) => {
    const isFilled = !!digits[index];
    const isCellFocused = isFocused && index === activeIndex;

    let borderColor = theme.colors.border;
    let backgroundColor = theme.colors.surface;

    if (error) {
      borderColor = theme.colors.error;
      backgroundColor = theme.colors.errorContainer;
    } else if (isComplete) {
      borderColor = theme.colors.success;
      backgroundColor = theme.colors.successContainer;
    } else if (isCellFocused) {
      borderColor = theme.colors.primary;
      backgroundColor = theme.colors.surface;
    } else if (isFilled) {
      borderColor = theme.colors.primaryLight;
    }

    return {
      borderColor,
      backgroundColor,
      borderWidth: isCellFocused || isComplete ? 2 : 1.5,
    };
  };

  return (
    <View style={styles.container}>
      {/* Hidden input that captures all keyboard input */}
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
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
      />

      {/* Visual cells */}
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.inputRow,
            {
              transform: [
                { translateX: shakeAnim },
                { scale: completionScale },
              ],
            },
          ]}
        >
          {Array.from({ length }).map((_, index) => {
            const isCellFocused = isFocused && index === activeIndex;
            const isEmpty = !digits[index];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.cellWrapper,
                  {
                    opacity: entranceAnims[index],
                    transform: [{ translateY: entranceSlides[index] }],
                  },
                ]}
              >
                {/* Focus glow */}
                {isCellFocused && (
                  <View
                    style={[
                      styles.glowRing,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity: 0.08,
                      },
                    ]}
                  />
                )}
                {/* Completion glow */}
                {isComplete && (
                  <View
                    style={[
                      styles.glowRing,
                      {
                        backgroundColor: theme.colors.success,
                        opacity: 0.1,
                      },
                    ]}
                  />
                )}

                <View style={[styles.cell, getCellStyle(index)]}>
                  <Text
                    style={[
                      styles.cellText,
                      {
                        color: isComplete
                          ? theme.colors.success
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {digits[index]}
                  </Text>

                  {/* Blinking cursor for focused empty cell */}
                  {isCellFocused && isEmpty && (
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
              </Animated.View>
            );
          })}
        </Animated.View>
      </Pressable>

      {/* Status indicators */}
      {isComplete && (
        <View style={styles.completeRow}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={theme.colors.success}
          />
          <Text style={[styles.completeText, { color: theme.colors.success }]}>
            Code entered
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle"
            size={16}
            color={theme.colors.error}
          />
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
    alignItems: 'center',
    marginVertical: 24,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cellWrapper: {
    width: 50,
    height: 58,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
  },
  cell: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default OTPInput;
