import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserProfileUpdate, ChangePasswordRequest } from '@/types/user';

interface ProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
  onEditProfile?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  showEditButton?: boolean;
  showSignOutButton?: boolean;
  showDeleteButton?: boolean;
}

export default function ProfileModal({
  visible,
  onDismiss,
  onEditProfile,
  onSignOut,
  onDeleteAccount,
  showEditButton = true,
  showSignOutButton = true,
  showDeleteButton = false,
}: ProfileModalProps) {
  const { user, signOut, updateProfile, changePassword, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  // Helper function to detect if a Google avatar URL is a default avatar (has logo overlay)
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
        
        return isDefault;
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
  
  // Get theme context with fallback
  let theme, paperTheme;
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    paperTheme = usePaperTheme();
  } catch (error) {
    console.warn('Theme context not available:', error);
    // Use default theme values as fallback
    theme = {
      colors: {
        primary: '#0369A1',
        surface: '#FFFFFF',
        background: '#F8FAFC',
        text: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        error: '#DC2626',
        success: '#059669',
        warning: '#D97706',
        cardBackground: '#FFFFFF',
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
      },
      shadows: {
        small: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
        medium: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      },
    };
    paperTheme = {
      colors: {
        primary: '#0369A1',
        surface: '#FFFFFF',
        background: '#F8FAFC',
        onSurface: '#1E293B',
        onSurfaceVariant: '#64748B',
        outline: '#E2E8F0',
        error: '#DC2626',
      },
    };
  }

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

  // Calculate modal height based on screen size and safe area
  const modalMaxHeight = Platform.select({
    ios: screenHeight * 0.85 - insets.top - insets.bottom,
    android: screenHeight * 0.9,
    default: screenHeight * 0.85,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      maxHeight: modalMaxHeight,
      borderRadius: Platform.select({
        ios: 20,
        android: theme.borderRadius.lg,
        default: theme.borderRadius.lg,
      }),
      marginHorizontal: Platform.select({
        ios: screenWidth > 600 ? screenWidth * 0.15 : theme.spacing.md,
        android: theme.spacing.md,
        default: theme.spacing.md,
      }),
      marginTop: Platform.select({
        ios: insets.top + theme.spacing.md,
        android: theme.spacing.xl,
        default: theme.spacing.xl,
      }),
      marginBottom: Platform.select({
        ios: Math.max(insets.bottom, theme.spacing.md),
        android: theme.spacing.lg,
        default: theme.spacing.lg,
      }),
      borderWidth: 0,
      borderBottomWidth: 0,
      borderColor: 'transparent',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    header: {
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xl + theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: 0,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontWeight: '400',
    },
    avatar: {
      marginBottom: 0,
      borderWidth: 0,
      ...(theme.shadows?.small || {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }),
    },
    content: {
      padding: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      margin: 0,
      maxHeight: modalMaxHeight,
      width: '100%',
      borderTopWidth: 0,
      borderBottomWidth: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    scrollView: {
      flexGrow: 1,
      flexShrink: 1,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitleText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    infoCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      ...(theme.shadows?.small || {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }),
    },
    infoContent: {
      padding: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    infoRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 0,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1.5,
      textAlign: 'right',
      fontWeight: '400',
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    inputText: {
      color: theme.colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 0,
      borderTopWidth: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 48,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    secondaryButton: {
      flex: 1,
      borderColor: theme.colors.border,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      height: 48,
      backgroundColor: theme.colors.cardBackground,
    },
    dangerButton: {
      flex: 1,
      backgroundColor: theme.colors.error,
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
      borderWidth: 0,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    dialogContent: {
      backgroundColor: theme.colors.cardBackground,
    },
    dialogTitle: {
      color: theme.colors.text,
    },
    dialogInput: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    dialogInputText: {
      color: theme.colors.text,
    },
    closeButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Platform.select({
        ios: theme.spacing.md,
        android: theme.spacing.lg,
        default: theme.spacing.lg,
      }),
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, theme.spacing.lg),
        android: theme.spacing.lg,
        default: theme.spacing.lg,
      }),
      paddingHorizontal: theme.spacing.lg,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    closeButton: {
      alignSelf: 'center',
      minWidth: 100,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    preferenceRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 0,
    },
    preferenceLabel: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      fontWeight: '500',
    },
    preferenceValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
      fontWeight: '400',
    },
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      await changePassword(passwordData);
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
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
      await deleteAccount({ password: '', reason: deleteReason });
      setShowDeleteDialog(false);
      setDeleteReason('');
      if (onDeleteAccount) {
        onDeleteAccount();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Close the modal first
            onDismiss();
            
            // Small delay to ensure modal is closed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then sign out
            await signOut();
            
            // Call the onSignOut callback if provided
            if (onSignOut) {
              onSignOut();
            }
          } catch (error) {
            console.error('Error during sign out:', error);
            // Still call onSignOut callback even if there's an error
            if (onSignOut) {
              onSignOut();
            }
          }
        },
      },
    ]);
  };

  // Wrap the entire component in try-catch to handle theme context issues
  try {
    return (
      <Portal>
        <Dialog 
          visible={visible} 
          onDismiss={onDismiss} 
          style={[styles.container, { borderWidth: 0 }]}
          dismissable={true}
          dismissableBackButton={true}
        >
          <Dialog.Content 
            style={[
              styles.content, 
              { 
                borderWidth: 0, 
                borderBottomWidth: 0, 
                borderTopWidth: 0,
                borderColor: 'transparent',
                overflow: 'hidden' 
              }
            ]}
            scrollable={false}
          >
            {/* Custom Header Section - Fixed at top */}
            <View style={styles.header}>
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
                    labelStyle={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: 1 }}
                  />
                );
              })()}
              <Text style={styles.headerTitle}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.headerSubtitle}>{user?.email}</Text>
            </View>

            {/* Scrollable Content Sections */}
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              bounces={Platform.select({
                ios: true,
                android: false,
                default: false,
              })}
              contentContainerStyle={{ 
                padding: theme.spacing.lg,
                paddingTop: theme.spacing.md,
                paddingBottom: theme.spacing.md,
              }}
            >
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitleText}>Personal Information</Text>
              </View>

              <Card style={styles.infoCard}>
                <Card.Content style={styles.infoContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name</Text>
                    <Text style={styles.infoValue}>{user?.firstName || 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Name</Text>
                    <Text style={styles.infoValue}>{user?.lastName || 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRowLast}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <MaterialIcons
                  name="settings"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitleText}>App Preferences</Text>
              </View>

              <Card style={styles.infoCard}>
                <Card.Content style={styles.infoContent}>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Theme</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.theme ? user.preferences.theme.charAt(0).toUpperCase() + user.preferences.theme.slice(1) : 'Auto'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Audio Quality</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.audioQuality ? user.preferences.audioQuality.charAt(0).toUpperCase() + user.preferences.audioQuality.slice(1) : 'Medium'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Auto Download</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.autoDownload ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRowLast}>
                    <Text style={styles.preferenceLabel}>Language</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.language === 'en' ? 'English' : user?.preferences?.language || 'English'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <MaterialIcons
                  name="notifications"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitleText}>Notification Preferences</Text>
              </View>

              <Card style={styles.infoCard}>
                <Card.Content style={styles.infoContent}>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>New Content</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.notifications?.newContent ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Reminders</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.notifications?.reminders ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Updates</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.notifications?.updates ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRowLast}>
                    <Text style={styles.preferenceLabel}>Marketing</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.notifications?.marketing ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </ScrollView>

          {/* Action Buttons - Fixed at bottom */}
          <View style={styles.actions}>
            {showEditButton && (
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.primaryButton}
                labelStyle={styles.buttonText}
              >
                Edit Profile
              </Button>
            )}
            {showSignOutButton && (
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonText}
              >
                Sign Out
              </Button>
            )}
          </View>

          {showDeleteButton && (
            <Button
              mode="contained"
              onPress={() => setShowDeleteDialog(true)}
              style={styles.dangerButton}
              labelStyle={styles.buttonText}
              icon="delete"
            >
              Delete Account
            </Button>
          )}

          {/* Close Button - Fixed at bottom */}
          <View style={styles.closeButtonContainer}>
            <Button 
              mode="text"
              onPress={onDismiss}
              style={styles.closeButton}
              labelStyle={{ 
                color: theme.colors.textSecondary,
                fontSize: 16,
                fontWeight: '500',
              }}
            >
              Close
            </Button>
          </View>
        </Dialog.Content>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={isEditing} onDismiss={() => setIsEditing(false)}>
          <Dialog.Title style={styles.dialogTitle}>Edit Profile</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="First Name"
              value={editData.firstName}
              onChangeText={text => setEditData({ ...editData, firstName: text })}
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
            <TextInput
              label="Last Name"
              value={editData.lastName}
              onChangeText={text => setEditData({ ...editData, lastName: text })}
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
            <TextInput
              label="Avatar URL"
              value={editData.avatarUrl}
              onChangeText={text => setEditData({ ...editData, avatarUrl: text })}
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsEditing(false)}>Cancel</Button>
            <Button onPress={handleSaveProfile}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>Change Password</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Current Password"
              value={passwordData.currentPassword}
              onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
              secureTextEntry
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
            <TextInput
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
              secureTextEntry
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handleChangePassword}>Change Password</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Account Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title style={styles.dialogTitle}>Delete Account</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <TextInput
              label="Reason for deletion"
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
              theme={{
                ...paperTheme,
                colors: {
                  ...paperTheme.colors,
                  primary: theme.colors.primary,
                  surface: theme.colors.surface,
                  onSurface: theme.colors.text,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteAccount} textColor={theme.colors.error}>
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal>
  );
  } catch (error) {
    console.error('Error rendering ProfileModal:', error);
    // Return a simple fallback modal if there's a rendering error
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onDismiss}>
          <Dialog.Title>Profile</Dialog.Title>
          <Dialog.Content>
            <Text>Unable to load profile. Please try again.</Text>
            <View style={styles.closeButtonContainer}>
              <Button 
                mode="text"
                onPress={onDismiss}
                style={styles.closeButton}
                labelStyle={{ color: theme.colors.primary }}
              >
                Close
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    );
  }
}
