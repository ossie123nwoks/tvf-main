import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Dialog, Portal, TextInput, Switch, useTheme as usePaperTheme } from 'react-native-paper';
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
  showDeleteButton = false
}: ProfileModalProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { user, signOut, updateProfile, changePassword, deleteAccount } = useAuth();
  
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    avatar: {
      marginBottom: theme.spacing.md,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      ...theme.shadows.medium,
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    infoCard: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    infoContent: {
      padding: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomColor: theme.colors.borderLight,
      borderBottomWidth: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 2,
      textAlign: 'right',
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
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    dangerButton: {
      flex: 1,
      backgroundColor: theme.colors.error,
    },
    buttonText: {
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: theme.colors.text,
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
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    preferenceLabel: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    preferenceValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            signOut();
            if (onSignOut) {
              onSignOut();
            }
          }
        },
      ]
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.container}>
        <Dialog.Title style={styles.headerTitle}>
          <View style={styles.header}>
            <Avatar.Image
              size={80}
              source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/80' }}
              style={styles.avatar}
            />
            <Text style={styles.headerTitle}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.headerSubtitle}>{user?.email}</Text>
          </View>
        </Dialog.Title>

        <Dialog.Content style={styles.content}>
          <ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="person" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                Personal Information
              </Text>
              
              <Card style={styles.infoCard}>
                <Card.Content style={styles.infoContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name</Text>
                    <Text style={styles.infoValue}>{user?.firstName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Name</Text>
                    <Text style={styles.infoValue}>{user?.lastName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="settings" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                Preferences
              </Text>
              
              <Card style={styles.infoCard}>
                <Card.Content style={styles.infoContent}>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Theme</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.theme || 'Auto'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Audio Quality</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.audioQuality || 'Medium'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Auto Download</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.autoDownload ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <View style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>Language</Text>
                    <Text style={styles.preferenceValue}>
                      {user?.preferences?.language || 'English'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

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
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={isEditing} onDismiss={() => setIsEditing(false)}>
          <Dialog.Title style={styles.dialogTitle}>Edit Profile</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="First Name"
              value={editData.firstName}
              onChangeText={(text) => setEditData({ ...editData, firstName: text })}
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
              onChangeText={(text) => setEditData({ ...editData, lastName: text })}
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
              onChangeText={(text) => setEditData({ ...editData, avatarUrl: text })}
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
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
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
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
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
}
