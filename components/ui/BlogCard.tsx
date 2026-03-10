import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { Article } from '@/types/content';

export type BlogCardVariant = 'default' | 'compact' | 'featured';

interface BlogCardProps {
    article: Article;
    variant?: BlogCardVariant;
    onPress?: () => void;
    onShare?: () => void;
    onSave?: () => void;
    isSaved?: boolean;
}

export default function BlogCard({
    article,
    variant = 'default',
    onPress,
    onShare,
    onSave,
    isSaved = false,
}: BlogCardProps) {
    const { theme } = useTheme();

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const calculateReadingTime = (content: string): number => {
        const wordCount = content.split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / 200));
    };

    const readingTime = calculateReadingTime(article.content);

    // ============ COMPACT VARIANT ============
    if (variant === 'compact') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[
                    compactStyles.container,
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
                <Image
                    source={{ uri: article.thumbnail_url || 'https://via.placeholder.com/120x90' }}
                    style={[
                        compactStyles.thumbnail,
                        { borderTopLeftRadius: theme.borderRadius.md, borderBottomLeftRadius: theme.borderRadius.md },
                    ]}
                    resizeMode="cover"
                />
                <View style={[compactStyles.content, { padding: theme.spacing.sm }]}>
                    <Text
                        style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
                        numberOfLines={2}
                    >
                        {article.title}
                    </Text>
                    <Text
                        style={{
                            ...theme.typography.caption,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xxs,
                        }}
                        numberOfLines={1}
                    >
                        {article.author}
                    </Text>
                    <View style={[compactStyles.metaRow, { marginTop: theme.spacing.xs }]}>
                        <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                            {readingTime} min read • {formatDate(article.published_at)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // ============ DEFAULT & FEATURED VARIANT ============
    const isFeatured = variant === 'featured';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                defaultStyles.container,
                {
                    backgroundColor: theme.colors.cardBackground,
                    borderRadius: theme.borderRadius.lg,
                    borderWidth: isFeatured ? 0 : 1,
                    borderColor: theme.colors.cardBorder,
                    marginBottom: theme.spacing.md,
                    ...(isFeatured ? theme.shadows.large : theme.shadows.medium),
                },
            ]}
        >
            {/* Cover image */}
            <View style={defaultStyles.imageContainer}>
                <Image
                    source={{ uri: article.thumbnail_url || 'https://via.placeholder.com/400x200' }}
                    style={[
                        defaultStyles.image,
                        {
                            borderTopLeftRadius: theme.borderRadius.lg,
                            borderTopRightRadius: theme.borderRadius.lg,
                            height: isFeatured ? 200 : 170,
                        },
                    ]}
                    resizeMode="cover"
                />

                {/* Reading time badge */}
                <View
                    style={[
                        defaultStyles.badge,
                        {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: theme.borderRadius.xs,
                            paddingHorizontal: theme.spacing.sm,
                            paddingVertical: theme.spacing.xxs,
                            bottom: theme.spacing.sm,
                            right: theme.spacing.sm,
                        },
                    ]}
                >
                    <MaterialIcons name="schedule" size={12} color="#FFFFFF" />
                    <Text style={{ ...theme.typography.labelSmall, color: '#FFFFFF', marginLeft: 4 }}>
                        {readingTime} min read
                    </Text>
                </View>

                {/* Featured badge */}
                {article.is_featured && (
                    <View
                        style={[
                            defaultStyles.featuredBadge,
                            {
                                backgroundColor: theme.colors.accent || theme.colors.primary,
                                borderRadius: theme.borderRadius.xs,
                                paddingHorizontal: theme.spacing.sm,
                                paddingVertical: theme.spacing.xxs,
                                top: theme.spacing.sm,
                                left: theme.spacing.sm,
                            },
                        ]}
                    >
                        <MaterialIcons name="star" size={12} color="#FFFFFF" />
                        <Text style={{ ...theme.typography.labelSmall, color: '#FFFFFF', marginLeft: 4 }}>
                            Featured
                        </Text>
                    </View>
                )}
            </View>

            {/* Card body */}
            <View style={{ padding: theme.spacing.md }}>
                {/* Category chip if available */}
                {article.tags && article.tags.length > 0 && (
                    <View style={[defaultStyles.tagRow, { marginBottom: theme.spacing.xs }]}>
                        <View
                            style={{
                                backgroundColor: theme.colors.primaryContainer,
                                borderRadius: theme.borderRadius.xs,
                                paddingHorizontal: theme.spacing.sm,
                                paddingVertical: 2,
                            }}
                        >
                            <Text style={{ ...theme.typography.labelSmall, color: theme.colors.primary }}>
                                {article.tags[0]}
                            </Text>
                        </View>
                    </View>
                )}

                <Text
                    style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
                    numberOfLines={2}
                >
                    {article.title}
                </Text>

                {article.excerpt && (
                    <Text
                        style={{
                            ...theme.typography.bodySmall,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xs,
                        }}
                        numberOfLines={2}
                    >
                        {article.excerpt}
                    </Text>
                )}

                {/* Author & date row */}
                <View style={[defaultStyles.metaRow, { marginTop: theme.spacing.sm }]}>
                    <View style={defaultStyles.authorRow}>
                        <View
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: theme.colors.primaryContainer,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: theme.spacing.xs,
                            }}
                        >
                            <Text
                                style={{
                                    ...theme.typography.labelSmall,
                                    color: theme.colors.primary,
                                    fontSize: 10,
                                }}
                            >
                                {article.author?.charAt(0)?.toUpperCase() || 'A'}
                            </Text>
                        </View>
                        <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary }}>
                            {article.author}
                        </Text>
                    </View>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                        {formatDate(article.published_at)}
                    </Text>
                </View>

                {/* Action bar */}
                {(onShare || onSave) && (
                    <View
                        style={[
                            defaultStyles.actionBar,
                            {
                                marginTop: theme.spacing.sm,
                                paddingTop: theme.spacing.sm,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.borderLight,
                            },
                        ]}
                    >
                        {/* Read more */}
                        <TouchableOpacity
                            onPress={onPress}
                            style={[
                                defaultStyles.readButton,
                                {
                                    backgroundColor: theme.colors.primary,
                                    borderRadius: theme.borderRadius.sm,
                                    paddingHorizontal: theme.spacing.md,
                                    paddingVertical: theme.spacing.xs,
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <Text style={{ ...theme.typography.labelMedium, color: '#FFFFFF' }}>
                                Read Article
                            </Text>
                        </TouchableOpacity>

                        <View style={defaultStyles.iconActions}>
                            {onShare && (
                                <TouchableOpacity onPress={onShare} style={defaultStyles.actionItem} activeOpacity={0.7}>
                                    <MaterialIcons
                                        name="share"
                                        size={theme.iconSizes.md}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                            {onSave && (
                                <TouchableOpacity onPress={onSave} style={defaultStyles.actionItem} activeOpacity={0.7}>
                                    <MaterialIcons
                                        name={isSaved ? 'bookmark' : 'bookmark-border'}
                                        size={theme.iconSizes.md}
                                        color={isSaved ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const defaultStyles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
    },
    badge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredBadge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    readButton: {},
    iconActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionItem: {
        padding: 6,
    },
});

const compactStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    thumbnail: {
        width: 100,
        height: '100%',
        minHeight: 80,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
