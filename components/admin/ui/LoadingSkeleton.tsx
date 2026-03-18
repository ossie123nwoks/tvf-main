import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { theme } = useTheme();

  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.5, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          backgroundColor: theme.colors.skeleton,
          borderRadius: borderRadius || theme.borderRadius.sm,
          overflow: 'hidden',
        },
        style,
        animatedStyle,
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.skeletonHighlight, opacity: 0.3 },
        ]}
      />
    </Animated.View>
  );
}

// Pre-configured skeleton layouts

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Skeleton width="30%" height={24} />
        <Skeleton width="20%" height={24} />
      </View>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={12} />
          </View>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      ))}
    </View>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            minWidth: 280,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Skeleton width={48} height={48} borderRadius={12} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={14} />
            </View>
          </View>
          <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height={12} />
        </View>
      ))}
    </View>
  );
}
