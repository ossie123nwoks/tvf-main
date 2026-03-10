import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface FilterOption<T = string> {
    key: T;
    label: string;
    icon?: string;
}

interface FilterModalProps<T extends string = string> {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: FilterOption<T>[];
    selectedValue: T;
    onSelect: (value: T) => void;
}

export default function FilterModal<T extends string = string>({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
}: FilterModalProps<T>) {
    const { theme } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={[
                        styles.content,
                        {
                            backgroundColor: theme.colors.cardBackground,
                            borderRadius: theme.borderRadius.lg,
                            ...theme.shadows.large,
                        },
                    ]}
                >
                    {/* Header */}
                    <View
                        style={[
                            styles.header,
                            {
                                paddingHorizontal: theme.spacing.lg,
                                paddingVertical: theme.spacing.md,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.borderLight,
                            },
                        ]}
                    >
                        <Text style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={theme.iconSizes.lg} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={{ padding: theme.spacing.sm }}>
                        {options.map((option) => {
                            const isSelected = selectedValue === option.key;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor: isSelected
                                                ? theme.colors.primaryContainer
                                                : 'transparent',
                                            borderRadius: theme.borderRadius.md,
                                            padding: theme.spacing.md,
                                            marginBottom: theme.spacing.xxs,
                                        },
                                    ]}
                                    onPress={() => {
                                        onSelect(option.key);
                                        onClose();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionContent}>
                                        {option.icon && (
                                            <MaterialIcons
                                                name={option.icon as any}
                                                size={theme.iconSizes.md}
                                                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                                style={{ marginRight: theme.spacing.sm }}
                                            />
                                        )}
                                        <Text
                                            style={{
                                                ...theme.typography.bodyLarge,
                                                color: isSelected ? theme.colors.primary : theme.colors.text,
                                                fontWeight: isSelected ? '600' : '400',
                                                flex: 1,
                                            }}
                                        >
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <MaterialIcons
                                                name="check-circle"
                                                size={theme.iconSizes.md}
                                                color={theme.colors.primary}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        padding: 4,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
});
