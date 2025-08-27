import React, { useState } from 'react';
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
  useTheme as usePaperTheme
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserProfileUpdate, ChangePasswordRequest } from '@/types/user';
import { useRouter } from 'expo-router';
import { SessionStatus } from '@/components/auth/SessionStatus';

export default function Profile() {
  const { theme } = useTheme();
  const { user, signOut, updateProfile, changePassword, deleteAccount, loading } = useAuth();
  const router = useRouter();
  
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
    scrollView: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
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
    },
    content: {
      padding: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    rowText: {
      color: theme.colors.text,
      fontSize: 16,
    },
    rowSubtext: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    button: {
      marginTop: theme.spacing.md,
    },
    dangerButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.error,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    switchText: {
      color: theme.colors.text,
      fontSize: 16,
      flex: 1,
    },
    passwordInput: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    deleteInput: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          }
        },
      ]
    );
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
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image
            size={80}
            source={{ uri: user.avatarUrl || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.headerSubtitle}>{user.email}</Text>
          <Text style={styles.headerSubtitle}>
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Profile Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              
              {isEditing ? (
                <>
                  <TextInput
                    label="First Name"
                    value={editData.firstName}
                    onChangeText={(value) => setEditData(prev => ({ ...prev, firstName: value }))}
                    style={styles.input}
                    mode="outlined"
                  />
                  <TextInput
                    label="Last Name"
                    value={editData.lastName}
                    onChangeText={(value) => setEditData(prev => ({ ...prev, lastName: value }))}
                    style={styles.input}
                    mode="outlined"
                  />
                  <TextInput
                    label="Avatar URL (optional)"
                    value={editData.avatarUrl}
                    onChangeText={(value) => setEditData(prev => ({ ...prev, avatarUrl: value }))}
                    style={styles.input}
                    mode="outlined"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  
                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <Button
                      mode="contained"
                      onPress={handleSaveProfile}
                      loading={loading}
                      style={{ flex: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleCancelEdit}
                      style={{ flex: 1 }}
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
                    <Text style={styles.rowSubtext}>
                      {user.isEmailVerified ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  
                  <Button
                    mode="outlined"
                    onPress={() => setIsEditing(true)}
                    style={styles.button}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Preferences */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Preferences</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>New Content Notifications</Text>
                <Switch
                  value={user.preferences?.notifications?.newContent || false}
                                     onValueChange={(value) => 
                     setEditData(prev => ({
                       ...prev,
                       preferences: {
                         ...prev.preferences || {},
                         notifications: {
                           ...prev.preferences?.notifications || {},
                           newContent: value,
                         },
                       },
                     }))
                   }
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Reminder Notifications</Text>
                <Switch
                  value={user.preferences?.notifications?.reminders || false}
                                     onValueChange={(value) => 
                     setEditData(prev => ({
                       ...prev,
                       preferences: {
                         ...prev.preferences || {},
                         notifications: {
                           ...prev.preferences?.notifications || {},
                           reminders: value,
                         },
                       },
                     }))
                   }
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Auto Download</Text>
                <Switch
                  value={user.preferences?.autoDownload || false}
                  onValueChange={(value) => 
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
            </Card.Content>
          </Card>

          {/* Session Status */}
          <SessionStatus showDetails={true} compact={false} />
          
          {/* Account Actions */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Account Actions</Text>
              
              <Button
                mode="outlined"
                onPress={() => setShowPasswordDialog(true)}
                style={styles.button}
                icon="lock"
              >
                Change Password
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.button}
                icon="logout"
              >
                Sign Out
              </Button>
              
              <Button
                mode="contained"
                onPress={() => setShowDeleteDialog(true)}
                style={styles.dangerButton}
                icon="delete"
                buttonColor={theme.colors.error}
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
              onChangeText={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
              style={styles.passwordInput}
              mode="outlined"
              secureTextEntry
            />
            <TextInput
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
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
            <Button onPress={handlePasswordChange} loading={loading}>Change Password</Button>
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
            <Button 
              onPress={handleDeleteAccount} 
              loading={loading}
              textColor={theme.colors.error}
            >
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
