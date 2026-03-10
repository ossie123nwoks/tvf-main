import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Modal as RNModal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Avatar,
  Dialog,
  Portal,
  TextInput,
  TouchableRipple,
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

// ───── Reusable Components ─────

const ProfileHeader = ({ user, avatarSource, onDismiss, theme }: any) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={{ width: 40 }} />
        <Pressable onPress={onDismiss} style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialIcons name="close" size={22} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarWrapper}>
          {avatarSource ? (
            <Avatar.Image size={96} source={{ uri: avatarSource }} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={96}
              label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U'}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: '#FFFFFF', ...theme.typography.headlineLarge }}
            />
          )}
        </View>

        <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginTop: theme.spacing.md, fontWeight: '700' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginTop: 4 }}>
          {user?.email}
        </Text>

        {/* Role Badge */}
        <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '1A' }]}>
          <Text style={{ ...theme.typography.labelSmall, color: theme.colors.primary, fontWeight: '600' }}>
            {(user?.role || 'Member').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const ProfileSectionCard = ({ title, children, theme }: any) => (
  <View style={styles.sectionContainer}>
    {title && (
      <Text style={{ ...theme.typography.labelLarge, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, marginLeft: theme.spacing.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Text>
    )}
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderLight }]}>
      {children}
    </View>
  </View>
);

const ProfileActionItem = ({ icon, title, subtitle, onPress, destructive = false, isLast = false, theme }: any) => (
  <View style={{ overflow: 'hidden' }}>
    <TouchableRipple onPress={onPress} rippleColor={theme.colors.text + '1A'} style={styles.actionItem}>
      <View style={styles.actionItemContent}>
        <View style={[styles.actionIconWrap, destructive ? { backgroundColor: theme.colors.error + '1A' } : { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialIcons name={icon} size={22} color={destructive ? theme.colors.error : theme.colors.primary} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={{ ...theme.typography.bodyLarge, color: destructive ? theme.colors.error : theme.colors.text, fontWeight: '500' }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.borderLight} />
      </View>
    </TouchableRipple>
    {!isLast && <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />}
  </View>
);

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
  const { height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();

  // Dialog States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfileUpdate>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const modalMaxHeight = screenHeight * 0.9;

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
            setTimeout(async () => {
              await signOut();
              if (onSignOut) onSignOut();
            }, 300);
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

  const avatarSource = isGoogleDefaultAvatar(user?.avatarUrl) ? undefined : user?.avatarUrl;

  const notImplemented = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
  };

  return (
    <>
      <RNModal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onDismiss}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

          <View style={[styles.bottomSheet, { backgroundColor: theme.colors.background, maxHeight: modalMaxHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : theme.spacing.xl }]}>
            {/* Grabber */}
            <View style={styles.grabberWrapper}>
              <View style={[styles.grabber, { backgroundColor: theme.colors.borderLight }]} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <ProfileHeader user={user} avatarSource={avatarSource} onDismiss={onDismiss} theme={theme} />

              <View style={styles.sectionsWrapper}>
                <ProfileSectionCard title="Account" theme={theme}>
                  {showEditButton && (
                    <ProfileActionItem
                      icon="person-outline"
                      title="Edit Profile"
                      subtitle="Update your personal details"
                      onPress={() => setIsEditing(true)}
                      theme={theme}
                    />
                  )}
                  <ProfileActionItem
                    icon="lock-outline"
                    title="Change Password"
                    subtitle="Update your security credentials"
                    onPress={() => setShowPasswordDialog(true)}
                    theme={theme}
                    isLast
                  />
                </ProfileSectionCard>

                <ProfileSectionCard title="Content" theme={theme}>
                  <ProfileActionItem
                    icon="download"
                    title="Download Sermons"
                    subtitle="Manage offline content"
                    onPress={() => notImplemented('Download Sermons')}
                    theme={theme}
                  />
                  <ProfileActionItem
                    icon="bookmark-border"
                    title="Saved Sermons"
                    subtitle="View your bookmarked messages"
                    onPress={() => notImplemented('Saved Sermons')}
                    theme={theme}
                    isLast
                  />
                </ProfileSectionCard>

                <ProfileSectionCard title="Preferences" theme={theme}>
                  <ProfileActionItem
                    icon="notifications-none"
                    title="Notifications Settings"
                    subtitle="Manage push notifications and alerts"
                    onPress={() => notImplemented('Notifications Settings')}
                    theme={theme}
                  />
                  <ProfileActionItem
                    icon="settings"
                    title="App Settings"
                    subtitle="Theme, audio quality, and language"
                    onPress={() => notImplemented('App Settings')}
                    theme={theme}
                    isLast
                  />
                </ProfileSectionCard>

                <ProfileSectionCard title="Danger Zone" theme={theme}>
                  {showSignOutButton && (
                    <ProfileActionItem
                      icon="logout"
                      title="Log Out"
                      onPress={handleSignOut}
                      destructive
                      isLast={!showDeleteButton}
                      theme={theme}
                    />
                  )}
                  {showDeleteButton && (
                    <ProfileActionItem
                      icon="delete-outline"
                      title="Delete Account"
                      subtitle="Permanently delete your data"
                      onPress={() => setShowDeleteDialog(true)}
                      destructive
                      isLast
                      theme={theme}
                    />
                  )}
                </ProfileSectionCard>
              </View>
            </ScrollView>
          </View>
        </View>
      </RNModal>

      {/* ─── Edit Profile Dialog ─── */}
      <Portal>
        <Dialog visible={isEditing} onDismiss={() => setIsEditing(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
          <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="First Name"
              value={editData.firstName}
              onChangeText={text => setEditData({ ...editData, firstName: text })}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
              textColor={theme.colors.text}
              activeUnderlineColor={theme.colors.primary}
            />
            <TextInput
              label="Last Name"
              value={editData.lastName}
              onChangeText={text => setEditData({ ...editData, lastName: text })}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
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

      {/* ─── Change Password Dialog ─── */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
          <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={txt => setPasswordData(prev => ({ ...prev, currentPassword: txt }))}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
              textColor={theme.colors.text}
              activeUnderlineColor={theme.colors.primary}
            />
            <TextInput
              label="New Password"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={txt => setPasswordData(prev => ({ ...prev, newPassword: txt }))}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
              textColor={theme.colors.text}
              activeUnderlineColor={theme.colors.primary}
            />
            <TextInput
              label="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
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

      {/* ─── Delete Account Dialog ─── */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)} style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg }}>
          <Dialog.Title style={{ ...theme.typography.titleLarge, color: theme.colors.error }}>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginBottom: 16 }}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <TextInput
              label="Reason for deletion (optional)"
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
              numberOfLines={3}
              style={[styles.dialogInput, { backgroundColor: theme.colors.surface }]}
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
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  grabberWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  grabber: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: 48,
  },
  avatar: {
    overflow: 'hidden',
  },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionsWrapper: {
    gap: 24,
  },
  sectionContainer: {
    width: '100%',
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  actionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  dialogInput: {
    marginBottom: 16,
  },
});
