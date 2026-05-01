import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, Chip, Menu, IconButton, Avatar, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { UserManagementFilters } from '@/types/admin';
import { useRouter } from 'expo-router';
import { DataTable, Column, ActionButton, DashboardCard } from '@/components/admin/ui';

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

export default function UserManagementSection() {
  const { theme } = useTheme();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<UserManagementFilters>({
    search: '',
    role: undefined,
    isEmailVerified: undefined,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadUsers = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      }
      const result = await AdminService.getUsers(pageNum, 50, filters.search || undefined);

      let filteredUsers = result.users as User[];
      if (filters.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filters.role);
      }
      if (filters.isEmailVerified !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.is_email_verified === filters.isEmailVerified);
      }

      if (reset) {
        setUsers(filteredUsers);
      } else {
        setUsers(prev => [...prev, ...filteredUsers]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, true);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.search !== searchQuery) {
        setFilters(prev => ({ ...prev, search: searchQuery }));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    loadUsers(1, true);
  }, [filters]);

  const handleRoleChange = async (userId: string, newRole: 'member' | 'admin' | 'moderator') => {
    try {
      await AdminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => (user.id === userId ? { ...user, role: newRole } : user)));
      setMenuVisible(null);
      Alert.alert('Success', 'User role updated successfully');
    } catch (err) {
      console.error('Error updating user role:', err);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return theme.colors.primary;
      case 'moderator':
        return theme.colors.secondary;
      case 'member':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      title: 'User',
      flex: 2,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
          <Avatar.Text
            size={40}
            label={`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase() || 'U'}
            style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12, flexShrink: 0 }}
            labelStyle={{ color: theme.colors.primary, ...theme.typography.titleSmall }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ ...theme.typography.titleSmall, color: theme.colors.text }} numberOfLines={1}>
              {item.first_name || 'Unknown'} {item.last_name || 'User'}
            </Text>
            <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary }} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      flex: 1,
      render: item => (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: getRoleColor(item.role) + '15',
          }}
        >
          <Text style={{ ...theme.typography.labelSmall, color: getRoleColor(item.role) }}>
            {item.role.toUpperCase()}
          </Text>
        </View>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      flex: 1,
      render: item => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Badge
            size={8}
            style={{
              backgroundColor: item.is_email_verified ? theme.colors.success : theme.colors.warning,
              marginRight: 8,
            }}
          />
          <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary }}>
            {item.is_email_verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 60,
      render: item => (
        <Menu
          visible={menuVisible === item.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton icon="dots-vertical" size={20} onPress={() => setMenuVisible(item.id)} />
          }
        >
          <Menu.Item
            onPress={() => handleRoleChange(item.id, 'admin')}
            title="Make Admin"
            leadingIcon="shield-account"
          />
          <Menu.Item
            onPress={() => handleRoleChange(item.id, 'moderator')}
            title="Make Moderator"
            leadingIcon="account-supervisor"
          />
          <Menu.Item
            onPress={() => handleRoleChange(item.id, 'member')}
            title="Make Member"
            leadingIcon="account"
          />
        </Menu>
      ),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <DashboardCard style={{ marginBottom: 16 }}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            elevation={0}
            iconColor={theme.colors.textTertiary}
            inputStyle={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
          />
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            containerColor={showFilters ? theme.colors.primaryContainer : 'transparent'}
            iconColor={showFilters ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Role:</Text>
              {['admin', 'moderator', 'member'].map(role => (
                <Chip
                  key={role}
                  selected={filters.role === role}
                  onPress={() =>
                    setFilters(prev => ({
                      ...prev,
                      role: prev.role === role ? undefined : (role as any),
                    }))
                  }
                  style={styles.chip}
                  showSelectedOverlay
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Chip>
              ))}
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status:</Text>
              <Chip
                selected={filters.isEmailVerified === true}
                onPress={() =>
                  setFilters(prev => ({
                    ...prev,
                    isEmailVerified: prev.isEmailVerified === true ? undefined : true,
                  }))
                }
                style={styles.chip}
              >
                Verified
              </Chip>
              <Chip
                selected={filters.isEmailVerified === false}
                onPress={() =>
                  setFilters(prev => ({
                    ...prev,
                    isEmailVerified: prev.isEmailVerified === false ? undefined : false,
                  }))
                }
                style={styles.chip}
              >
                Unverified
              </Chip>
            </View>
          </View>
        )}
      </DashboardCard>

      <DashboardCard contentStyle={{ padding: 0, flex: 1 }} style={{ flex: 1 }}>
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={item => item.id}
          loading={loading}
          onRefresh={() => loadUsers(1, true)}
          emptyTitle="No Users Found"
          emptyDescription="Try adjusting your search or filters."
        />
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filtersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterLabel: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
});
