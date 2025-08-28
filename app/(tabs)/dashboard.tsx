import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, Dimensions, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Avatar, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentGuard } from '@/components/auth/ContentGuard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import ProfileModal from '@/components/ui/ProfileModal';
import { DeepLinkDemo } from '@/components/ui/DeepLinkDemo';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Responsive breakpoints
  const isTablet = screenWidth >= 768;
  const isLargeScreen = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: isTablet ? theme.spacing.lg : theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: isLargeScreen ? 36 : isTablet ? 32 : isSmallScreen ? 24 : 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: isLargeScreen ? 18 : isTablet ? 17 : isSmallScreen ? 14 : 16,
      color: theme.colors.textSecondary,
    },
    actionButtons: {
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: isTablet ? theme.spacing.md : theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    actionButton: {
      flex: isTablet ? 1 : undefined,
      minWidth: isTablet ? 200 : 150,
      marginBottom: isTablet ? 0 : theme.spacing.sm,
    },
    featuredSection: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: isLargeScreen ? 24 : isTablet ? 22 : 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    card: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    headerContainer: {
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isTablet ? 'center' : 'flex-start',
      marginBottom: theme.spacing.sm,
      gap: isTablet ? 0 : theme.spacing.md,
    },
    headerContent: {
      flex: isTablet ? 1 : undefined,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    contentGrid: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: isTablet ? theme.spacing.lg : theme.spacing.md,
    },
    contentColumn: {
      flex: isTablet ? 1 : undefined,
    },
  });

  return (
    <ContentGuard requireAuth={true} fallbackMessage="Sign in to access your personalized dashboard">
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Welcome to TRUEVINE</Text>
                <Text style={styles.subtitle}>Fellowship Church</Text>
              </View>
              <View style={styles.headerActions}>
                <Button 
                  icon={isDark ? "weather-night" : "weather-sunny"} 
                  mode="contained-tonal"
                  onPress={toggleTheme}
                >
                  {isDark ? "Dark" : "Light"}
                </Button>
                <Avatar.Image
                  size={isTablet ? 50 : 40}
                  source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/40' }}
                  style={{ borderWidth: 2, borderColor: theme.colors.primary }}
                  onTouchEnd={() => setShowProfileModal(true)}
                />
              </View>
            </View>
          </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="headphones" size={24} color="white" />}
            onPress={() => router.push('/(tabs)/sermons')}
          >
            Listen to Sermons
          </Button>
          <Button
            mode="outlined"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="article" size={24} color={theme.colors.primary} />}
            onPress={() => router.push('/(tabs)/articles')}
          >
            Read Articles
          </Button>
          <Button
            mode="outlined"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="language" size={24} color={theme.colors.primary} />}
            onPress={() => Linking.openURL('https://truevinefellowship.org')}
          >
            Visit Website
          </Button>
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.contentColumn}>
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured Sermon</Text>
              <Card style={styles.card}>
                <Card.Cover source={{ uri: 'https://via.placeholder.com/300x200' }} />
                <Card.Content>
                  <Text variant="titleMedium">Sunday Service - Faith & Grace</Text>
                  <Text variant="bodyMedium">Pastor Johnson</Text>
                  <Text variant="bodySmall">45 minutes • 2 days ago</Text>
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained" onPress={() => router.push('/(tabs)/sermons')}>Play</Button>
                  <Button mode="outlined" onPress={() => router.push('/(tabs)/sermons')}>Download</Button>
                </Card.Actions>
              </Card>
            </View>
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Latest Articles</Text>
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium">Walking in Faith</Text>
                  <Text variant="bodyMedium">A reflection on daily spiritual practices</Text>
                  <Text variant="bodySmall">By Sarah Wilson • 1 week ago</Text>
                </Card.Content>
                <Card.Actions>
                  <Button mode="outlined" onPress={() => router.push('/(tabs)/articles')}>Read More</Button>
                </Card.Actions>
              </Card>
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
