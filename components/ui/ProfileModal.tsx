import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, useWindowDimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Avatar,
  Dialog,
  Portal,
  TextInput,
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

// ───── Helper Components ─────

function SettingRow({
  icon,
  iconColor,
  title,
  value,
  theme,
  isLast = false
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  value: string;
  theme: any;
  isLast?: boolean;
}) {
  return (
    <View style={[staticStyles.settingRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight }]}>
      <View style={[staticStyles.settingIconWrap, { backgroundColor: iconColor + '1A' }]}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.text, flex: 1, marginLeft: theme.spacing.md }}>
        {title}
      </Text>
      <Text style={{ ...theme.typography.labelMedium, color: theme.colors.textSecondary }}>
        {value}
      </Text>
    </View>
  );
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
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

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

  // State for password change / Delete
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Sizing & Theme Overrides
  const modalMaxHeight = Platform.select({
    ios: screenHeight * 0.85 - insets.top - insets.bottom,
    android: screenHeight * 0.9,
    default: screenHeight * 0.85,
  });

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: theme.colors.background,
      maxHeight: modalMaxHeight,
      borderRadius: theme.borderRadius.xl,
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
      ...theme.shadows.large,
    },
    sectionCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.small,
      padding: theme.spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      height: 48,
    },
    secondaryButton: {
      borderColor: theme.colors.borderLight,
      borderWidth: 1,
      borderRadius: theme.borderRadius.full,
      height: 48,
      backgroundColor: theme.colors.surface,
    },
  }), [theme, modalMaxHeight, insets, screenWidth]);

  // Actions
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
      if (onDeleteAccount) onDeleteAccount();
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
            onDismiss();
            await new Promise(resolve => setTimeout(resolve, 100)); // allow dismiss animation
            await signOut();
            if (onSignOut) onSignOut();
          } catch (error) {
            console.error('Error during sign out:', error);
            if (onSignOut) onSignOut();
          }
        },
      },
    ]);
  };

  const isGoogleDefaultAvatar = (url?: string): boolean => {
    if (!url) return false;
    try {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('googleusercontent.com') || lowerUrl.includes('google.com')) {
        return lowerUrl.includes('/default') || lowerUrl.includes('/photo.jpg') ||
          lowerUrl.match(/=s\d+-c\b/i) != null || lowerUrl.match(/\/photo\/default/) != null;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getAvatarSource = (url?: string): string | undefined => {
    return isGoogleDefaultAvatar(url) ? undefined : url;
  };

  try {
    const avatarSource = getAvatarSource(user?.avatarUrl);

    return (
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={onDismiss}
          style={[dynamicStyles.container, { padding: 0 }]}
          dismissable={true}
          dismissableBackButton={true}
        >
          {/* ─── Header ─── */}
          <View style={[staticStyles.header, { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl, borderBottomColor: theme.colors.borderLight, borderBottomWidth: 1 }]}>
            <View style={staticStyles.headerTopRow}>
              <View style={{ width: 40 }} /> {/* Spacer */}
              <Text style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>My Profile</Text>
              <Pressable onPress={onDismiss} style={[staticStyles.closeBtn, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.full }]}>
                <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={staticStyles.profileInfoCenter}>
              {avatarSource ? (
                <Avatar.Image size={88} source={{ uri: avatarSource }} style={[staticStyles.avatar, { elevation: 4 }]} />
              ) : (
                <Avatar.Text
                  size={88}
                  label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                  style={[staticStyles.avatar, { backgroundColor: theme.colors.primary, elevation: 4 }]}
                  labelStyle={{ color: '#FFFFFF', ...theme.typography.headlineLarge }}
                />
              )}
              <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginTop: theme.spacing.md }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: 4 }}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* ─── Content ─── */}
          <ScrollView style={staticStyles.scrollView} contentContainerStyle={{ padding: theme.spacing.lg }} showsVerticalScrollIndicator={false}>

            <View style={dynamicStyles.sectionCard}>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.md }}>
                Personal Info
              </Text>
              <SettingRow icon="person-outline" iconColor={theme.colors.primary} title="First Name" value={user?.firstName || 'Not set'} theme={theme} />
              <SettingRow icon="person-outline" iconColor={theme.colors.primary} title="Last Name" value={user?.lastName || 'Not set'} theme={theme} />
              <SettingRow icon="mail-outline" iconColor={theme.colors.primary} title="Email Address" value={user?.email || 'Not set'} theme={theme} />
              <SettingRow icon="calendar-today" iconColor={theme.colors.textTertiary} title="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'} theme={theme} isLast />
            </View>

            <View style={dynamicStyles.sectionCard}>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.md }}>
                App Preferences
              </Text>
              <SettingRow icon="palette" iconColor={theme.colors.accent} title="Theme" value={user?.preferences?.theme ? user.preferences.theme.charAt(0).toUpperCase() + user.preferences.theme.slice(1) : 'Auto'} theme={theme} />
              <SettingRow icon="high-quality" iconColor={theme.colors.success} title="Audio Quality" value={user?.preferences?.audioQuality ? user.preferences.audioQuality.charAt(0).toUpperCase() + user.preferences.audioQuality.slice(1) : 'Medium'} theme={theme} />
              <SettingRow icon="offline-pin" iconColor={theme.colors.info} title="Auto Download" value={user?.preferences?.autoDownload ? 'Enabled' : 'Disabled'} theme={theme} />
              <SettingRow icon="translate" iconColor={theme.colors.warning} title="Language" value={user?.preferences?.language === 'en' ? 'English' : (user?.preferences?.language || 'English')} theme={theme} isLast />
            </View>

            <View style={dynamicStyles.sectionCard}>
              <Text style={{ ...theme.typography.titleMedium, color: theme.colors.text, marginBottom: theme.spacing.md }}>
                Notifications
              </Text>
              <SettingRow icon="video-library" iconColor={theme.colors.primary} title="New Content" value={user?.preferences?.notifications?.newContent ? 'Enabled' : 'Disabled'} theme={theme} />
              <SettingRow icon="event-available" iconColor={theme.colors.accent} title="Reminders" value={user?.preferences?.notifications?.reminders ? 'Enabled' : 'Disabled'} theme={theme} />
              <SettingRow icon="system-update" iconColor={theme.colors.success} title="Updates" value={user?.preferences?.notifications?.updates ? 'Enabled' : 'Disabled'} theme={theme} />
              <SettingRow icon="campaign" iconColor={theme.colors.info} title="Marketing" value={user?.preferences?.notifications?.marketing ? 'Enabled' : 'Disabled'} theme={theme} isLast />
            </View>

          </ScrollView>

          {/* ─── Footer Actions ─── */}
          <View style={[staticStyles.footer, { backgroundColor: theme.colors.surfaceElevated, borderTopColor: theme.colors.borderLight, borderTopWidth: 1 }]}>
            <View style={staticStyles.actionRow}>
              {showSignOutButton && (
                <Button
                  mode="outlined"
                  onPress={handleSignOut}
                  style={[dynamicStyles.secondaryButton, { flex: 1, marginRight: showEditButton ? theme.spacing.md : 0 }]}
                  labelStyle={{ color: theme.colors.text, ...theme.typography.labelLarge }}
                >
                  Sign Out
                </Button>
              )}
              {showEditButton && (
                <Button
                  mode="contained"
                  onPress={() => setIsEditing(true)}
                  style={[dynamicStyles.primaryButton, { flex: 2 }]}
                  labelStyle={{ color: '#FFFFFF', ...theme.typography.labelLarge }}
                >
                  Edit Profile
                </Button>
              )}
            </View>

            {showDeleteButton && (
              <Button
                mode="text"
                onPress={() => setShowDeleteDialog(true)}
                textColor={theme.colors.error}
                style={{ marginTop: theme.spacing.sm, alignSelf: 'center' }}
                labelStyle={theme.typography.labelMedium}
              >
                Delete Account
              </Button>
            )}
          </View>
        </Dialog>

        {/* ─── Edit Profile Dialog ─── */}
        <Portal>
          <Dialog visible={isEditing} onDismiss={() => setIsEditing(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
            <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>Edit Profile</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="First Name"
                value={editData.firstName}
                onChangeText={text => setEditData({ ...editData, firstName: text })}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
              <TextInput
                label="Last Name"
                value={editData.lastName}
                onChangeText={text => setEditData({ ...editData, lastName: text })}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
              <TextInput
                label="Avatar URL"
                value={editData.avatarUrl}
                onChangeText={text => setEditData({ ...editData, avatarUrl: text })}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsEditing(false)} textColor={theme.colors.textSecondary}>Cancel</Button>
              <Button onPress={handleSaveProfile} textColor={theme.colors.primary}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* ─── Delete Account Dialog ─── */}
        <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
            <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.error }}>Delete Account</Dialog.Title>
            <Dialog.Content>
              <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
              <TextInput
                label="Reason for deletion"
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.error}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)} textColor={theme.colors.textSecondary}>Cancel</Button>
              <Button onPress={handleDeleteAccount} textColor={theme.colors.error}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* ─── Password Dialog (Hidden but preserved) ─── */}
        <Portal>
          <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
            <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>Change Password</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Current"
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={txt => setPasswordData(prev => ({ ...prev, currentPassword: txt }))}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
              <TextInput
                label="New"
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={txt => setPasswordData(prev => ({ ...prev, newPassword: txt }))}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
              <TextInput
                label="Confirm"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[staticStyles.dialogInput, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.text}
                activeUnderlineColor={theme.colors.primary}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowPasswordDialog(false)} textColor={theme.colors.textSecondary}>Cancel</Button>
              <Button onPress={handleChangePassword} textColor={theme.colors.primary}>Change</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Portal>
    );
  } catch (error) {
    console.error('Error rendering ProfileModal:', error);
    return null; /* Optional proper fallback can go here */
  }
}

// ───── Static Styles ─────

const staticStyles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoCenter: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    borderBottomLeftRadius: 16, // Matches dialog wrapper (safe area handle)
    borderBottomRightRadius: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dialogInput: {
    marginBottom: 16,
  },
});
