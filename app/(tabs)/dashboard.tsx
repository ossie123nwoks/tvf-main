import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Button, Avatar, useTheme as usePaperTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentGuard } from '@/components/auth/ContentGuard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileModal from '@/components/ui/ProfileModal';
import { ContentService } from '@/lib/supabase/content';
import { Sermon, Article } from '@/types/content';
import { QuickShareButton } from '@/components/ui/QuickShareButton';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';
import { useSavedContent } from '@/lib/hooks/useSavedContent';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Sermon filter state
  const [sermonFilter, setSermonFilter] = useState<'all' | 'this_week' | 'last_week' | 'last_2_months'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Article filter state
  const [articleFilter, setArticleFilter] = useState<'all' | 'this_week' | 'last_week' | 'last_2_months'>('all');
  const [showArticleFilterModal, setShowArticleFilterModal] = useState(false);

  // Offline downloads functionality
  const { 
    addDownload, 
    isAvailableOffline, 
    downloads,
    isLoading: downloadsLoading 
  } = useOfflineDownloads();

  // Saved content functionality
  const { 
    isContentSaved, 
    toggleSave, 
    isLoading: saveLoading 
  } = useSavedContent();
  
  const userInitials = React.useMemo(() => {
    const firstInitial = user?.firstName?.trim()?.charAt(0) || '';
    const lastInitial = user?.lastName?.trim()?.charAt(0) || '';

    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }

    if (firstInitial) return firstInitial.toUpperCase();
    if (lastInitial) return lastInitial.toUpperCase();

    const emailInitial = user?.email?.trim()?.charAt(0);
    return emailInitial ? emailInitial.toUpperCase() : 'U';
  }, [user?.firstName, user?.lastName, user?.email]);
  
  // State to track download status for each sermon
  const [sermonDownloadStatus, setSermonDownloadStatus] = useState<Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>>({});
  
  // Carousel state
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userInteractionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [carouselData, setCarouselData] = useState<Array<{
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    link_url?: string;
  }>>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);

  // Responsive breakpoints
  const isTablet = screenWidth >= 768;
  const isLargeScreen = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

  // Check download status for sermons
  const checkSermonDownloadStatus = async (sermons: Sermon[]) => {
    const statusMap: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};
    
    for (const sermon of sermons) {
      try {
        const isDownloaded = await isAvailableOffline(sermon.audio_url);
        statusMap[sermon.id] = isDownloaded ? 'downloaded' : 'idle';
      } catch (error) {
        console.error(`Failed to check download status for sermon ${sermon.id}:`, error);
        statusMap[sermon.id] = 'error';
      }
    }
    
    setSermonDownloadStatus(statusMap);
  };


  // Handle article save/unsave
  const handleArticleSave = async (article: Article) => {
    try {
      await toggleSave('article', article.id);
    } catch (error) {
      console.error('Failed to save/unsave article:', error);
      Alert.alert(
        'Error', 
        'Failed to save article. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle sermon save/unsave
  const handleSermonSave = async (sermon: Sermon) => {
    try {
      await toggleSave('sermon', sermon.id);
    } catch (error) {
      console.error('Failed to save/unsave sermon:', error);
      Alert.alert(
        'Error', 
        'Failed to save sermon. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle sermon download
  const handleSermonDownload = async (sermon: Sermon) => {
    try {
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'checking' }));
      
      // Check if already downloaded
      const isDownloaded = await isAvailableOffline(sermon.audio_url);
      if (isDownloaded) {
        setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloaded' }));
        Alert.alert(
          'Already Downloaded', 
          `${sermon.title} is already available offline. You can access it anytime without an internet connection.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'View Downloads', 
              style: 'default',
              onPress: () => {
                // You could navigate to a download manager here if needed
                console.log('Navigate to download manager');
              }
            }
          ]
        );
        return;
      }
      
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloading' }));
      
      // Add download
      await addDownload(
        'audio',
        sermon.title,
        sermon.audio_url,
        {
          contentId: sermon.id,
          preacher: sermon.preacher,
          date: sermon.date,
          duration: sermon.duration,
          thumbnail_url: sermon.thumbnail_url
        }
      );
      
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'downloaded' }));
      Alert.alert('Download Started', `${sermon.title} is now downloading. You can monitor progress in the Download Manager.`);
    } catch (error) {
      console.error('Failed to download sermon:', error);
      setSermonDownloadStatus(prev => ({ ...prev, [sermon.id]: 'error' }));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download sermon';
      Alert.alert(
        'Download Failed', 
        `${errorMessage}. Please check your internet connection and try again.`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            style: 'default',
            onPress: () => handleSermonDownload(sermon)
          }
        ]
      );
    }
  };

  // Fetch carousel images on component mount
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setCarouselLoading(true);
        const images = await ContentService.getCarouselImages();
        setCarouselData(images);
      } catch (error) {
        console.error('Failed to fetch carousel images:', error);
        // Fallback to default images if fetch fails
        setCarouselData([
          {
            id: '1',
            image_url: require('@/assets/tvf-home.png'),
          },
          {
            id: '2',
            image_url: require('@/assets/tvf-outreach.png'),
          },
          {
            id: '3',
            image_url: require('@/assets/splash-image.png'),
          },
        ]);
      } finally {
        setCarouselLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  // Fetch sermons and articles on component mount
  useEffect(() => {
    const fetchSermons = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ContentService.getSermons({ 
          limit: 20, // Fetch more sermons to allow filtering
          sortBy: 'date', 
          sortOrder: 'desc',
          published: true 
        });
        const sermonsData = response.data || [];
        setSermons(sermonsData);
        
        // Check download status for each sermon
        await checkSermonDownloadStatus(sermonsData);
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
          limit: 20, // Fetch more articles to allow filtering
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

  // Auto-scroll carousel (pauses when user is scrolling)
  useEffect(() => {
    if (carouselData.length === 0 || isUserScrolling) {
      // Clear any existing interval when no data or user is scrolling
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentCarouselIndex((prevIndex) => 
        prevIndex === carouselData.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change slide every 4 seconds

    autoScrollTimerRef.current = interval;

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [carouselData.length, isUserScrolling]);

  // Scroll to current index
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollToIndex({
        index: currentCarouselIndex,
        animated: true,
      });
    }
  }, [currentCarouselIndex]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimerRef.current) {
        clearTimeout(userInteractionTimerRef.current);
      }
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, []);

  // Monitor download progress and update UI
  useEffect(() => {
    if (sermons.length === 0) return;

    const updateDownloadStatus = () => {
      setSermonDownloadStatus(prevStatus => {
        const updatedStatus: Record<string, 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'> = {};
        
        sermons.forEach(sermon => {
          const currentStatus = prevStatus[sermon.id] || 'idle';
          const downloadItem = downloads.find(d => d.metadata?.contentId === sermon.id);
          
          if (downloadItem) {
            switch (downloadItem.status) {
              case 'downloading':
                updatedStatus[sermon.id] = 'downloading';
                break;
              case 'completed':
                updatedStatus[sermon.id] = 'downloaded';
                break;
              case 'failed':
                updatedStatus[sermon.id] = 'error';
                break;
              case 'paused':
                updatedStatus[sermon.id] = 'downloading'; // Show as downloading for paused
                break;
              default:
                updatedStatus[sermon.id] = currentStatus;
            }
          } else {
            updatedStatus[sermon.id] = currentStatus;
          }
        });
        
        return updatedStatus;
      });
    };

    updateDownloadStatus();
  }, [downloads, sermons]);

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

  // Filter sermons based on selected time period
  const filterSermonsByDate = (sermons: Sermon[], filter: string): Sermon[] => {
    if (filter === 'all') return sermons;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sermons.filter(sermon => {
      const sermonDate = new Date(sermon.date);
      const diffTime = today.getTime() - sermonDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filter) {
        case 'this_week':
          return diffDays <= 7;
        case 'last_week':
          return diffDays > 7 && diffDays <= 14;
        case 'last_2_months':
          return diffDays <= 60;
        default:
          return true;
      }
    });
  };

  // Get filter display text
  const getFilterDisplayText = (filter: string): string => {
    switch (filter) {
      case 'all':
        return 'All Time';
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'last_2_months':
        return 'Last 2 Months';
      default:
        return 'All Time';
    }
  };

  // Filter articles based on selected time period
  const filterArticlesByDate = (articles: Article[], filter: string): Article[] => {
    if (filter === 'all') return articles;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return articles.filter(article => {
      const articleDate = new Date(article.published_at);
      const diffTime = today.getTime() - articleDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filter) {
        case 'this_week':
          return diffDays <= 7;
        case 'last_week':
          return diffDays > 7 && diffDays <= 14;
        case 'last_2_months':
          return diffDays <= 60;
        default:
          return true;
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    // Hero Section - Carousel
    heroSection: {
      height: 250,
      marginHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      ...theme.shadows.medium,
    },
    carouselContainer: {
      flex: 1,
    },
    carouselItem: {
      width: screenWidth - (theme.spacing.sm * 2),
      height: 250,
      position: 'relative',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },
    gradientTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: theme.colors.primary,
      opacity: 0.1,
    },
    gradientMiddle: {
      position: 'absolute',
      top: '25%',
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: theme.colors.primary,
      opacity: 0.15,
    },
    gradientBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: theme.colors.secondary || theme.colors.primary,
      opacity: 0.2,
    },
    carouselImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      zIndex: 1,
    },
    carouselIndicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
    },
    indicatorActive: {
      backgroundColor: theme.colors.primary,
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
    // Header with actions - paddingTop and marginTop will be set dynamically
    headerBase: {
      paddingBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      marginBottom: theme.spacing.md,
      borderTopWidth: 0,
      ...theme.shadows.small,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    headerContent: {
      flex: 1,
      alignItems: 'flex-start',
    },
    customImage: {
      width: isLargeScreen ? 48 : isTablet ? 44 : 40,
      height: isLargeScreen ? 48 : isTablet ? 44 : 40,
      borderRadius: isLargeScreen ? 24 : isTablet ? 22 : 20,
      marginRight: theme.spacing.md,
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
    cardContent: {
      paddingTop: theme.spacing.md,
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
     // Filter Modal Styles
     modalOverlay: {
       flex: 1,
       backgroundColor: 'rgba(0, 0, 0, 0.5)',
       justifyContent: 'center',
       alignItems: 'center',
       padding: theme.spacing.lg,
     },
     modalContent: {
       backgroundColor: theme.colors.cardBackground,
       borderRadius: theme.borderRadius.lg,
       width: '100%',
       maxWidth: 400,
       maxHeight: '80%',
       ...theme.shadows.large,
     },
     modalHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       padding: theme.spacing.lg,
       borderBottomWidth: 1,
       borderBottomColor: theme.colors.border,
     },
     modalTitle: {
       fontSize: 20,
       fontWeight: '600',
       color: theme.colors.text,
     },
     closeButton: {
       padding: theme.spacing.xs,
     },
     filterOptions: {
       padding: theme.spacing.md,
     },
     filterOption: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       padding: theme.spacing.md,
       borderRadius: theme.borderRadius.md,
       marginBottom: theme.spacing.xs,
       backgroundColor: theme.colors.background,
       borderWidth: 1,
       borderColor: theme.colors.border,
     },
     filterOptionSelected: {
       backgroundColor: theme.colors.primary + '10',
       borderColor: theme.colors.primary,
     },
     filterOptionText: {
       fontSize: 16,
       color: theme.colors.text,
       fontWeight: '500',
     },
     filterOptionTextSelected: {
       color: theme.colors.primary,
       fontWeight: '600',
     },
    // Icon button styles
    iconButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'transparent',
    },
    adminButton: {
      marginHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.error + '20',
      borderRadius: theme.borderRadius.md,
    },
    themeButton: {
      marginHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.md,
    },
    // Modal styles
    modalCard: {
      margin: 20,
      maxWidth: 400,
      alignSelf: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      marginHorizontal: 8,
    },
  });

  // Dynamic header style with safe area insets
  const headerStyle = {
    ...styles.headerBase,
    paddingTop: Platform.select({
      ios: Math.max(insets.top, theme.spacing.lg) + theme.spacing.sm,
      android: theme.spacing.lg + theme.spacing.sm,
    }),
    marginTop: Platform.select({
      ios: 0,
      android: theme.spacing.xs,
    }),
  };

  return (
    <>
      <ContentGuard
        requireAuth={true}
        requireVerification={true}
        fallbackMessage="Sign in to access your personalized dashboard"
      >
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            {/* Header with actions - moved above hero section */}
            <View style={headerStyle}>
              <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                  <Image
                    source={require('@/assets/home-icon.png')}
                    style={styles.customImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.headerActions}>
                  <IconButton
                    icon={isDark ? 'weather-night' : 'weather-sunny'}
                    size={24}
                    iconColor={theme.colors.primary}
                    onPress={toggleTheme}
                    style={styles.themeButton}
                  />
                  {user?.role === 'admin' && (
                    <IconButton
                      icon="shield"
                      size={24}
                      iconColor={theme.colors.error}
                      style={styles.adminButton}
                      onPress={() => router.push('/admin')}
                    />
                  )}
                  <Avatar.Text
                    size={isTablet ? 50 : 40}
                    label={userInitials}
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      borderWidth: 2,
                      borderColor: theme.colors.primary,
                    }}
                    labelStyle={{ color: '#FFFFFF', fontSize: isTablet ? 20 : 16, fontWeight: 'bold' }}
                    onTouchEnd={() => setShowProfileModal(true)}
                  />
                </View>
              </View>
            </View>

            {/* Hero Section - Image Carousel */}
            {carouselLoading ? (
              <View style={[styles.heroSection, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : carouselData.length > 0 ? (
              <>
            <View style={styles.heroSection}>
              <FlatList
                ref={carouselRef}
                data={carouselData}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                getItemLayout={(data, index) => ({
                  length: screenWidth - (theme.spacing.sm * 2),
                  offset: (screenWidth - (theme.spacing.sm * 2)) * index,
                  index,
                })}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    carouselRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
                onScrollBeginDrag={() => {
                  // User started touching/dragging - pause auto-scroll
                  setIsUserScrolling(true);
                  
                  // Clear any existing timer
                  if (userInteractionTimerRef.current) {
                    clearTimeout(userInteractionTimerRef.current);
                    userInteractionTimerRef.current = null;
                  }
                }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / (screenWidth - theme.spacing.sm * 2)
                  );
                  setCurrentCarouselIndex(index);
                  
                  // Clear any existing timer
                  if (userInteractionTimerRef.current) {
                    clearTimeout(userInteractionTimerRef.current);
                  }
                  
                  // Resume auto-scroll after 3 seconds of no user interaction
                  userInteractionTimerRef.current = setTimeout(() => {
                    setIsUserScrolling(false);
                  }, 3000);
                }}
                    renderItem={({ item }) => {
                      // Check if image_url is a local require or a URL string
                      const imageSource = typeof item.image_url === 'string' && item.image_url.startsWith('http')
                        ? { uri: item.image_url }
                        : item.image_url;
                      
                      return (
                        <TouchableOpacity
                          style={styles.carouselItem}
                          activeOpacity={item.link_url ? 0.8 : 1}
                          onPress={() => {
                            if (item.link_url) {
                              Linking.openURL(item.link_url);
                            }
                          }}
                        >
                          {/* Gradient Background Overlay */}
                          <View style={styles.gradientBackground}>
                            <View style={styles.gradientTop} />
                            <View style={styles.gradientMiddle} />
                            <View style={styles.gradientBottom} />
                          </View>
                          {/* Image */}
                    <Image
                            source={imageSource}
                      style={styles.carouselImage}
                            resizeMode="contain"
                    />
                        </TouchableOpacity>
                      );
                    }}
              />
            </View>
            
            {/* Carousel Indicators */}
            <View style={styles.carouselIndicators}>
              {carouselData.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentCarouselIndex && styles.indicatorActive
                  ]}
                  onPress={() => {
                    setCurrentCarouselIndex(index);
                    carouselRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                />
              ))}
            </View>
              </>
            ) : null}

                       <View style={styles.actionButtons}>
               <TouchableOpacity 
                 style={[styles.actionButton, styles.actionButtonPrimary]}
                 onPress={() => router.push('/(tabs)/sermons')}
                 activeOpacity={0.8}
               >
                <MaterialIcons name="play-circle-filled" size={26} color="white" />
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
                <MaterialIcons name="article" size={26} color="#0369A1" />
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
                 onPress={() => Linking.openURL('https://truevinefellowship.online')}
                 activeOpacity={0.8}
               >
                <MaterialIcons name="language" size={26} color="#BE185D" />
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
                       onPress={() => setShowFilterModal(true)}
                       activeOpacity={0.7}
                     >
                       <MaterialIcons name="tune" size={20} color={theme.colors.primary} />
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
                     filterSermonsByDate(sermons, sermonFilter).slice(0, 3).map((sermon, index) => (
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
                         <Card.Content style={styles.cardContent}>
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
                            onPress={() => handleSermonDownload(sermon)}
                            textColor={theme.colors.primary}
                            disabled={sermonDownloadStatus[sermon.id] === 'downloading' || sermonDownloadStatus[sermon.id] === 'checking'}
                            icon={() => {
                              const status = sermonDownloadStatus[sermon.id] || 'idle';
                              switch (status) {
                                case 'downloading':
                                  return <ActivityIndicator size={20} color={theme.colors.primary} />;
                                case 'downloaded':
                                  return <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />;
                                case 'checking':
                                  return <ActivityIndicator size={20} color={theme.colors.primary} />;
                                case 'error':
                                  return <MaterialIcons name="error" size={20} color={theme.colors.error} />;
                                default:
                                  return <MaterialIcons name="download" size={20} color={theme.colors.primary} />;
                              }
                            }}
                          >
                            {(() => {
                              const status = sermonDownloadStatus[sermon.id] || 'idle';
                              switch (status) {
                                case 'downloading':
                                  return 'Downloading...';
                                case 'downloaded':
                                  return 'Downloaded';
                                case 'checking':
                                  return 'Checking...';
                                case 'error':
                                  return 'Retry';
                                default:
                                  return 'Download';
                              }
                            })()}
                          </Button>
                          <TouchableOpacity
                            onPress={() => handleSermonSave(sermon)}
                            disabled={saveLoading}
                            style={styles.iconButton}
                          >
                            <MaterialIcons 
                              name={isContentSaved('sermon', sermon.id) ? "bookmark" : "bookmark-border"} 
                              size={24} 
                              color={theme.colors.primary} 
                            />
                          </TouchableOpacity>
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
                      onPress={() => setShowArticleFilterModal(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="tune" size={20} color={theme.colors.primary} />
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
                    filterArticlesByDate(articles, articleFilter).slice(0, 3).map((article, index) => (
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
                        <Card.Content style={styles.cardContent}>
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
                          <TouchableOpacity
                            onPress={() => handleArticleSave(article)}
                            disabled={saveLoading}
                            style={styles.iconButton}
                          >
                            <MaterialIcons 
                              name={isContentSaved('article', article.id) ? "bookmark" : "bookmark-border"} 
                              size={24} 
                              color={theme.colors.primary} 
                            />
                          </TouchableOpacity>
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
          </ScrollView>
        </View>
      </ContentGuard>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Sermons</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Time' },
                { key: 'this_week', label: 'This Week' },
                { key: 'last_week', label: 'Last Week' },
                { key: 'last_2_months', label: 'Last 2 Months' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    sermonFilter === option.key && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    setSermonFilter(option.key as any);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    sermonFilter === option.key && styles.filterOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {sermonFilter === option.key && (
                    <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Article Filter Modal */}
      <Modal
        visible={showArticleFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowArticleFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Articles</Text>
              <TouchableOpacity
                onPress={() => setShowArticleFilterModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All Time' },
                { key: 'this_week', label: 'This Week' },
                { key: 'last_week', label: 'Last Week' },
                { key: 'last_2_months', label: 'Last 2 Months' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    articleFilter === option.key && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    setArticleFilter(option.key as any);
                    setShowArticleFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    articleFilter === option.key && styles.filterOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {articleFilter === option.key && (
                    <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ProfileModal outside of ContentGuard to prevent theme context issues */}
      <ProfileModal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
        onSignOut={() => {
          setShowProfileModal(false);
          router.replace('/auth');
        }}
      />

    </>
  );
}
