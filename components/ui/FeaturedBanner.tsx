import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Linking,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface CarouselItem {
    id: string;
    image_url: string | number; // string URL or require() number
    title?: string;
    description?: string;
    link_url?: string;
}

interface FeaturedBannerProps {
    data: CarouselItem[];
    loading?: boolean;
    autoPlayInterval?: number;
    height?: number;
}

export default function FeaturedBanner({
    data,
    loading = false,
    autoPlayInterval = 4000,
    height = 220,
}: FeaturedBannerProps) {
    const { theme } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const carouselRef = useRef<FlatList>(null);
    const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
    const userTimer = useRef<NodeJS.Timeout | null>(null);

    const bannerWidth = screenWidth - theme.spacing.md * 2;

    // Auto-scroll
    useEffect(() => {
        if (data.length <= 1 || isUserScrolling) {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
            return;
        }

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === data.length - 1 ? 0 : prev + 1));
        }, autoPlayInterval);

        autoScrollTimer.current = timer;
        return () => clearInterval(timer);
    }, [data.length, isUserScrolling, autoPlayInterval]);

    // Scroll to current index
    useEffect(() => {
        if (carouselRef.current && data.length > 0) {
            carouselRef.current.scrollToIndex({
                index: currentIndex,
                animated: true,
            });
        }
    }, [currentIndex]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
            if (userTimer.current) clearTimeout(userTimer.current);
        };
    }, []);

    if (loading) {
        return (
            <View
                style={[
                    styles.loadingContainer,
                    {
                        height,
                        marginHorizontal: theme.spacing.md,
                        borderRadius: theme.borderRadius.lg,
                        backgroundColor: theme.colors.skeleton,
                    },
                ]}
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (data.length === 0) return null;

    return (
        <View style={{ marginBottom: theme.spacing.md }}>
            {/* Carousel */}
            <View
                style={[
                    styles.carouselWrapper,
                    {
                        height,
                        marginHorizontal: theme.spacing.md,
                        borderRadius: theme.borderRadius.lg,
                        overflow: 'hidden',
                        ...theme.shadows.medium,
                    },
                ]}
            >
                <FlatList
                    ref={carouselRef}
                    data={data}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    getItemLayout={(_, index) => ({
                        length: bannerWidth,
                        offset: bannerWidth * index,
                        index,
                    })}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            carouselRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }, 500);
                    }}
                    onScrollBeginDrag={() => {
                        setIsUserScrolling(true);
                        if (userTimer.current) clearTimeout(userTimer.current);
                    }}
                    onMomentumScrollEnd={(event) => {
                        const idx = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
                        setCurrentIndex(idx);
                        if (userTimer.current) clearTimeout(userTimer.current);
                        userTimer.current = setTimeout(() => setIsUserScrolling(false), 3000);
                    }}
                    renderItem={({ item }) => {
                        const imageSource =
                            typeof item.image_url === 'string' && item.image_url.startsWith('http')
                                ? { uri: item.image_url }
                                : item.image_url;

                        return (
                            <TouchableOpacity
                                style={[styles.slide, { width: bannerWidth, height }]}
                                activeOpacity={item.link_url ? 0.85 : 1}
                                onPress={() => {
                                    if (item.link_url) Linking.openURL(item.link_url);
                                }}
                            >
                                {/* Tinted background */}
                                <View
                                    style={[
                                        StyleSheet.absoluteFillObject,
                                        { backgroundColor: theme.colors.primaryContainer },
                                    ]}
                                />
                                <Image
                                    source={imageSource as any}
                                    style={styles.slideImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Indicators */}
            {data.length > 1 && (
                <View
                    style={[
                        styles.indicators,
                        { marginTop: theme.spacing.sm, gap: theme.spacing.xs },
                    ]}
                >
                    {data.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                setCurrentIndex(index);
                                carouselRef.current?.scrollToIndex({ index, animated: true });
                            }}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        width: index === currentIndex ? 24 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor:
                                            index === currentIndex
                                                ? theme.colors.primary
                                                : theme.colors.border,
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselWrapper: {},
    slide: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {},
});
