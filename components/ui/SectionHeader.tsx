import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionIcon?: string;
    onAction?: () => void;
    showDivider?: boolean;
}

export default function SectionHeader({
    title,
    subtitle,
    actionLabel,
    actionIcon = 'arrow-forward',
    onAction,
    showDivider = false,
}: SectionHeaderProps) {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { marginBottom: theme.spacing.md }]}>
            {showDivider && (
                <View style={[styles.divider, { backgroundColor: theme.colors.border, marginBottom: theme.spacing.md }]} />
            )}
            <View style={styles.row}>
                <View style={styles.textContainer}>
                    <Text
                        style={[
                            {
                                ...theme.typography.headlineSmall,
                                color: theme.colors.text,
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            style={{
                                ...theme.typography.bodySmall,
                                color: theme.colors.textSecondary,
                                marginTop: theme.spacing.xxs,
                            }}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
                {onAction && (
                    <TouchableOpacity
                        onPress={onAction}
                        style={[
                            styles.actionButton,
                            {
                                backgroundColor: theme.colors.surfaceVariant,
                                borderRadius: theme.borderRadius.sm,
                                paddingHorizontal: theme.spacing.sm,
                                paddingVertical: theme.spacing.xs,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        {actionLabel ? (
                            <View style={styles.actionContent}>
                                <Text
                                    style={{
                                        ...theme.typography.labelMedium,
                                        color: theme.colors.primary,
                                        marginRight: theme.spacing.xxs,
                                    }}
                                >
                                    {actionLabel}
                                </Text>
                                <MaterialIcons
                                    name={actionIcon as any}
                                    size={theme.iconSizes.sm}
                                    color={theme.colors.primary}
                                />
                            </View>
                        ) : (
                            <MaterialIcons
                                name={actionIcon as any}
                                size={theme.iconSizes.md}
                                color={theme.colors.primary}
                            />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
    },
});
