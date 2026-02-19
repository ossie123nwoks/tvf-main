import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  Avatar,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Switch,
  Portal,
  Modal,
  RadioButton,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { AdminRole, AdminPermission } from '@/types/admin';
import { getRolePermissions, hasPermission } from '@/lib/admin/rolePermissions';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'admin' | 'moderator';
  is_email_verified: boolean;
  created_at: string;
  last_login_at?: string;
  profile_image_url?: string;
}

interface RoleManagementSectionProps {
  onUserSelect?: (user: User) => void;
}

const RoleManagementSection: React.FC<RoleManagementSectionProps> = ({
  onUserSelect,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'all' | AdminRole>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  
  // Modal state
  const [roleChangeModal, setRoleChangeModal] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>('member');
  
  // Permission modal state
  const [permissionModal, setPermissionModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    roleFilter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    bulkActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    userCard: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    userDetails: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    roleChip: {
      height: 24,
    },
    userActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedUser: {
      backgroundColor: theme.colors.primary + '10',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      maxWidth: 400,
      width: '100%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    roleOptionText: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    permissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    permissionName: {
      fontSize: 14,
      fontWeight: '500',
    },
    permissionDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    errorContainer: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
  });

  // Load users based on selected role
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (selectedRole === 'all') {
        result = await AdminService.getUsers(1, 100);
      } else {
        result = await AdminService.getUsersByRole(selectedRole as any, 1, 100);
      }

      setUsers(result.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load users when role filter changes
  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const handleRoleChange = async (user: User, newRole: AdminRole) => {
    try {
      await AdminService.updateUserRole(user.id, newRole);
      
      // Log the admin action
      await AdminService.logAdminAction({
        type: 'user_role_changed',
        description: `Changed user role from ${user.role} to ${newRole}`,
        targetUserId: user.id,
        targetUserName: `${user.first_name} ${user.last_name}`,
        metadata: {
          previousRole: user.role,
          newRole: newRole,
        },
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      ));
      
      setRoleChangeModal(false);
      setSelectedUserForRoleChange(null);
      Alert.alert('Success', 'User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleBulkRoleChange = async (newRole: AdminRole) => {
    if (selectedUsers.size === 0) return;

    try {
      const updates = Array.from(selectedUsers).map(userId => ({
        userId,
        role: newRole,
      }));

      await AdminService.bulkUpdateUserRoles(updates);
      
      // Log the bulk admin action
      const selectedUserNames = users
        .filter(user => selectedUsers.has(user.id))
        .map(user => `${user.first_name} ${user.last_name}`)
        .join(', ');
      
      await AdminService.logAdminAction({
        type: 'user_role_changed',
        description: `Bulk changed ${selectedUsers.size} users to ${newRole}`,
        metadata: {
          newRole: newRole,
          affectedUsers: Array.from(selectedUsers),
          userNames: selectedUserNames,
        },
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        selectedUsers.has(user.id) ? { ...user, role: newRole } : user
      ));
      
      setSelectedUsers(new Set());
      setBulkActionMode(false);
      Alert.alert('Success', `Updated ${selectedUsers.size} users to ${newRole}`);
    } catch (err) {
      console.error('Error bulk updating roles:', err);
      Alert.alert('Error', 'Failed to update user roles');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(users.map(user => user.id)));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return theme.colors.primary;
      case 'moderator': return theme.colors.secondary;
      case 'member': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Super Admin';
      case 'moderator': return 'Moderator';
      case 'member': return 'Member';
      default: return role;
    }
  };

  const renderRoleChangeModal = () => (
    <Portal>
      <Modal
        visible={roleChangeModal}
        onDismiss={() => setRoleChangeModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Change Role for {selectedUserForRoleChange?.first_name} {selectedUserForRoleChange?.last_name}
          </Text>
          
          <RadioButton.Group
            onValueChange={(value) => setNewRole(value as AdminRole)}
            value={newRole}
          >
            <View style={styles.roleOption}>
              <RadioButton value="member" />
              <View style={styles.roleOptionText}>
                <Text>Member</Text>
                <Text style={styles.permissionDescription}>
                  Basic user access
                </Text>
              </View>
            </View>
            
            <View style={styles.roleOption}>
              <RadioButton value="moderator" />
              <View style={styles.roleOptionText}>
                <Text>Moderator</Text>
                <Text style={styles.permissionDescription}>
                  Limited content management and user communication
                </Text>
              </View>
            </View>
            
            <View style={styles.roleOption}>
              <RadioButton value="super_admin" />
              <View style={styles.roleOptionText}>
                <Text>Super Admin</Text>
                <Text style={styles.permissionDescription}>
                  Full access to all features
                </Text>
              </View>
            </View>
          </RadioButton.Group>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
            <Button mode="outlined" onPress={() => setRoleChangeModal(false)}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={() => selectedUserForRoleChange && handleRoleChange(selectedUserForRoleChange, newRole)}
            >
              Update Role
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );

  const renderPermissionModal = () => {
    if (!selectedUserForPermissions) return null;

    const permissions = getRolePermissions(selectedUserForPermissions.role as AdminRole);

    return (
      <Portal>
        <Modal
          visible={permissionModal}
          onDismiss={() => setPermissionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Permissions for {selectedUserForPermissions.first_name} {selectedUserForPermissions.last_name}
            </Text>
            
            <Text style={{ marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
              Role: {getRoleDisplayName(selectedUserForPermissions.role)}
            </Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {permissions.map((permission) => (
                <View key={permission.id} style={styles.permissionItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    <Text style={styles.permissionDescription}>{permission.description}</Text>
                  </View>
                  <Switch value={true} disabled />
                </View>
              ))}
            </ScrollView>
            
            <Button 
              mode="contained" 
              onPress={() => setPermissionModal(false)}
              style={{ marginTop: theme.spacing.lg }}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>
    );
  };

  const renderUserCard = (user: User) => {
    const isSelected = selectedUsers.has(user.id);
    
    return (
      <Card
        key={user.id}
        style={[
          styles.userCard,
          isSelected && styles.selectedUser,
        ]}
        onPress={() => {
          if (bulkActionMode) {
            toggleUserSelection(user.id);
          } else if (onUserSelect) {
            onUserSelect(user);
          }
        }}
      >
        <Card.Content>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              {bulkActionMode && (
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleUserSelection(user.id)}
                  style={{ marginRight: theme.spacing.sm }}
                />
              )}
              <Avatar.Text
                size={48}
                label={`${user.first_name[0]}${user.last_name[0]}`}
                style={{ backgroundColor: theme.colors.primary + '20' }}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <Chip
                    mode="outlined"
                    style={[styles.roleChip, { borderColor: getRoleColor(user.role) }]}
                    textStyle={{ color: getRoleColor(user.role), fontSize: 12 }}
                  >
                    {getRoleDisplayName(user.role)}
                  </Chip>
                </View>
              </View>
            </View>
            
            {!bulkActionMode && (
              <View style={styles.userActions}>
                <IconButton
                  icon="account-cog"
                  size={20}
                  onPress={() => {
                    setSelectedUserForRoleChange(user);
                    setNewRole(user.role as AdminRole);
                    setRoleChangeModal(true);
                  }}
                />
                <IconButton
                  icon="shield-check"
                  size={20}
                  onPress={() => {
                    setSelectedUserForPermissions(user);
                    setPermissionModal(true);
                  }}
                />
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing.md }}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadUsers}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Role Management</Text>
        <Button
          mode={bulkActionMode ? "contained" : "outlined"}
          onPress={() => {
            setBulkActionMode(!bulkActionMode);
            if (bulkActionMode) {
              setSelectedUsers(new Set());
            }
          }}
        >
          {bulkActionMode ? 'Cancel' : 'Bulk Actions'}
        </Button>
      </View>

      {/* Role Filter */}
      <View style={styles.roleFilter}>
        <Chip
          selected={selectedRole === 'all'}
          onPress={() => setSelectedRole('all')}
          mode="outlined"
        >
          All Users
        </Chip>
        <Chip
          selected={selectedRole === 'super_admin'}
          onPress={() => setSelectedRole('super_admin')}
          mode="outlined"
        >
          Super Admins
        </Chip>
        <Chip
          selected={selectedRole === 'content_manager'}
          onPress={() => setSelectedRole('content_manager')}
          mode="outlined"
        >
          Content Managers
        </Chip>
        <Chip
          selected={selectedRole === 'moderator'}
          onPress={() => setSelectedRole('moderator')}
          mode="outlined"
        >
          Moderators
        </Chip>
        <Chip
          selected={selectedRole === 'member'}
          onPress={() => setSelectedRole('member')}
          mode="outlined"
        >
          Members
        </Chip>
      </View>

      {/* Bulk Actions */}
      {bulkActionMode && (
        <View style={styles.bulkActions}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: theme.spacing.md }}>
              {selectedUsers.size} selected
            </Text>
            <Button mode="outlined" onPress={selectAllUsers}>
              Select All
            </Button>
            <Button mode="outlined" onPress={clearSelection}>
              Clear
            </Button>
          </View>
          
          {selectedUsers.size > 0 && (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                mode="outlined"
                onPress={() => handleBulkRoleChange('member')}
                compact
              >
                Make Members
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleBulkRoleChange('moderator')}
                compact
              >
                Make Moderators
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleBulkRoleChange('super_admin')}
                compact
              >
                Make Admins
              </Button>
            </View>
          )}
        </View>
      )}

      {/* User List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="people-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No users found for the selected role
            </Text>
          </View>
        ) : (
          users.map(renderUserCard)
        )}
      </ScrollView>

      {/* Modals */}
      {renderRoleChangeModal()}
      {renderPermissionModal()}
    </View>
  );
};

export default RoleManagementSection;
