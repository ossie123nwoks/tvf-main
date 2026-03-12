import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnims = useRef(
    Array.from({ length }, () => new Animated.Value(1))
  ).current;

  // Split value into individual digits
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [autoFocus]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  // Pulse animation when digit is entered
  const animatePulse = useCallback(
    (index: number) => {
      Animated.sequence([
        Animated.timing(pulseAnims[index], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnims[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [pulseAnims]
  );

  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      if (disabled) return;

      // Handle paste (multiple characters)
      if (text.length > 1) {
        const pastedCode = text.replace(/[^0-9]/g, '').slice(0, length);
        onChange(pastedCode);
        // Focus last filled position or last input
        const nextIndex = Math.min(pastedCode.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      // Handle single character
      const digit = text.replace(/[^0-9]/g, '');
      const newValue = digits.map((d, i) => (i === index ? digit : d)).join('');
      onChange(newValue.replace(/\s/g, ''));

      if (digit && index < length - 1) {
        animatePulse(index);
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange, disabled, animatePulse]
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          // If current cell is empty, go back and clear previous
          const newValue = digits
            .map((d, i) => (i === index - 1 ? '' : d))
            .join('');
          onChange(newValue.replace(/\s/g, ''));
          inputRefs.current[index - 1]?.focus();
        } else {
          // Clear current cell
          const newValue = digits
            .map((d, i) => (i === index ? '' : d))
            .join('');
          onChange(newValue.replace(/\s/g, ''));
        }
      }
    },
    [digits, onChange]
  );

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const getCellStyle = (index: number) => {
    const isFilled = !!digits[index];
    const isFocused = focusedIndex === index;

    let borderColor = theme.colors.border;
    let backgroundColor = theme.colors.surface;

    if (error) {
      borderColor = theme.colors.error;
      backgroundColor = theme.colors.errorContainer;
    } else if (isFocused) {
      borderColor = theme.colors.primary;
    } else if (isFilled) {
      borderColor = theme.colors.primary;
    }

    return {
      borderColor,
      backgroundColor,
      borderWidth: isFocused ? 2 : 1.5,
    };
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputRow,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {Array.from({ length }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.cellContainer,
              { transform: [{ scale: pulseAnims[index] }] },
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.cell,
                getCellStyle(index),
                { color: theme.colors.text },
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
          </Animated.View>
        ))}
      </Animated.View>
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
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
  cellContainer: {
    width: 50,
    height: 58,
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
  errorText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default OTPInput;
