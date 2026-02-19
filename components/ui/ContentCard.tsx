import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Badge, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { Sermon, Article, Category } from '@/types/content';

interface ContentCardProps {
  content: Sermon | Article;
  onPress?: () => void;
  showActions?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  onActionPress?: (action: 'play' | 'download' | 'share' | 'bookmark') => void;
}

export default function ContentCard({
  content,
  onPress,
  showActions = true,
  showStats = true,
  variant = 'default',
  onActionPress,
}: ContentCardProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  const isSermon = 'duration' in content;
  const isArticle = 'excerpt' in content;
  const contentType = isSermon ? 'sermon' : 'article';

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.medium,
    },
    cardCompact: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.sm,
      ...theme.shadows.small,
    },
    cardFeatured: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.primary,
      borderWidth: 2,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.large,
    },
    thumbnail: {
      height: variant === 'compact' ? 120 : variant === 'featured' ? 200 : 160,
      borderTopLeftRadius: variant === 'compact' ? theme.borderRadius.sm : theme.borderRadius.md,
      borderTopRightRadius: variant === 'compact' ? theme.borderRadius.sm : theme.borderRadius.md,
    },
    content: {
      padding: variant === 'compact' ? theme.spacing.sm : theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    title: {
      fontSize: variant === 'compact' ? 16 : 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
      lineHeight: variant === 'compact' ? 20 : 24,
    },
    featuredBadge: {
      backgroundColor: theme.colors.primary,
    },
    subtitle: {
      fontSize: variant === 'compact' ? 14 : 16,
      fontWeight: '500',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    description: {
      fontSize: variant === 'compact' ? 12 : 14,
      color: theme.colors.textSecondary,
      lineHeight: variant === 'compact' ? 16 : 20,
      marginBottom: theme.spacing.sm,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    typeIcon: {
      marginRight: theme.spacing.xs,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    tag: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.borderLight,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
    },
    actionText: {
      color: theme.colors.text,
    },
    primaryActionText: {
      color: '#FFFFFF',
    },
  });

  const getCardStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.cardCompact;
      case 'featured':
        return styles.cardFeatured;
      default:
        return styles.card;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getContentIcon = () => {
    if (isSermon) return 'headphones';
    if (isArticle) return 'article';
    return 'content-copy';
  };

  const getContentColor = () => {
    return theme.colors[contentType as keyof typeof theme.colors] || theme.colors.primary;
  };

  const handleActionPress = (action: 'play' | 'download' | 'share' | 'bookmark') => {
    if (onActionPress) {
      onActionPress(action);
    }
  };

  const getContentDescription = () => {
    if (isSermon) return content.description;
    if (isArticle) return content.excerpt;
    return '';
  };

  const getContentDate = () => {
    if (isSermon) return content.date;
    if (isArticle) return content.published_at;
    return '';
  };

  const getContentReadTime = () => {
    if (isArticle && content.content) {
      // Estimate read time based on content length (average reading speed: 200 words per minute)
      const wordCount = content.content.split(' ').length;
      const readTime = Math.ceil(wordCount / 200);
      return readTime;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={getCardStyle()}>
          <Card.Cover
            source={{
              uri: content.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image',
            }}
            style={styles.thumbnail}
          />

          <Card.Content style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={(variant === 'compact' ? 2 : 3) as number}>
                {content.title}
              </Text>
              {content.is_featured && (
                <Badge style={styles.featuredBadge} size={16}>
                  Featured
                </Badge>
              )}
            </View>

            <Text style={styles.subtitle}>{isSermon ? content.preacher : content.author}</Text>

            {variant !== 'compact' && (
              <Text style={styles.description} numberOfLines={2 as number}>
                {getContentDescription()}
              </Text>
            )}

            <View style={styles.meta}>
              <MaterialIcons
                name={getContentIcon() as any}
                size={16}
                color={getContentColor()}
                style={styles.typeIcon}
              />
              <Text style={styles.metaText}>{formatDate(getContentDate())}</Text>
              {isSermon && (
                <Text style={styles.metaText}>• {formatDuration(content.duration)}</Text>
              )}
              {isArticle && <Text style={styles.metaText}>• {getContentReadTime()} min read</Text>}
            </View>

            {content.tags && Array.isArray(content.tags) && content.tags.length > 0 && variant !== 'compact' && (
              <View style={styles.tags}>
                {content.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    style={styles.tag}
                    textStyle={{ color: theme.colors.textSecondary }}
                    compact
                  >
                    {tag}
                  </Chip>
                ))}
                {content.tags.length > 3 && (
                  <Chip
                    style={styles.tag}
                    textStyle={{ color: theme.colors.textSecondary }}
                    compact
                  >
                    +{content.tags.length - 3}
                  </Chip>
                )}
              </View>
            )}

            {showStats && (
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{content.views}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                {isSermon && (
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{content.downloads}</Text>
                    <Text style={styles.statLabel}>Downloads</Text>
                  </View>
                )}
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{content.tags?.length || 0}</Text>
                  <Text style={styles.statLabel}>Tags</Text>
                </View>
              </View>
            )}

            {showActions && (
              <View style={styles.actions}>
                {isSermon && (
                  <>
                    <Button
                      icon="play"
                      mode="contained"
                      onPress={() => handleActionPress('play')}
                      style={[styles.actionButton, styles.primaryAction]}
                      labelStyle={styles.primaryActionText}
                      compact
                    >
                      Play
                    </Button>
                    <Button
                      icon="download"
                      mode="outlined"
                      onPress={() => handleActionPress('download')}
                      style={styles.actionButton}
                      labelStyle={styles.actionText}
                      compact
                    >
                      Download
                    </Button>
                    <Button
                      icon="share"
                      mode="outlined"
                      onPress={() => handleActionPress('share')}
                      style={styles.actionButton}
                      labelStyle={styles.actionText}
                      compact
                    >
                      Share
                    </Button>
                  </>
                )}
                {isArticle && (
                  <>
                    <Button
                      icon="book-open"
                      mode="contained"
                      onPress={() => handleActionPress('bookmark')}
                      style={[styles.actionButton, styles.primaryAction]}
                      labelStyle={styles.primaryActionText}
                      compact
                    >
                      Read
                    </Button>
                    <Button
                      icon="bookmark"
                      mode="outlined"
                      onPress={() => handleActionPress('bookmark')}
                      style={styles.actionButton}
                      labelStyle={styles.actionText}
                      compact
                    >
                      Bookmark
                    </Button>
                    <Button
                      icon="share"
                      mode="outlined"
                      onPress={() => handleActionPress('share')}
                      style={styles.actionButton}
                      labelStyle={styles.actionText}
                      compact
                    >
                      Share
                    </Button>
                  </>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </View>
  );
}
