import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  List,
  Divider,
  Dialog,
  Portal,
  TextInput,
  Switch,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserProfileUpdate, ChangePasswordRequest } from '@/types/user';
import { useRouter, useFocusEffect } from 'expo-router';
import { SessionStatus } from '@/components/auth/SessionStatus';
import { useSavedContent } from '@/lib/hooks/useSavedContent';
import { useOfflineDownloads } from '@/lib/storage/useOfflineDownloads';

export default function Profile() {
  const { theme, isDark, setTheme } = useTheme();
  const { user, signOut, updateProfile, changePassword, deleteAccount, loading } = useAuth();
  const router = useRouter();
  const { savedContent, isLoading: savedContentLoading, unsaveContent, refreshSavedContent } = useSavedContent();
  const { downloads, storageInfo, cleanupDownloads } = useOfflineDownloads();

  // Refresh saved content when component mounts or when navigating back
  useFocusEffect(
    React.useCallback(() => {
      refreshSavedContent();
    }, [refreshSavedContent])
  );

  // Helper function to check if avatar URL is a default Google avatar (to avoid logo conflicts)
  const isGoogleDefaultAvatar = (url?: string): boolean => {
    if (!url) return false;

    try {
      // Check if it's a Google avatar URL
      if (url.includes('googleusercontent.com') || url.includes('google.com')) {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();

        // Google default avatars have these patterns that include logo overlay:
        // - Contains '/default' in path
        // - Contains '/photo.jpg' (generic default)
        // - Has query parameters like '=s96-c' where 'c' indicates default
        // - Path contains hash-like segments that indicate default avatar
        const isDefault =
          pathname.includes('/default') ||
          pathname.includes('/photo.jpg') ||
          pathname.match(/\/a\/default-/i) ||
          url.match(/=s\d+-c\b/i) || // Pattern like =s96-c indicates default
          url.match(/\/photo\/default/);

        return !!isDefault;
      }

      return false;
    } catch (error) {
      // If URL parsing fails, check for default patterns directly in the URL string
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('/default') ||
        lowerUrl.includes('/photo.jpg') ||
        lowerUrl.match(/=s\d+-c\b/i) !== null ||
        lowerUrl.match(/\/photo\/default/) !== null;
    }
  };

  // Helper function to get the avatar source (either cleaned URL or undefined for fallback)
  const getAvatarSource = (url?: string): string | undefined => {
    if (!url) return undefined;

    // Only replace default Google avatars with initials to avoid Google logo overlay conflicts
    // Custom Google avatars should display normally
    if (isGoogleDefaultAvatar(url)) {
      return undefined; // Return undefined to use initials fallback for default avatars
    }

    // For all other avatars (including custom Google avatars), return the URL as-is
    return url;
  };

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileUpdate>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarUrl: user?.avatarUrl || '',
    preferences: {
      theme: user?.preferences?.theme || 'auto',
      notifications: {
        newContent: user?.preferences?.notifications?.newContent || true,
        reminders: user?.preferences?.notifications?.reminders || true,
        updates: user?.preferences?.notifications?.updates || true,
        marketing: user?.preferences?.notifications?.marketing || false,
      },
      audioQuality: user?.preferences?.audioQuality || 'medium',
      autoDownload: user?.preferences?.autoDownload || false,
      language: user?.preferences?.language || 'en',
    },
  });

  // State for password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for delete account confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // State for clear all bookmarks dialog
  const [showClearBookmarksDialog, setShowClearBookmarksDialog] = useState(false);

  // State for privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showEmail: false,
    activityTracking: true,
  });


  // Calculate saved content stats - use useMemo to ensure reactivity
  const savedSermons = React.useMemo(() => {
    if (!savedContent || !Array.isArray(savedContent) || savedContent.length === 0) return [];
    return savedContent.filter(item => item && item.content && 'duration' in item.content);
  }, [savedContent]);

  const savedArticles = React.useMemo(() => {
    if (!savedContent || !Array.isArray(savedContent) || savedContent.length === 0) return [];
    return savedContent.filter(item => item && item.content && 'excerpt' in item.content);
  }, [savedContent]);

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
    avatar: {
      marginBottom: theme.spacing.md,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    memberSince: {
      fontSize: 14,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    // Card styling - matches design system
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.small,
    },
    cardContent: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    // Form inputs - matches design system
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
    },
    // Row layouts
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    rowText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    rowSubtext: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginTop: theme.spacing.xs,
    },
    // Switch containers
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    switchText: {
      color: theme.colors.text,
      fontSize: 16,
      flex: 1,
      marginRight: theme.spacing.md,
    },
    // Buttons - matches design system
    button: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    dangerButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    // Dialog inputs
    passwordInput: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
    },
    deleteInput: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
    },
    // Action buttons row
    actionButtons: {
      flexDirection: 'column',
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    actionButton: {
      width: '100%',
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    // Stats container
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      handleSaveProfile();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editData);
      if ('code' in result) {
        Alert.alert('Error', result.message);
      } else {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatarUrl: user?.avatarUrl || '',
      preferences: {
        theme: user?.preferences?.theme || 'auto',
        notifications: {
          newContent: user?.preferences?.notifications?.newContent || true,
          reminders: user?.preferences?.notifications?.reminders || true,
          updates: user?.preferences?.notifications?.updates || true,
          marketing: user?.preferences?.notifications?.marketing || false,
        },
        audioQuality: user?.preferences?.audioQuality || 'medium',
        autoDownload: user?.preferences?.autoDownload || false,
        language: user?.preferences?.language || 'en',
      },
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    try {
      const result = await changePassword(passwordData);
      if ('code' in result) {
        Alert.alert('Error', result.message);
      } else {
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
        setConfirmPassword('');
        Alert.alert('Success', 'Password changed successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for deleting your account');
      return;
    }

    try {
      const result = await deleteAccount({ password: '', reason: deleteReason });
      if (result.success) {
        Alert.alert('Account Deleted', 'Your account has been successfully deleted');
        router.replace('/auth');
      } else {
        Alert.alert('Error', result.error || 'Failed to delete account');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleClearAllBookmarks = async () => {
    try {
      // Remove all saved content
      for (const item of savedContent) {
        const contentType = 'duration' in item.content ? 'sermon' : 'article';
        await unsaveContent(contentType, item.content.id);
      }
      setShowClearBookmarksDialog(false);
      Alert.alert('Success', 'All bookmarks have been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear bookmarks. Please try again.');
    }
  };

  const handleClearDownloads = async () => {
    Alert.alert(
      'Clear Downloads',
      'Are you sure you want to clear all downloaded content? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cleanupDownloads();
              Alert.alert('Success', 'All downloads have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear downloads. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };


  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section - matches design system */}
        <View style={styles.heroSection}>
          {(() => {
            const avatarSource = getAvatarSource(user?.avatarUrl);
            return avatarSource ? (
              <Avatar.Image
                size={80}
                source={{ uri: avatarSource }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                labelStyle={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' }}
              />
            );
          })()}
          <Text style={styles.heroTitle}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.heroSubtitle}>{user.email}</Text>
          <Text style={styles.memberSince}>
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Profile Information */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Profile Information</Text>

              {isEditing ? (
                <>
                  <TextInput
                    label="First Name"
                    value={editData.firstName}
                    onChangeText={value => setEditData(prev => ({ ...prev, firstName: value }))}
                    style={styles.input}
                    mode="outlined"
                  />
                  <TextInput
                    label="Last Name"
                    value={editData.lastName}
                    onChangeText={value => setEditData(prev => ({ ...prev, lastName: value }))}
                    style={styles.input}
                    mode="outlined"
                  />
                  <TextInput
                    label="Avatar URL (optional)"
                    value={editData.avatarUrl}
                    onChangeText={value => setEditData(prev => ({ ...prev, avatarUrl: value }))}
                    style={styles.input}
                    mode="outlined"
                    placeholder="https://example.com/avatar.jpg"
                  />

                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <Button
                      mode="contained"
                      onPress={handleSaveProfile}
                      loading={loading}
                      style={[styles.actionButton, styles.primaryButton]}
                      buttonColor={theme.colors.primary}
                      textColor="#FFFFFF"
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleCancelEdit}
                      style={[styles.actionButton, styles.secondaryButton]}
                      textColor={theme.colors.primary}
                    >
                      Cancel
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>First Name</Text>
                    <Text style={styles.rowSubtext}>{user.firstName}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Last Name</Text>
                    <Text style={styles.rowSubtext}>{user.lastName}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Email</Text>
                    <Text style={styles.rowSubtext}>{user.email}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Role</Text>
                    <Text style={styles.rowSubtext}>{user.role}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Email Verified</Text>
                    <Text style={styles.rowSubtext}>{user.isEmailVerified ? 'Yes' : 'No'}</Text>
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => setIsEditing(true)}
                    style={styles.primaryButton}
                    buttonColor={theme.colors.primary}
                    textColor="#FFFFFF"
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Preferences */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Quick Preferences</Text>

              <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                Quick access to commonly used settings. For more options, see the sections below.
              </Text>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Dark Theme</Text>
                <Switch
                  value={isDark}
                  onValueChange={value => {
                    setTheme(value);
                    setEditData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        theme: value ? 'dark' : 'light',
                      },
                    }));
                  }}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Saved Content */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Saved Content</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{savedSermons.length}</Text>
                  <Text style={styles.statLabel}>Saved Sermons</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{savedArticles.length}</Text>
                  <Text style={styles.statLabel}>Saved Articles</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{savedContent.length}</Text>
                  <Text style={styles.statLabel}>Total Saved</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => router.push('/saved/sermons')}
                  style={[styles.actionButton, styles.primaryButton]}
                  icon="bookmark"
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                >
                  View Saved Sermons
                </Button>
                <Button
                  mode="contained"
                  onPress={() => router.push('/saved/articles')}
                  style={[styles.actionButton, styles.primaryButton]}
                  icon="bookmark-outline"
                  buttonColor={theme.colors.primary}
                  textColor="#FFFFFF"
                >
                  View Saved Articles
                </Button>
              </View>

              {savedContent.length > 0 && (
                <Button
                  mode="outlined"
                  onPress={() => setShowClearBookmarksDialog(true)}
                  style={[styles.secondaryButton, { marginTop: theme.spacing.md }]}
                  textColor={theme.colors.error}
                  icon="delete-outline"
                >
                  Clear All Bookmarks
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Privacy Settings */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Privacy Settings</Text>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Profile Visibility</Text>
                <Switch
                  value={privacySettings.profileVisible}
                  onValueChange={value =>
                    setPrivacySettings(prev => ({ ...prev, profileVisible: value }))
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Show Email in Profile</Text>
                <Switch
                  value={privacySettings.showEmail}
                  onValueChange={value =>
                    setPrivacySettings(prev => ({ ...prev, showEmail: value }))
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Activity Tracking</Text>
                <Switch
                  value={privacySettings.activityTracking}
                  onValueChange={value =>
                    setPrivacySettings(prev => ({ ...prev, activityTracking: value }))
                  }
                />
              </View>
            </Card.Content>
          </Card>

          {/* Download Management */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Download Management</Text>

              <View style={styles.row}>
                <Text style={styles.rowText}>Total Downloads</Text>
                <Text style={styles.rowSubtext}>{downloads.length}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowText}>Storage Used</Text>
                <Text style={styles.rowSubtext}>{formatStorageSize(storageInfo.usedSpace)}</Text>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Auto Download</Text>
                <Switch
                  value={user.preferences?.autoDownload || false}
                  onValueChange={value =>
                    setEditData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        autoDownload: value,
                      },
                    }))
                  }
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.rowText}>Audio Quality</Text>
                <Text style={styles.rowSubtext}>
                  {user.preferences?.audioQuality || 'medium'}
                </Text>
              </View>

              {downloads.length > 0 && (
                <Button
                  mode="outlined"
                  onPress={handleClearDownloads}
                  style={styles.secondaryButton}
                  textColor={theme.colors.error}
                  icon="delete-outline"
                >
                  Clear All Downloads
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Notifications Management */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Notifications</Text>

              <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                Manage your notification history and preferences
              </Text>

              <Button
                mode="contained"
                onPress={() => router.push('/notifications')}
                style={styles.primaryButton}
                icon="bell"
                buttonColor={theme.colors.primary}
                textColor="#FFFFFF"
              >
                Open Notifications
              </Button>
            </Card.Content>
          </Card>

          {/* App Appearance Settings */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>App Appearance</Text>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Dark Theme</Text>
                <Switch
                  value={isDark}
                  onValueChange={value => {
                    setTheme(value);
                    setEditData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        theme: value ? 'dark' : 'light',
                      },
                    }));
                  }}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.rowText}>Language</Text>
                <Text style={styles.rowSubtext}>
                  {user.preferences?.language === 'en' ? 'English' : user.preferences?.language || 'English'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Data Management */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Data Management</Text>

              <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                Manage your app data and export options
              </Text>

              <Button
                mode="outlined"
                onPress={() => Alert.alert('Coming Soon', 'Data export feature will be available soon')}
                style={styles.secondaryButton}
                icon="download"
                textColor={theme.colors.primary}
              >
                Export My Data
              </Button>
            </Card.Content>
          </Card>

          {/* Session Status */}
          <SessionStatus showDetails={true} compact={false} />

          {/* Account Actions */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Account Actions</Text>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowPasswordDialog(true)}
                  style={[styles.actionButton, styles.secondaryButton]}
                  icon="lock"
                  textColor={theme.colors.primary}
                >
                  Change Password
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleSignOut}
                  style={[styles.actionButton, styles.secondaryButton]}
                  icon="logout"
                  textColor={theme.colors.primary}
                >
                  Sign Out
                </Button>
              </View>

              <Button
                mode="contained"
                onPress={() => setShowDeleteDialog(true)}
                style={styles.dangerButton}
                icon="delete"
                buttonColor={theme.colors.error}
                textColor="#FFFFFF"
              >
                Delete Account
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Password Change Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={passwordData.currentPassword}
              onChangeText={value => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
              style={styles.passwordInput}
              mode="outlined"
              secureTextEntry
            />
            <TextInput
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={value => setPasswordData(prev => ({ ...prev, newPassword: value }))}
              style={styles.passwordInput}
              mode="outlined"
              secureTextEntry
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.passwordInput}
              mode="outlined"
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handlePasswordChange} loading={loading}>
              Change Password
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Account Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: theme.spacing.md }}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <TextInput
              label="Reason for deletion (optional)"
              value={deleteReason}
              onChangeText={setDeleteReason}
              style={styles.deleteInput}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteAccount} loading={loading} textColor={theme.colors.error}>
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Clear All Bookmarks Dialog */}
      <Portal>
        <Dialog visible={showClearBookmarksDialog} onDismiss={() => setShowClearBookmarksDialog(false)}>
          <Dialog.Title>Clear All Bookmarks</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: theme.spacing.md }}>
              Are you sure you want to remove all {savedContent.length} saved items? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearBookmarksDialog(false)}>Cancel</Button>
            <Button onPress={handleClearAllBookmarks} loading={savedContentLoading} textColor={theme.colors.error}>
              Clear All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

    </View>
  );
}
