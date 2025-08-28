import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions, Linking } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme as usePaperTheme,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
  Badge,
  Avatar,
  FAB,
  Menu,
  List
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { ContentService } from '@/lib/supabase/content';
import { Article, Category } from '@/types/content';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const { width: screenWidth } = Dimensions.get('window');

export default function ArticleDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Article data
  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [showFullContent, setShowFullContent] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [lineHeight, setLineHeight] = useState<'tight' | 'normal' | 'loose'>('normal');
  
  // Menu states
  const [fontMenuVisible, setFontMenuVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    thumbnail: {
      width: '100%',
      height: 250,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 36,
    },
    author: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    featuredBadge: {
      marginLeft: 'auto',
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    excerpt: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      lineHeight: 26,
      marginBottom: theme.spacing.lg,
      fontStyle: 'italic',
    },
    articleContent: {
      fontSize: getFontSize(fontSize),
      color: theme.colors.text,
      lineHeight: getLineHeight(lineHeight),
      marginBottom: theme.spacing.lg,
    },
    paragraph: {
      marginBottom: theme.spacing.md,
    },
    heading: {
      fontSize: getFontSize(fontSize) + 4,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    subheading: {
      fontSize: getFontSize(fontSize) + 2,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    quote: {
      fontSize: getFontSize(fontSize),
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    list: {
      marginLeft: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    listItem: {
      marginBottom: theme.spacing.xs,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    readingControls: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      elevation: 2,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    controlLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    controlButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
    },
    relatedContent: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    relatedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    relatedItemText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
  });

  // Helper functions for dynamic styling
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

  // Load article data
  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const articleData = await ContentService.getArticleById(id);
      setArticle(articleData);
      
      // Load category information
              if (articleData.category_id) {
          try {
            const categoryData = await ContentService.getCategoryById(articleData.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.warn('Failed to load category:', error);
        }
      }
      
      // Increment view count
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

  const handleDownload = async () => {
    // TODO: Implement download functionality
    Alert.alert('Coming Soon', 'Download functionality will be implemented in the next phase.');
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    Alert.alert('Coming Soon', 'Share functionality will be implemented in the next phase.');
  };

  const handleBookmark = async () => {
    // TODO: Implement bookmark functionality
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      isBookmarked ? 'Bookmark Removed' : 'Bookmark Added',
      isBookmarked ? 'Article removed from bookmarks' : 'Article added to bookmarks'
    );
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const parseContent = (content: string) => {
    // Simple content parsing for demonstration
    // In a real app, you might use a markdown parser or rich text renderer
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return (
          <Text key={index} style={styles.heading}>
            {paragraph.substring(2)}
          </Text>
        );
      } else if (paragraph.startsWith('## ')) {
        return (
          <Text key={index} style={styles.subheading}>
            {paragraph.substring(3)}
          </Text>
        );
      } else if (paragraph.startsWith('> ')) {
        return (
          <Text key={index} style={styles.quote}>
            {paragraph.substring(2)}
          </Text>
        );
      } else if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(item => item.startsWith('- '));
        return (
          <View key={index} style={styles.list}>
            {items.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.listItem}>
                • {item.substring(2)}
              </Text>
            ))}
          </View>
        );
      } else {
        return (
          <Text key={index} style={[styles.articleContent, styles.paragraph]}>
            {paragraph}
          </Text>
        );
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.metaText}>Loading article...</Text>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons 
          name="error" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={styles.errorText}>
          {error || 'Article not found'}
        </Text>
        <Button mode="contained" onPress={handleBack}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header Section */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBack}
              style={{ position: 'absolute', top: theme.spacing.md, left: theme.spacing.md, zIndex: 1 }}
            />
            
            {article.thumbnail_url && (
              <Card.Cover 
                source={{ uri: article.thumbnail_url }} 
                style={styles.thumbnail}
              />
            )}
            
            <Text style={styles.title}>{article.title}</Text>
            
            {/* Author Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Avatar.Text 
                size={40} 
                label={getInitials(article.author)}
                style={{ backgroundColor: theme.colors.primary, marginRight: theme.spacing.sm }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.author}>{article.author}</Text>
                <Text style={styles.metaText}>
                  {formatDate(article.published_at)} • {calculateReadingTime(article.content)} min read
                </Text>
              </View>
              {article.is_featured && (
                <Badge size={16} style={styles.featuredBadge}>
                  Featured
                </Badge>
              )}
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Reading Controls */}
            <View style={styles.readingControls}>
              <View style={styles.controlsRow}>
                <Text style={styles.controlLabel}>Font Size</Text>
                <View style={styles.controlButtons}>
                  <IconButton
                    icon="format-size"
                    size={20}
                    onPress={() => setFontSize('small')}
                    iconColor={fontSize === 'small' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <IconButton
                    icon="format-size"
                    size={24}
                    onPress={() => setFontSize('medium')}
                    iconColor={fontSize === 'medium' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <IconButton
                    icon="format-size"
                    size={28}
                    onPress={() => setFontSize('large')}
                    iconColor={fontSize === 'large' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.controlsRow}>
                <Text style={styles.controlLabel}>Line Spacing</Text>
                <View style={styles.controlButtons}>
                  <IconButton
                    icon="format-line-spacing"
                    size={20}
                    onPress={() => setLineHeight('tight')}
                    iconColor={lineHeight === 'tight' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <IconButton
                    icon="format-line-spacing"
                    size={24}
                    onPress={() => setLineHeight('normal')}
                    iconColor={lineHeight === 'normal' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <IconButton
                    icon="format-line-spacing"
                    size={28}
                    onPress={() => setLineHeight('loose')}
                    iconColor={lineHeight === 'loose' ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Article Excerpt */}
            <View style={styles.section}>
              <Text style={styles.excerpt}>
                "{article.excerpt}"
              </Text>
            </View>

            {/* Article Content */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Article Content</Text>
              {parseContent(article.content)}
            </View>

            {/* Stats Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{article.views}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{article.tags && Array.isArray(article.tags) ? article.tags.length : 0}</Text>
                  <Text style={styles.statLabel}>Tags</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {calculateReadingTime(article.content)}
                  </Text>
                  <Text style={styles.statLabel}>Min Read</Text>
                </View>
              </View>
            </View>

            {/* Tags Section */}
            {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tags}>
                  {article.tags.map((tag, index) => (
                    <Chip key={index} style={{ marginBottom: theme.spacing.sm }}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Category Section */}
            {category && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Chip
                  icon={category.icon}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {category.name}
                </Chip>
              </View>
            )}

            {/* Related Content Placeholder */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Articles</Text>
              <View style={styles.relatedContent}>
                <View style={styles.relatedItem}>
                  <MaterialIcons name="article" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.relatedItemText}>Related article title would appear here</Text>
                  <IconButton icon="chevron-right" size={20} />
                </View>
                <View style={styles.relatedItem}>
                  <MaterialIcons name="article" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.relatedItemText}>Another related article title</Text>
                  <IconButton icon="chevron-right" size={20} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="download"
            onPress={handleDownload}
            style={styles.actionButton}
            loading={isDownloading}
          >
            Download
          </Button>
          
          <Button
            mode="outlined"
            icon="share"
            onPress={handleShare}
            style={styles.actionButton}
          >
            Share
          </Button>
          
          <Button
            mode="outlined"
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            onPress={handleBookmark}
            style={styles.actionButton}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
        </View>

        {/* Font Size Menu */}
        <Menu
          visible={fontMenuVisible}
          onDismiss={() => setFontMenuVisible(false)}
          anchor={<View />}
        >
          <Menu.Item
            leadingIcon="format-size"
            title="Small"
            onPress={() => {
              setFontSize('small');
              setFontMenuVisible(false);
            }}
          />
          <Menu.Item
            leadingIcon="format-size"
            title="Medium"
            onPress={() => {
              setFontSize('medium');
              setFontMenuVisible(false);
            }}
          />
          <Menu.Item
            leadingIcon="format-size"
            title="Large"
            onPress={() => {
              setFontSize('large');
              setFontMenuVisible(false);
            }}
          />
        </Menu>

        {/* More Options Menu */}
        <Menu
          visible={moreMenuVisible}
          onDismiss={() => setMoreMenuVisible(false)}
          anchor={<View />}
        >
          <Menu.Item
            leadingIcon="text-to-speech"
            title="Read Aloud"
            onPress={() => {
              setMoreMenuVisible(false);
              Alert.alert('Coming Soon', 'Text-to-speech functionality will be implemented in the next phase.');
            }}
          />
          <Menu.Item
            leadingIcon="translate"
            title="Translate"
            onPress={() => {
              setMoreMenuVisible(false);
              Alert.alert('Coming Soon', 'Translation functionality will be implemented in the next phase.');
            }}
          />
          <Divider />
          <Menu.Item
            leadingIcon="report"
            title="Report Issue"
            onPress={() => {
              setMoreMenuVisible(false);
              Alert.alert('Coming Soon', 'Report functionality will be implemented in the next phase.');
            }}
          />
        </Menu>

        {/* FAB for more options */}
        <FAB
          icon="more-vert"
          style={styles.fab}
          onPress={() => setMoreMenuVisible(true)}
        />
      </View>
    </ErrorBoundary>
  );
}
