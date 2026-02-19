import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { invitationService, AppInvitation } from '@/lib/services/invitationService';
import { MaterialIcons } from '@expo/vector-icons';

interface InvitationLandingProps {
  invitationCode: string;
  onInvitationLoaded?: (invitation: AppInvitation) => void;
  onInvitationError?: (error: string) => void;
}

export default function InvitationLanding({
  invitationCode,
  onInvitationLoaded,
  onInvitationError,
}: InvitationLandingProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const [invitation, setInvitation] = useState<AppInvitation | null>(null);
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
    invitationCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    invitationContent: {
      padding: theme.spacing.lg,
    },
    inviterInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    inviterAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    inviterAvatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    inviterDetails: {
      flex: 1,
    },
    inviterName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    inviterEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    invitationMessage: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
      fontStyle: 'italic',
    },
    invitationCode: {
      fontSize: 14,
      color: theme.colors.primary,
      fontFamily: 'monospace',
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    featuresCard: {
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.lg,
    },
    featuresContent: {
      padding: theme.spacing.lg,
    },
    featuresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    featureIcon: {
      marginRight: theme.spacing.md,
    },
    featureText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    downloadSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    downloadTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    downloadButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    platformInfo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statusCard: {
      backgroundColor: theme.colors.warningContainer,
      borderColor: theme.colors.warning,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    statusContent: {
      padding: theme.spacing.md,
    },
    statusText: {
      fontSize: 14,
      color: theme.colors.warning,
      textAlign: 'center',
    },
    errorCard: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.error,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    errorContent: {
      padding: theme.spacing.md,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
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
  });

  useEffect(() => {
    loadInvitation();
  }, [invitationCode]);

  const loadInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      const invitationData = await invitationService.getInvitationByCode(invitationCode);
      
      if (!invitationData) {
        throw new Error('Invitation not found or has expired');
      }

      // Check if invitation has expired
      if (new Date() > invitationData.expiresAt) {
        throw new Error('This invitation has expired');
      }

      setInvitation(invitationData);
      
      // Track that the invitation was opened
      await invitationService.trackInvitationEvent(invitationCode, 'opened');
      
      if (onInvitationLoaded) {
        onInvitationLoaded(invitationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitation';
      setError(errorMessage);
      
      if (onInvitationError) {
        onInvitationError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadApp = async () => {
    if (!invitation) return;

    try {
      // Track that the download link was clicked
      await invitationService.trackInvitationEvent(invitationCode, 'clicked');
      
      // Open the download link
      const canOpen = await Linking.canOpenURL(invitation.downloadLink);
      if (canOpen) {
        await Linking.openURL(invitation.downloadLink);
      } else {
        Alert.alert('Error', 'Unable to open the download link. Please try again.');
      }
    } catch (error) {
      console.error('Error opening download link:', error);
      Alert.alert('Error', 'Unable to open the download link. Please try again.');
    }
  };

  const getInviterInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlatformDisplayName = (platform: string) => {
    switch (platform) {
      case 'ios':
        return 'iOS';
      case 'android':
        return 'Android';
      case 'web':
        return 'Web';
      case 'universal':
      default:
        return 'All Platforms';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>TVF</Text>
            </View>
            <Text style={styles.title}>TRUEVINE FELLOWSHIP</Text>
            <Text style={styles.subtitle}>Church App</Text>
          </View>

          <Card style={styles.errorCard}>
            <Card.Content style={styles.errorContent}>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => Linking.openURL('https://tvffellowship.com')}
            style={styles.downloadButton}
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
            icon="web"
          >
            Visit Our Website
          </Button>
        </ScrollView>
      </View>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TVF</Text>
          </View>
          <Text style={styles.title}>You're Invited!</Text>
          <Text style={styles.subtitle}>
            Join TRUEVINE FELLOWSHIP Church and connect with our community
          </Text>
        </View>

        {/* Invitation Details */}
        <Card style={styles.invitationCard}>
          <Card.Content style={styles.invitationContent}>
            <View style={styles.inviterInfo}>
              <View style={styles.inviterAvatar}>
                <Text style={styles.inviterAvatarText}>
                  {getInviterInitials(invitation.inviterName)}
                </Text>
              </View>
              <View style={styles.inviterDetails}>
                <Text style={styles.inviterName}>{invitation.inviterName}</Text>
                <Text style={styles.inviterEmail}>{invitation.inviterEmail}</Text>
              </View>
            </View>

            {invitation.message && (
              <Text style={styles.invitationMessage}>
                "{invitation.message}"
              </Text>
            )}

            <Text style={styles.invitationCode}>
              Invitation Code: {invitation.invitationCode}
            </Text>

            <Chip
              icon="smartphone"
              style={{ alignSelf: 'center' }}
              textStyle={{ color: theme.colors.primary }}
            >
              {getPlatformDisplayName(invitation.platform)}
            </Chip>
          </Card.Content>
        </Card>

        {/* App Features */}
        <Card style={styles.featuresCard}>
          <Card.Content style={styles.featuresContent}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            
            <View style={styles.featureItem}>
              <MaterialIcons
                name="music-note"
                size={24}
                color={theme.colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Access to sermons and teachings</Text>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons
                name="article"
                size={24}
                color={theme.colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Inspirational articles and devotionals</Text>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons
                name="notifications"
                size={24}
                color={theme.colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Church updates and notifications</Text>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons
                name="people"
                size={24}
                color={theme.colors.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Connect with the church community</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Download Section */}
        <View style={styles.downloadSection}>
          <Text style={styles.downloadTitle}>Download the App</Text>
          
          <Button
            mode="contained"
            onPress={handleDownloadApp}
            style={styles.downloadButton}
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
            icon="download"
          >
            Download Now
          </Button>
          
          <Text style={styles.platformInfo}>
            Available for {getPlatformDisplayName(invitation.platform)}
          </Text>
        </View>

        {/* Expiration Warning */}
        {new Date(invitation.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
          <Card style={styles.statusCard}>
            <Card.Content style={styles.statusContent}>
              <Text style={styles.statusText}>
                This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
