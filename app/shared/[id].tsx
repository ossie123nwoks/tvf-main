import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Article } from '@/types/content';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface SharedContentPageProps {
  id: string;
}

export default function SharedContentPage({ id }: SharedContentPageProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { user } = useAuth();
  const [content, setContent] = useState<Sermon | Article | null>(null);
  const [contentType, setContentType] = useState<'sermon' | 'article' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    contentCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    contentHeader: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    contentTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    contentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    contentAuthor: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.md,
    },
    contentDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    contentDescription: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
    },
    actionSection: {
      padding: theme.spacing.lg,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    actionButtons: {
      gap: theme.spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    authPrompt: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    authPromptTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    authPromptText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
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
      marginBottom: theme.spacing.lg,
    },
  });

  useEffect(() => {
    loadSharedContent();
  }, [id]);

  const loadSharedContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load as sermon first
      try {
        const sermon = await ContentService.getSermonById(id);
        if (sermon) {
          setContent(sermon);
          setContentType('sermon');
          setLoading(false);
          return;
        }
      } catch (sermonError) {
        // Not a sermon, try article
      }

      // Try to load as article
      try {
        const article = await ContentService.getArticleById(id);
        if (article) {
          setContent(article);
          setContentType('article');
          setLoading(false);
          return;
        }
      } catch (articleError) {
        // Not an article either
      }

      // If we get here, content doesn't exist
      setError('Content not found or has been removed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = () => {
    if (!content || !contentType) return;

    if (contentType === 'sermon') {
      router.push(`/sermon/${content.id}`);
    } else {
      router.push(`/article/${content.id}`);
    }
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignUp = () => {
    router.push('/auth');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getContentIcon = () => {
    return contentType === 'sermon' ? 'music-note' : 'article';
  };

  const getContentTypeLabel = () => {
    return contentType === 'sermon' ? 'Sermon' : 'Article';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading shared content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color={theme.colors.error}
          style={{ marginBottom: theme.spacing.md }}
        />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => router.push('/(tabs)/dashboard')}
          style={styles.primaryButton}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
        >
          Go to Dashboard
        </Button>
      </View>
    );
  }

  if (!content || !contentType) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="content-copy"
          size={48}
          color={theme.colors.textSecondary}
          style={{ marginBottom: theme.spacing.md }}
        />
        <Text style={styles.errorText}>Content not found</Text>
        <Button
          mode="contained"
          onPress={() => router.push('/(tabs)/dashboard')}
          style={styles.primaryButton}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
        >
          Go to Dashboard
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TVF</Text>
          </View>
          <Text style={styles.title}>Shared Content</Text>
          <Text style={styles.subtitle}>
            Someone shared this {getContentTypeLabel().toLowerCase()} with you
          </Text>
        </View>

        {/* Content Preview */}
        <Card style={styles.contentCard}>
          <Card.Content style={styles.contentHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <MaterialIcons
                name={getContentIcon()}
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Chip
                icon={getContentIcon()}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                {getContentTypeLabel()}
              </Chip>
            </View>
            
            <Text style={styles.contentTitle}>{content.title}</Text>
            
            <View style={styles.contentMeta}>
              <Text style={styles.contentAuthor}>
                {contentType === 'sermon' ? (content as Sermon).preacher : (content as Article).author}
              </Text>
              <Text style={styles.contentDate}>
                {contentType === 'sermon' 
                  ? formatDate((content as Sermon).date) 
                  : formatDate((content as Article).published_at)
                }
              </Text>
            </View>
            
            {content.description && (
              <Text style={styles.contentDescription} numberOfLines={4}>
                {content.description}
              </Text>
            )}
          </Card.Content>

          <Card.Content style={styles.actionSection}>
            <Text style={styles.actionTitle}>View Full Content</Text>
            
            {user ? (
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={handleViewContent}
                  style={styles.primaryButton}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  icon="open-in-new"
                >
                  Open in App
                </Button>
              </View>
            ) : (
              <View style={styles.authPrompt}>
                <Text style={styles.authPromptTitle}>Sign in to view full content</Text>
                <Text style={styles.authPromptText}>
                  Create a free account or sign in to access the complete {getContentTypeLabel().toLowerCase()} and more content from TRUEVINE FELLOWSHIP Church.
                </Text>
                
                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    onPress={handleSignIn}
                    style={styles.primaryButton}
                    buttonColor={theme.colors.primary}
                    textColor="#FFFFFF"
                    icon="login"
                  >
                    Sign In
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={handleSignUp}
                    style={styles.secondaryButton}
                    textColor={theme.colors.primary}
                    icon="person-add"
                  >
                    Create Account
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* App Features */}
        <Card style={styles.contentCard}>
          <Card.Content style={styles.actionSection}>
            <Text style={styles.actionTitle}>Join TRUEVINE FELLOWSHIP</Text>
            
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="music-note"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={{ color: theme.colors.text, flex: 1 }}>
                  Access to sermons and teachings
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="article"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={{ color: theme.colors.text, flex: 1 }}>
                  Inspirational articles and devotionals
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="notifications"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={{ color: theme.colors.text, flex: 1 }}>
                  Church updates and notifications
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="people"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={{ color: theme.colors.text, flex: 1 }}>
                  Connect with the church community
                </Text>
              </View>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => router.push('/(tabs)/dashboard')}
              style={styles.secondaryButton}
              textColor={theme.colors.primary}
              icon="home"
            >
              Explore More Content
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
