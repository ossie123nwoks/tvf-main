import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';

// ============================================================================
// Animated Skeleton Loader — Shimmer effect for modern loading states
// ============================================================================

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Single skeleton bar with shimmer animation
 */
export function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
    const { theme } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const resolvedRadius = borderRadius ?? theme.borderRadius.xs;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const backgroundColor = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.skeleton, theme.colors.skeletonHighlight],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: resolvedRadius,
                    backgroundColor,
                },
                style,
            ]}
        />
    );
}

/**
 * Skeleton card mimicking a SermonCard layout
 */
export function SermonCardSkeleton() {
    const { theme } = useTheme();

    return (
        <View
            style={[
                skeletonStyles.card,
                {
                    backgroundColor: theme.colors.cardBackground,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    marginBottom: theme.spacing.md,
                    ...theme.shadows.small,
                },
            ]}
        >
            {/* Image placeholder */}
            <Skeleton
                width="100%"
                height={180}
                borderRadius={0}
                style={{
                    borderTopLeftRadius: theme.borderRadius.lg,
                    borderTopRightRadius: theme.borderRadius.lg,
                }}
            />

            {/* Content */}
            <View style={{ padding: theme.spacing.md }}>
                <Skeleton width="85%" height={18} style={{ marginBottom: theme.spacing.sm }} />
                <Skeleton width="50%" height={14} style={{ marginBottom: theme.spacing.xs }} />
                <Skeleton width="40%" height={12} style={{ marginBottom: theme.spacing.md }} />

                {/* Action bar skeleton */}
                <View style={[skeletonStyles.actionRow, { paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
                    <View style={{ flex: 1 }} />
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <Skeleton width={20} height={20} borderRadius={10} />
                        <Skeleton width={20} height={20} borderRadius={10} />
                        <Skeleton width={20} height={20} borderRadius={10} />
                    </View>
                </View>
            </View>
        </View>
    );
}

/**
 * Skeleton card mimicking a BlogCard layout
 */
export function BlogCardSkeleton() {
    const { theme } = useTheme();

    return (
        <View
            style={[
                skeletonStyles.card,
                {
                    backgroundColor: theme.colors.cardBackground,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    marginBottom: theme.spacing.md,
                    ...theme.shadows.small,
                },
            ]}
        >
            <Skeleton
                width="100%"
                height={170}
                borderRadius={0}
                style={{
                    borderTopLeftRadius: theme.borderRadius.lg,
                    borderTopRightRadius: theme.borderRadius.lg,
                }}
            />
            <View style={{ padding: theme.spacing.md }}>
                <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: theme.spacing.xs }} />
                <Skeleton width="90%" height={18} style={{ marginBottom: theme.spacing.xs }} />
                <Skeleton width="70%" height={14} style={{ marginBottom: theme.spacing.sm }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Skeleton width={24} height={24} borderRadius={12} />
                    <Skeleton width={80} height={12} />
                    <View style={{ flex: 1 }} />
                    <Skeleton width={60} height={12} />
                </View>
            </View>
        </View>
    );
}

/**
 * Compact skeleton for list views
 */
export function CompactCardSkeleton() {
    const { theme } = useTheme();

    return (
        <View
            style={[
                skeletonStyles.compactCard,
                {
                    backgroundColor: theme.colors.cardBackground,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    marginBottom: theme.spacing.sm,
                    ...theme.shadows.small,
                },
            ]}
        >
            <Skeleton
                width={100}
                height={80}
                borderRadius={0}
                style={{
                    borderTopLeftRadius: theme.borderRadius.md,
                    borderBottomLeftRadius: theme.borderRadius.md,
                }}
            />
            <View style={{ flex: 1, padding: theme.spacing.sm, justifyContent: 'center' }}>
                <Skeleton width="80%" height={14} style={{ marginBottom: theme.spacing.xs }} />
                <Skeleton width="50%" height={12} style={{ marginBottom: theme.spacing.xs }} />
                <Skeleton width="60%" height={10} />
            </View>
        </View>
    );
}

/**
 * Multiple skeleton cards for loading states
 */
export function SkeletonList({
    type = 'sermon',
    count = 3,
}: {
    type?: 'sermon' | 'article' | 'compact';
    count?: number;
}) {
    const cards = Array.from({ length: count });

    return (
        <View>
            {cards.map((_, index) => {
                switch (type) {
                    case 'article':
                        return <BlogCardSkeleton key={index} />;
                    case 'compact':
                        return <CompactCardSkeleton key={index} />;
                    default:
                        return <SermonCardSkeleton key={index} />;
                }
            })}
        </View>
    );
}

const skeletonStyles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    compactCard: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
