import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, Avatar, useTheme as usePaperTheme, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentGuard } from '@/components/auth/ContentGuard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileModal from '@/components/ui/ProfileModal';
import { DeepLinkDemo } from '@/components/ui/DeepLinkDemo';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Article } from '@/types/content';
import { QuickShareButton } from '@/components/ui/QuickShareButton';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Responsive breakpoints
  const isTablet = screenWidth >= 768;
  const isLargeScreen = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

  // Fetch sermons and articles on component mount
  useEffect(() => {
    const fetchSermons = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ContentService.getSermons({ 
          limit: 3, 
          sortBy: 'date', 
          sortOrder: 'desc',
          published: true 
        });
        setSermons(response.data || []);
      } catch (err) {
        console.error('Failed to fetch sermons:', err);
        setError('Failed to load sermons');
      } finally {
        setLoading(false);
      }
    };

    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        setArticlesError(null);
        const response = await ContentService.getArticles({ 
          limit: 3, 
          sortBy: 'date', 
          sortOrder: 'desc',
          published: true 
        });
        setArticles(response.data || []);
      } catch (err) {
        console.error('Failed to fetch articles:', err);
        setArticlesError('Failed to load articles');
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchSermons();
    fetchArticles();
  }, []);

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Helper function to format article date (uses published_at)
  const formatArticleDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    // Hero Section - matches design system
    heroSection: {
      minHeight: 200,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      margin: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    heroTitle: {
      fontSize: isLargeScreen ? 36 : isTablet ? 32 : isSmallScreen ? 24 : 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: isLargeScreen ? 18 : isTablet ? 17 : isSmallScreen ? 14 : 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    // Header with actions
    header: {
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.cardBackground,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    headerContent: {
      flex: 1,
    },
    greetingText: {
      fontSize: isLargeScreen ? 24 : isTablet ? 22 : 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 0,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexShrink: 0,
      marginRight: 0,
    },
         // Action buttons - matches design system
     actionButtons: {
       flexDirection: 'row',
       justifyContent: 'space-around',
       alignItems: 'center',
       gap: theme.spacing.lg,
       marginBottom: theme.spacing.lg,
       paddingHorizontal: theme.spacing.xl,
       paddingVertical: theme.spacing.md,
     },
     actionButton: {
       width: 80,
       height: 80,
       borderRadius: theme.borderRadius.lg,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: theme.colors.cardBackground,
       borderWidth: 1,
       borderColor: theme.colors.border,
       ...theme.shadows.small,
     },
     actionButtonPrimary: {
       backgroundColor: theme.colors.primary,
       borderColor: theme.colors.primary,
     },
     actionButtonSecondary: {
       backgroundColor: '#F0F9FF', // Light blue pastel
       borderColor: '#BAE6FD',
     },
     actionButtonTertiary: {
       backgroundColor: '#FDF2F8', // Light pink pastel
       borderColor: '#FBCFE8',
     },
         // Content sections
     featuredSection: {
       marginBottom: theme.spacing.lg,
       paddingHorizontal: theme.spacing.md,
     },
     sectionHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: theme.spacing.md,
     },
     sectionTitle: {
       fontSize: isLargeScreen ? 24 : isTablet ? 22 : 20,
       fontWeight: '600',
       color: theme.colors.text,
       flex: 1,
     },
     shareButton: {
       width: 40,
       height: 40,
       borderRadius: theme.borderRadius.md,
       backgroundColor: theme.colors.cardBackground,
       borderWidth: 1,
       borderColor: theme.colors.border,
       justifyContent: 'center',
       alignItems: 'center',
       ...theme.shadows.small,
     },
    // Cards - matches design system
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.medium,
    },
    contentGrid: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: isTablet ? theme.spacing.lg : theme.spacing.md,
    },
         contentColumn: {
       flex: isTablet ? 1 : undefined,
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
       color: theme.colors.error,
       textAlign: 'center',
       marginBottom: theme.spacing.md,
     },
     retryButton: {
       marginTop: theme.spacing.md,
     },
     cardImageContainer: {
       position: 'relative',
     },
     shareButtonOverlay: {
       position: 'absolute',
       top: theme.spacing.sm,
       right: theme.spacing.sm,
       backgroundColor: 'rgba(0, 0, 0, 0.6)',
       borderRadius: theme.borderRadius.md,
       zIndex: 1,
     },
   });

  return (
    <ContentGuard
      requireAuth={true}
      fallbackMessage="Sign in to access your personalized dashboard"
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header with actions - moved above hero section */}
          <View style={styles.header}>
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                <Text style={styles.greetingText}>Hi {user?.firstName || 'Friend'}!</Text>
              </View>
              <View style={styles.headerActions}>
                <Button
                  icon={isDark ? 'weather-night' : 'weather-sunny'}
                  mode="contained-tonal"
                  onPress={toggleTheme}
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                  compact
                >
                  {isDark ? 'Dark' : 'Light'}
                </Button>
                {user?.avatarUrl ? (
                  <Avatar.Image
                    size={isTablet ? 50 : 40}
                    source={{ uri: user.avatarUrl }}
                    style={{ borderWidth: 2, borderColor: theme.colors.primary }}
                    onTouchEnd={() => setShowProfileModal(true)}
                  />
                ) : (
                  <Avatar.Icon
                    size={isTablet ? 50 : 40}
                    icon="account"
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      borderWidth: 2,
                      borderColor: theme.colors.primary
                    }}
                    onTouchEnd={() => setShowProfileModal(true)}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Hero Section - matches design system */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome to TRUEVINE</Text>
            <Text style={styles.heroSubtitle}>Fellowship Church</Text>
          </View>

                     <View style={styles.actionButtons}>
             <TouchableOpacity 
               style={[styles.actionButton, styles.actionButtonPrimary]}
               onPress={() => router.push('/(tabs)/sermons')}
               activeOpacity={0.8}
             >
               <MaterialIcons name="headphones" size={32} color="white" />
               <Text style={{ 
                 fontSize: 12, 
                 color: 'white', 
                 marginTop: theme.spacing.xs,
                 fontWeight: '500'
               }}>
                 Sermons
               </Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.actionButton, styles.actionButtonSecondary]}
               onPress={() => router.push('/(tabs)/articles')}
               activeOpacity={0.8}
             >
               <MaterialIcons name="article" size={32} color="#0369A1" />
               <Text style={{ 
                 fontSize: 12, 
                 color: '#0369A1', 
                 marginTop: theme.spacing.xs,
                 fontWeight: '500'
               }}>
                 Articles
               </Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.actionButton, styles.actionButtonTertiary]}
               onPress={() => Linking.openURL('https://truevinefellowship.org')}
               activeOpacity={0.8}
             >
               <MaterialIcons name="language" size={32} color="#BE185D" />
               <Text style={{ 
                 fontSize: 12, 
                 color: '#BE185D', 
                 marginTop: theme.spacing.xs,
                 fontWeight: '500'
               }}>
                 Website
               </Text>
             </TouchableOpacity>
           </View>

          <View style={styles.contentGrid}>
                         <View style={styles.contentColumn}>
               <View style={styles.featuredSection}>
                 <View style={styles.sectionHeader}>
                   <Text style={styles.sectionTitle}>Recent Sermons</Text>
                   <TouchableOpacity 
                     style={styles.shareButton}
                     onPress={() => router.push('/(tabs)/sermons')}
                     activeOpacity={0.7}
                   >
                     <MaterialIcons name="more-horiz" size={20} color={theme.colors.primary} />
                   </TouchableOpacity>
                 </View>
                 
                 {loading ? (
                   <View style={styles.loadingContainer}>
                     <ActivityIndicator size="large" color={theme.colors.primary} />
                     <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
                       Loading sermons...
                     </Text>
                   </View>
                 ) : error ? (
                   <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>{error}</Text>
                     <Button 
                       mode="outlined" 
                       onPress={() => {
                         setError(null);
                         // Retry fetch
                         const fetchSermons = async () => {
                           try {
                             setLoading(true);
                             const response = await ContentService.getSermons({ 
                               limit: 3, 
                               sortBy: 'date', 
                               sortOrder: 'desc',
                               published: true 
                             });
                             setSermons(response.data || []);
                           } catch (err) {
                             setError('Failed to load sermons');
                           } finally {
                             setLoading(false);
                           }
                         };
                         fetchSermons();
                       }}
                       textColor={theme.colors.primary}
                       style={styles.retryButton}
                     >
                       Retry
                     </Button>
                   </View>
                 ) : sermons.length > 0 ? (
                   sermons.map((sermon, index) => (
                     <Card key={sermon.id} style={[styles.card, { marginBottom: index < sermons.length - 1 ? theme.spacing.md : 0 }]}>
                       <View style={styles.cardImageContainer}>
                         <Card.Cover 
                           source={{ 
                             uri: sermon.thumbnail_url || 'https://via.placeholder.com/300x200' 
                           }} 
                         />
                         <View style={styles.shareButtonOverlay}>
                           <QuickShareButton
                             type="sermon"
                             id={sermon.id}
                             title={sermon.title}
                             author={sermon.preacher}
                             date={formatDate(sermon.date)}
                             size={20}
                             onShare={(result) => {
                               console.log('Sermon shared:', result);
                             }}
                           />
                         </View>
                       </View>
                       <Card.Content>
                         <Text variant="titleMedium">{sermon.title}</Text>
                         <Text variant="bodyMedium">{sermon.preacher}</Text>
                         <Text variant="bodySmall">
                           {formatDuration(sermon.duration)} • {formatDate(sermon.date)}
                         </Text>
                       </Card.Content>
                       <Card.Actions>
                         <Button 
                           mode="contained" 
                           onPress={() => router.push(`/sermon/${sermon.id}`)}
                           buttonColor={theme.colors.primary}
                           textColor="#FFFFFF"
                           icon={() => <MaterialIcons name="play-arrow" size={20} color="white" />}
                         >
                           Play
                         </Button>
                         <Button 
                           mode="outlined" 
                           onPress={() => router.push('/(tabs)/sermons')}
                           textColor={theme.colors.primary}
                           icon={() => <MaterialIcons name="download" size={20} color={theme.colors.primary} />}
                         >
                           Download
                         </Button>
                       </Card.Actions>
                     </Card>
                   ))
                 ) : (
                   <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>No sermons available</Text>
                     <Button 
                       mode="outlined" 
                       onPress={() => router.push('/(tabs)/sermons')}
                       textColor={theme.colors.primary}
                       style={styles.retryButton}
                     >
                       Browse All Sermons
                     </Button>
                   </View>
                 )}
               </View>
            </View>

            <View style={styles.contentColumn}>
              <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Latest Articles</Text>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => router.push('/(tabs)/articles')}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="more-horiz" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                
                {articlesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
                      Loading articles...
                    </Text>
                  </View>
                ) : articlesError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{articlesError}</Text>
                    <Button 
                      mode="outlined" 
                      onPress={() => {
                        setArticlesError(null);
                        // Retry fetch
                        const fetchArticles = async () => {
                          try {
                            setArticlesLoading(true);
                            const response = await ContentService.getArticles({ 
                              limit: 3, 
                              sortBy: 'date', 
                              sortOrder: 'desc',
                              published: true 
                            });
                            setArticles(response.data || []);
                          } catch (err) {
                            setArticlesError('Failed to load articles');
                          } finally {
                            setArticlesLoading(false);
                          }
                        };
                        fetchArticles();
                      }}
                      textColor={theme.colors.primary}
                      style={styles.retryButton}
                    >
                      Retry
                    </Button>
                  </View>
                ) : articles.length > 0 ? (
                  articles.map((article, index) => (
                    <Card key={article.id} style={[styles.card, { marginBottom: index < articles.length - 1 ? theme.spacing.md : 0 }]}>
                      <View style={styles.cardImageContainer}>
                        <Card.Cover 
                          source={{ 
                            uri: article.thumbnail_url || 'https://via.placeholder.com/300x200' 
                          }} 
                        />
                        <View style={styles.shareButtonOverlay}>
                          <QuickShareButton
                            type="article"
                            id={article.id}
                            title={article.title}
                            author={article.author}
                            date={formatArticleDate(article.published_at)}
                            size={20}
                            onShare={(result) => {
                              console.log('Article shared:', result);
                            }}
                          />
                        </View>
                      </View>
                      <Card.Content>
                        <Text variant="titleMedium">{article.title}</Text>
                        <Text variant="bodyMedium">{article.author}</Text>
                        <Text variant="bodySmall">
                          {formatArticleDate(article.published_at)}
                        </Text>
                        {article.excerpt && (
                          <Text variant="bodySmall" style={{ marginTop: theme.spacing.xs, color: theme.colors.textSecondary }}>
                            {article.excerpt.length > 100 ? `${article.excerpt.substring(0, 100)}...` : article.excerpt}
                          </Text>
                        )}
                      </Card.Content>
                      <Card.Actions>
                        <Button 
                          mode="contained" 
                          onPress={() => router.push(`/article/${article.id}`)}
                          buttonColor={theme.colors.primary}
                          textColor="#FFFFFF"
                          icon={() => <MaterialIcons name="read-more" size={20} color="white" />}
                        >
                          Read More
                        </Button>
                        <Button 
                          mode="outlined" 
                          onPress={() => router.push('/(tabs)/articles')}
                          textColor={theme.colors.primary}
                          icon={() => <MaterialIcons name="bookmark" size={20} color={theme.colors.primary} />}
                        >
                          Save
                        </Button>
                      </Card.Actions>
                    </Card>
                  ))
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No articles available</Text>
                    <Button 
                      mode="outlined" 
                      onPress={() => router.push('/(tabs)/articles')}
                      textColor={theme.colors.primary}
                      style={styles.retryButton}
                    >
                      Browse All Articles
                    </Button>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Deep Linking Demo Section */}
          <DeepLinkDemo />
        </ScrollView>

        <ProfileModal
          visible={showProfileModal}
          onDismiss={() => setShowProfileModal(false)}
          onSignOut={() => {
            setShowProfileModal(false);
            router.replace('/auth');
          }}
        />
      </View>
    </ContentGuard>
  );
}
