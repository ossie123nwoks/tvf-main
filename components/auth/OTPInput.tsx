import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
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
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    autoFocus ? 0 : null
  );

  // ─── Animation refs ───
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnims = useRef(
    Array.from({ length }, () => new Animated.Value(1))
  ).current;
  // Staggered entrance: each cell drops in
  const entranceAnims = useRef(
    Array.from({ length }, () => new Animated.Value(0))
  ).current;
  const entranceSlides = useRef(
    Array.from({ length }, () => new Animated.Value(-12))
  ).current;
  // Focus glow (opacity of the glow ring)
  const glowAnim = useRef(new Animated.Value(0)).current;
  // Completion celebration
  const completionScale = useRef(new Animated.Value(1)).current;
  const completionGlow = useRef(new Animated.Value(0)).current;
  // Cursor blink for focused cell
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

  // ─── Auto-focus first input ───
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, length * 60 + 300); // wait for entrance animation
    }
  }, [autoFocus, length]);

  // ─── Cursor blink loop ───
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

  // ─── Focus glow animation ───
  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: focusedIndex !== null ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focusedIndex, glowAnim]);

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

  // ─── Completion celebration ───
  useEffect(() => {
    const filledCount = value.replace(/\s/g, '').length;
    if (filledCount === length && !error) {
      // All digits filled — celebration bounce
      Animated.sequence([
        Animated.parallel([
          Animated.spring(completionScale, {
            toValue: 1.06,
            tension: 300,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(completionGlow, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(completionScale, {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      completionGlow.setValue(0);
      completionScale.setValue(1);
    }
  }, [value, length, error, completionScale, completionGlow]);

  // ─── Pulse animation on digit entry ───
  const animatePulse = useCallback(
    (index: number) => {
      Animated.sequence([
        Animated.spring(pulseAnims[index], {
          toValue: 1.15,
          tension: 400,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnims[index], {
          toValue: 1,
          tension: 200,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [pulseAnims]
  );

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      if (disabled) return;

      // Handle paste (multiple chars)
      if (text.length > 1) {
        const pastedCode = text.replace(/[^0-9]/g, '').slice(0, length);
        onChange(pastedCode);
        const nextIndex = Math.min(pastedCode.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        // Pulse each pasted cell
        pastedCode.split('').forEach((_, i) => animatePulse(i));
        return;
      }

      const digit = text.replace(/[^0-9]/g, '');
      const newValue = digits
        .map((d, i) => (i === index ? digit : d))
        .join('');
      onChange(newValue.replace(/\s/g, ''));

      if (digit && index < length - 1) {
        animatePulse(index);
        inputRefs.current[index + 1]?.focus();
      } else if (digit) {
        // Last digit entered — pulse it
        animatePulse(index);
      }
    },
    [digits, length, onChange, disabled, animatePulse]
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          const newValue = digits
            .map((d, i) => (i === index - 1 ? '' : d))
            .join('');
          onChange(newValue.replace(/\s/g, ''));
          inputRefs.current[index - 1]?.focus();
        } else {
          const newValue = digits
            .map((d, i) => (i === index ? '' : d))
            .join('');
          onChange(newValue.replace(/\s/g, ''));
        }
      }
    },
    [digits, onChange]
  );

  const handleFocus = (index: number) => setFocusedIndex(index);
  const handleBlur = () => setFocusedIndex(null);

  const isComplete = value.replace(/\s/g, '').length === length && !error;

  const getCellStyle = (index: number) => {
    const isFilled = !!digits[index];
    const isFocused = focusedIndex === index;

    let borderColor = theme.colors.border;
    let backgroundColor = theme.colors.surface;

    if (error) {
      borderColor = theme.colors.error;
      backgroundColor = theme.colors.errorContainer;
    } else if (isComplete) {
      borderColor = theme.colors.success;
      backgroundColor = theme.colors.successContainer;
    } else if (isFocused) {
      borderColor = theme.colors.primary;
    } else if (isFilled) {
      borderColor = theme.colors.primaryLight;
    }

    return {
      borderColor,
      backgroundColor,
      borderWidth: isFocused || isComplete ? 2 : 1.5,
    };
  };

  return (
    <View style={styles.container}>
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
          const isFocused = focusedIndex === index;
          const isEmpty = !digits[index];

          return (
            <Animated.View
              key={index}
              style={[
                styles.cellWrapper,
                {
                  opacity: entranceAnims[index],
                  transform: [
                    { translateY: entranceSlides[index] },
                    { scale: pulseAnims[index] },
                  ],
                },
              ]}
            >
              {/* Glow ring behind focused cell */}
              {isFocused && (
                <Animated.View
                  style={[
                    styles.glowRing,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.08],
                      }),
                    },
                  ]}
                />
              )}
              {/* Success glow on completion */}
              {isComplete && (
                <Animated.View
                  style={[
                    styles.glowRing,
                    {
                      backgroundColor: theme.colors.success,
                      opacity: completionGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1],
                      }),
                    },
                  ]}
                />
              )}
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.cell,
                  getCellStyle(index),
                  { color: isComplete ? theme.colors.success : theme.colors.text },
                ]}
                value={digits[index]}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={Platform.OS === 'android' ? 1 : undefined}
                selectTextOnFocus
                editable={!disabled}
                caretHidden={Platform.OS === 'ios'}
                accessibilityLabel={`Digit ${index + 1} of ${length}`}
              />
              {/* Blinking cursor for empty focused cell */}
              {isFocused && isEmpty && (
                <Animated.View
                  style={[
                    styles.cursor,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: cursorAnim,
                    },
                  ]}
                  pointerEvents="none"
                />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Completion indicator */}
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    borderRadius: 1,
    top: 17,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -1,
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
