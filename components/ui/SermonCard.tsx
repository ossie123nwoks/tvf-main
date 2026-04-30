import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { Sermon } from '@/types/content';

export type SermonCardVariant = 'default' | 'compact' | 'featured' | 'grid';
export type DownloadStatus = 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error';

interface SermonCardProps {
    sermon: Sermon;
    variant?: SermonCardVariant;
    onPress?: () => void;
    onPlay?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onSave?: () => void;
    isSaved?: boolean;
    downloadStatus?: DownloadStatus;
    showActions?: boolean;
}

export default function SermonCard({
    sermon,
    variant = 'default',
    onPress,
    onPlay,
    onDownload,
    onShare,
    onSave,
    isSaved = false,
    downloadStatus = 'idle',
    showActions = true,
}: SermonCardProps) {
    const { theme } = useTheme();

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} min`;
    };

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

    const getDownloadIcon = (): string => {
        switch (downloadStatus) {
            case 'downloaded': return 'check-circle';
            case 'error': return 'error-outline';
            default: return 'download';
        }
    };

    const getDownloadColor = (): string => {
        switch (downloadStatus) {
            case 'downloaded': return theme.colors.success;
            case 'error': return theme.colors.error;
            default: return theme.colors.textSecondary;
        }
    };

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
                {/* Thumbnail */}
                <Image
                    source={{ uri: sermon.thumbnail_url || 'https://via.placeholder.com/120x90' }}
                    style={[
                        compactStyles.thumbnail,
                        { borderTopLeftRadius: theme.borderRadius.md, borderBottomLeftRadius: theme.borderRadius.md },
                    ]}
                    resizeMode="cover"
                />

                {/* Content */}
                <View style={[compactStyles.content, { padding: theme.spacing.sm }]}>
                    <Text
                        style={{ ...theme.typography.titleSmall, color: theme.colors.text }}
                        numberOfLines={2}
                    >
                        {sermon.title}
                    </Text>
                    <Text
                        style={{
                            ...theme.typography.caption,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing.xxs,
                        }}
                        numberOfLines={1}
                    >
                        {sermon.preacher}
                    </Text>
                    <View style={[compactStyles.metaRow, { marginTop: theme.spacing.xs }]}>
                        <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                            {formatDuration(sermon.duration)} • {formatDate(sermon.date)}
                        </Text>
                        {onPlay && (
                            <TouchableOpacity onPress={onPlay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <MaterialIcons
                                    name="play-circle-filled"
                                    size={theme.iconSizes.lg}
                                    color={theme.colors.primary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // ============ GRID VARIANT ============
    if (variant === 'grid') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[
                    gridStyles.container,
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
                {/* Thumbnail */}
                <View style={gridStyles.imageContainer}>
                    <Image
                        source={{ uri: sermon.thumbnail_url || 'https://via.placeholder.com/200x120' }}
                        style={[
                            gridStyles.image,
                            {
                                borderTopLeftRadius: theme.borderRadius.md,
                                borderTopRightRadius: theme.borderRadius.md,
                            },
                        ]}
                        resizeMode="cover"
                    />

                    {/* Duration badge */}
                    <View
                        style={[
                            gridStyles.durationBadge,
                            {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: theme.borderRadius.xs,
                                paddingHorizontal: theme.spacing.xs,
                                paddingVertical: 2,
                            },
                        ]}
                    >
                        <Text style={{ ...theme.typography.labelSmall, color: '#FFFFFF', fontSize: 10 }}>
                            {formatDuration(sermon.duration)}
                        </Text>
                    </View>

                    {/* Play button */}
                    {onPlay && (
                        <TouchableOpacity
                            onPress={onPlay}
                            style={[
                                gridStyles.playOverlay,
                                {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: theme.borderRadius.full,
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="play-arrow" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Card body */}
                <View style={{ padding: theme.spacing.sm }}>
                    <Text
                        style={{ ...theme.typography.titleSmall, color: theme.colors.text, fontSize: 13 }}
                        numberOfLines={2}
                    >
                        {sermon.title}
                    </Text>

                    <Text
                        style={{
                            ...theme.typography.caption,
                            color: theme.colors.primary,
                            marginTop: theme.spacing.xxs,
                            fontSize: 11,
                        }}
                        numberOfLines={1}
                    >
                        {sermon.preacher}
                    </Text>

                    <Text
                        style={{
                            ...theme.typography.caption,
                            color: theme.colors.textTertiary,
                            marginTop: 2,
                            fontSize: 10,
                        }}
                    >
                        {formatDate(sermon.date)}
                    </Text>
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
            {/* Thumbnail with overlay */}
            <View style={defaultStyles.imageContainer}>
                <Image
                    source={{ uri: sermon.thumbnail_url || 'https://via.placeholder.com/400x200' }}
                    style={[
                        defaultStyles.image,
                        {
                            borderTopLeftRadius: theme.borderRadius.lg,
                            borderTopRightRadius: theme.borderRadius.lg,
                            height: isFeatured ? 200 : 180,
                        },
                    ]}
                    resizeMode="cover"
                />

                {/* Gradient overlay at bottom of image */}
                <View
                    style={[
                        defaultStyles.imageOverlay,
                        { borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg },
                    ]}
                />

                {/* Duration badge */}
                <View
                    style={[
                        defaultStyles.durationBadge,
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
                    <MaterialIcons name="headset" size={12} color="#FFFFFF" />
                    <Text style={{ ...theme.typography.labelSmall, color: '#FFFFFF', marginLeft: 4 }}>
                        {formatDuration(sermon.duration)}
                    </Text>
                </View>

                {/* Featured badge */}
                {sermon.is_featured && (
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

                {/* Play button floating on image */}
                {onPlay && (
                    <TouchableOpacity
                        onPress={onPlay}
                        style={[
                            defaultStyles.playOverlay,
                            {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: theme.borderRadius.full,
                                width: 48,
                                height: 48,
                            },
                        ]}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="play-arrow" size={28} color={theme.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Card body */}
            <View style={{ padding: theme.spacing.md }}>
                <Text
                    style={{ ...theme.typography.titleMedium, color: theme.colors.text }}
                    numberOfLines={2}
                >
                    {sermon.title}
                </Text>

                <View style={[defaultStyles.metaRow, { marginTop: theme.spacing.xs }]}>
                    <MaterialIcons name="person" size={14} color={theme.colors.primary} />
                    <Text
                        style={{
                            ...theme.typography.bodySmall,
                            color: theme.colors.primary,
                            marginLeft: theme.spacing.xxs,
                            fontWeight: '500',
                        }}
                    >
                        {sermon.preacher}
                    </Text>
                </View>

                <View style={[defaultStyles.metaRow, { marginTop: theme.spacing.xs }]}>
                    <MaterialIcons name="calendar-today" size={12} color={theme.colors.textTertiary} />
                    <Text
                        style={{
                            ...theme.typography.caption,
                            color: theme.colors.textTertiary,
                            marginLeft: theme.spacing.xxs,
                        }}
                    >
                        {formatDate(sermon.date)}
                    </Text>
                </View>

                {/* Action bar */}
                {showActions && (
                    <View
                        style={[
                            defaultStyles.actionBar,
                            {
                                marginTop: theme.spacing.md,
                                paddingTop: theme.spacing.sm,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.borderLight,
                            },
                        ]}
                    >
                        {/* Download */}
                        {onDownload && (
                            <TouchableOpacity
                                onPress={onDownload}
                                style={defaultStyles.actionItem}
                                disabled={downloadStatus === 'downloading' || downloadStatus === 'checking'}
                                activeOpacity={0.7}
                            >
                                {downloadStatus === 'downloading' || downloadStatus === 'checking' ? (
                                    <ActivityIndicator size={18} color={theme.colors.primary} />
                                ) : (
                                    <MaterialIcons
                                        name={getDownloadIcon() as any}
                                        size={theme.iconSizes.md}
                                        color={getDownloadColor()}
                                    />
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Share */}
                        {onShare && (
                            <TouchableOpacity
                                onPress={onShare}
                                style={defaultStyles.actionItem}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="share"
                                    size={theme.iconSizes.md}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        )}

                        {/* Save/Bookmark */}
                        {onSave && (
                            <TouchableOpacity
                                onPress={onSave}
                                style={defaultStyles.actionItem}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={isSaved ? 'bookmark' : 'bookmark-border'}
                                    size={theme.iconSizes.md}
                                    color={isSaved ? theme.colors.primary : theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// Static styles (not dependent on theme)
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
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    durationBadge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredBadge: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
        marginTop: -24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 20,
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

const gridStyles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 120,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
        marginTop: -16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
