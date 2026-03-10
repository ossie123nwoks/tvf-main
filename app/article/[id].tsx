import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions, Pressable, Platform, Image, Share } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  IconButton,
  Chip,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { Article, Category } from '@/types/content';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedContent } from '@/lib/hooks/useSavedContent';

const { width: screenWidth } = Dimensions.get('window');

// Helper functions (outside component)
function getFontSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small': return 14;
    case 'large': return 20;
    default: return 16;
  }
}

function getLineHeight(spacing: 'tight' | 'normal' | 'loose'): number {
  switch (spacing) {
    case 'tight': return 20;
    case 'loose': return 28;
    default: return 24;
  }
}

export default function ArticleDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isContentSaved, toggleSave } = useSavedContent();

  // Article data
  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [showFullContent, setShowFullContent] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [lineHeight, setLineHeight] = useState<'tight' | 'normal' | 'loose'>('normal');

  const isBookmarked = article ? isContentSaved('article', article.id) : false;

  // Dynamic theme styles
  const cardStyle = React.useMemo(() => ({
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.small,
  }), [theme]);

  // ───── Data Loading ─────

  useEffect(() => {
    if (id) { loadArticle(); }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const articleData = await ContentService.getArticleById(id);
      setArticle(articleData);

      if (articleData.category_id) {
        try {
          const categoryData = await ContentService.getCategoryById(articleData.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.warn('Failed to load category:', error);
        }
      }

      try {
        await ContentService.incrementArticleViews(id);
      } catch (error) {
        console.warn('Failed to increment views:', error);
      }
    } catch (error) {
      console.error('Failed to load article:', error);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ───── Actions ─────

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `Check out this article: ${article.title} by ${article.author}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;
    toggleSave('article', article.id);
  };

  const handleBack = () => {
    router.back();
  };

  // ───── Formatters ─────

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateReadingTime = (content: string): number => {
    return Math.ceil(content.split(/\s+/).length / 200);
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // ───── Content Parser ─────

  const parseContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    const dynamicFontSize = getFontSize(fontSize);
    const dynamicLineHeight = getLineHeight(lineHeight);

    return paragraphs.map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return (
          <Text key={index} style={{ ...theme.typography.headlineMedium, color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}>
            {paragraph.substring(2)}
          </Text>
        );
      } else if (paragraph.startsWith('## ')) {
        return (
          <Text key={index} style={{ ...theme.typography.titleLarge, color: theme.colors.text, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            {paragraph.substring(3)}
          </Text>
        );
      } else if (paragraph.startsWith('> ')) {
        return (
          <View key={index} style={[staticStyles.quoteBlock, { borderLeftColor: theme.colors.primary, marginVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md }]}>
            <Text style={{ fontSize: dynamicFontSize, color: theme.colors.primary, fontStyle: 'italic', lineHeight: dynamicLineHeight }}>
              {paragraph.substring(2)}
            </Text>
          </View>
        );
      } else if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(item => item.startsWith('- '));
        return (
          <View key={index} style={{ marginLeft: theme.spacing.md, marginBottom: theme.spacing.md }}>
            {items.map((item, itemIndex) => (
              <View key={itemIndex} style={staticStyles.listItemRow}>
                <View style={[staticStyles.bulletDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={{ fontSize: dynamicFontSize, color: theme.colors.text, lineHeight: dynamicLineHeight, flex: 1 }}>
                  {item.substring(2)}
                </Text>
              </View>
            ))}
          </View>
        );
      } else {
        return (
          <Text key={index} style={{ fontSize: dynamicFontSize, color: theme.colors.text, lineHeight: dynamicLineHeight, marginBottom: theme.spacing.md }}>
            {paragraph}
          </Text>
        );
      }
    });
  };

  // ───── Loading / Error ─────

  if (loading) {
    return (
      <View style={[staticStyles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
          Loading article...
        </Text>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[staticStyles.centered, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
        <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md, marginHorizontal: theme.spacing.lg }}>
          {error || 'Article not found'}
        </Text>
        <Button mode="contained" onPress={handleBack} style={{ marginTop: theme.spacing.md }} buttonColor={theme.colors.primary} textColor="#FFFFFF">
          Go Back
        </Button>
      </View>
    );
  }

  const readTime = calculateReadingTime(article.content);

  // ───── Main Render ─────

  return (
    <ErrorBoundary>
      <View style={[staticStyles.flex, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={staticStyles.flex} showsVerticalScrollIndicator={false}>

          {/* ─── Hero Header ─── */}
          <View style={[staticStyles.heroSection, { backgroundColor: theme.colors.surfaceElevated, paddingTop: Platform.select({ ios: Math.max(insets.top, 20), android: 0 }) }]}>
            {/* Back Button */}
            <Pressable
              style={[staticStyles.backBtn, { backgroundColor: theme.colors.background + 'CC', borderRadius: theme.borderRadius.full }]}
              onPress={handleBack}
            >
              <MaterialIcons name="arrow-back" size={22} color={theme.colors.text} />
            </Pressable>

            {/* Thumbnail */}
            {article.thumbnail_url ? (
              <View style={[staticStyles.thumbnailContainer, { borderRadius: theme.borderRadius.lg, ...theme.shadows.medium }]}>
                <Image
                  source={{ uri: article.thumbnail_url }}
                  style={[staticStyles.thumbnail, { borderRadius: theme.borderRadius.lg }]}
                  resizeMode="cover"
                />
                {/* Reading time badge */}
                <View style={[staticStyles.readTimeBadge, { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: theme.borderRadius.xs }]}>
                  <MaterialIcons name="schedule" size={12} color="#FFFFFF" />
                  <Text style={{ ...theme.typography.labelSmall, color: '#FFFFFF', marginLeft: 4 }}>
                    {readTime} min read
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[staticStyles.thumbnailPlaceholder, { borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surfaceVariant }]}>
                <MaterialIcons name="article" size={64} color={theme.colors.textTertiary} />
              </View>
            )}

            {/* Title */}
            <Text style={{ ...theme.typography.displayMedium, color: theme.colors.text, marginTop: theme.spacing.lg }}>
              {article.title}
            </Text>

            {/* Author Row */}
            <View style={[staticStyles.authorRow, { marginTop: theme.spacing.md }]}>
              <Avatar.Text
                size={40}
                label={getInitials(article.author)}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ color: '#FFFFFF', ...theme.typography.labelMedium }}
              />
              <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                <Text style={{ ...theme.typography.titleSmall, color: theme.colors.text }}>
                  {article.author}
                </Text>
                <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>
                  {formatDate(article.published_at)} • {readTime} min read
                </Text>
              </View>
              {article.is_featured && (
                <View style={[staticStyles.featuredBadge, { backgroundColor: theme.colors.accent + '20', borderRadius: theme.borderRadius.xs }]}>
                  <MaterialIcons name="star" size={14} color={theme.colors.accent} />
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={[staticStyles.quickActions, { marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingTop: theme.spacing.md }]}>
              <Pressable onPress={handleBookmark} style={staticStyles.quickAction}>
                <MaterialIcons
                  name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                  size={22}
                  color={isBookmarked ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={{ ...theme.typography.labelSmall, color: isBookmarked ? theme.colors.primary : theme.colors.textSecondary, marginTop: 2 }}>
                  {isBookmarked ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
              <Pressable onPress={handleShare} style={staticStyles.quickAction}>
                <MaterialIcons name="share" size={22} color={theme.colors.textSecondary} />
                <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary, marginTop: 2 }}>Share</Text>
              </Pressable>
            </View>
          </View>

          {/* ─── Content Area ─── */}
          <View style={{ padding: theme.spacing.md }}>

            {/* Reading Controls */}
            <View style={[cardStyle, { padding: theme.spacing.md }]}>
              <View style={staticStyles.controlRow}>
                <Text style={{ ...theme.typography.labelMedium, color: theme.colors.text }}>Font Size</Text>
                <View style={staticStyles.controlBtns}>
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => setFontSize(size)}
                      style={[
                        staticStyles.controlPill,
                        {
                          backgroundColor: fontSize === size ? theme.colors.primaryContainer : 'transparent',
                          borderRadius: theme.borderRadius.sm,
                        }
                      ]}
                    >
                      <Text style={{
                        ...theme.typography.labelSmall,
                        color: fontSize === size ? theme.colors.primary : theme.colors.textSecondary,
                        fontSize: size === 'small' ? 11 : size === 'large' ? 15 : 13,
                      }}>
                        Aa
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={[staticStyles.controlRow, { marginTop: theme.spacing.sm }]}>
                <Text style={{ ...theme.typography.labelMedium, color: theme.colors.text }}>Line Spacing</Text>
                <View style={staticStyles.controlBtns}>
                  {(['tight', 'normal', 'loose'] as const).map((spacing) => (
                    <Pressable
                      key={spacing}
                      onPress={() => setLineHeight(spacing)}
                      style={[
                        staticStyles.controlPill,
                        {
                          backgroundColor: lineHeight === spacing ? theme.colors.primaryContainer : 'transparent',
                          borderRadius: theme.borderRadius.sm,
                        }
                      ]}
                    >
                      <MaterialIcons
                        name="format-line-spacing"
                        size={spacing === 'tight' ? 14 : spacing === 'loose' ? 20 : 17}
                        color={lineHeight === spacing ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Excerpt */}
            {article.excerpt && (
              <View style={[staticStyles.excerptContainer, { borderLeftColor: theme.colors.accent, marginTop: theme.spacing.lg, paddingLeft: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.bodyLarge, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                  "{article.excerpt}"
                </Text>
              </View>
            )}

            {/* Article Body */}
            <View style={{ marginTop: theme.spacing.lg }}>
              {parseContent(article.content)}
            </View>

            {/* Stats */}
            <View style={[cardStyle, { padding: theme.spacing.md, marginTop: theme.spacing.lg }]}>
              <View style={staticStyles.statsGrid}>
                {[
                  { value: article.views, label: 'Views', icon: 'visibility' as const },
                  { value: article.tags && Array.isArray(article.tags) ? article.tags.length : 0, label: 'Tags', icon: 'label' as const },
                  { value: readTime, label: 'Min Read', icon: 'schedule' as const },
                ].map((stat, i) => (
                  <View key={i} style={staticStyles.statItem}>
                    <MaterialIcons name={stat.icon} size={18} color={theme.colors.primary} />
                    <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginTop: 2 }}>{stat.value}</Text>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textTertiary }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tags */}
            {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
              <View style={[cardStyle, { padding: theme.spacing.lg, marginTop: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.sm }}>Tags</Text>
                <View style={staticStyles.tagsWrap}>
                  {article.tags.map((tag, index) => (
                    <Chip key={index} style={{ marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs, backgroundColor: theme.colors.primaryContainer }} textStyle={{ ...theme.typography.labelSmall, color: theme.colors.primary }}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Category */}
            {category && (
              <View style={[cardStyle, { padding: theme.spacing.lg, marginTop: theme.spacing.md }]}>
                <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.sm }}>Category</Text>
                <Chip icon={category.icon} style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }} textStyle={{ ...theme.typography.labelMedium, color: theme.colors.primary }}>
                  {category.name}
                </Chip>
              </View>
            )}

            {/* Bottom spacer */}
            <View style={{ height: theme.spacing.xxl }} />
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ───── Static Styles ─────

const staticStyles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroSection: { paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    position: 'absolute', top: 16, left: 16, zIndex: 10,
  },
  thumbnailContainer: { width: '100%', height: 240, marginTop: 56, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: '100%', height: 240, marginTop: 56, justifyContent: 'center', alignItems: 'center' },
  readTimeBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  featuredBadge: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 24 },

  // Controls
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlBtns: { flexDirection: 'row', gap: 4 },
  controlPill: { width: 36, height: 32, justifyContent: 'center', alignItems: 'center' },

  // Quote
  quoteBlock: { borderLeftWidth: 4 },
  listItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 10 },

  // Excerpt
  excerptContainer: { borderLeftWidth: 3 },

  // Stats
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
