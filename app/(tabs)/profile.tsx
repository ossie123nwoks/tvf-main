import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, List, Switch, Button, Avatar, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.md,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    avatar: {
      marginBottom: theme.spacing.md,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    email: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label="JD"
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            color={theme.colors.background}
          />
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john.doe@example.com</Text>
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.card}>
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark themes"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
          />
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.card}>
          <List.Item
            title="New Content"
            description="Get notified about new sermons and articles"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => <Switch value={true} color={theme.colors.primary} />}
          />
          <List.Item
            title="Reminders"
            description="Receive prayer and study reminders"
            left={(props) => <List.Icon {...props} icon="clock" />}
            right={() => <Switch value={true} color={theme.colors.primary} />}
          />
          <List.Item
            title="Updates"
            description="App updates and announcements"
            left={(props) => <List.Icon {...props} icon="update" />}
            right={() => <Switch value={false} color={theme.colors.primary} />}
          />
        </Card>

        <Text style={styles.sectionTitle}>Content</Text>
        <Card style={styles.card}>
          <List.Item
            title="Auto-download"
            description="Automatically download new content"
            left={(props) => <List.Icon {...props} icon="download" />}
            right={() => <Switch value={false} color={theme.colors.primary} />}
          />
          <List.Item
            title="Audio Quality"
            description="High quality audio (uses more data)"
            left={(props) => <List.Icon {...props} icon="music" />}
            right={() => <Switch value={true} color={theme.colors.primary} />}
          />
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.card}>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Privacy Settings"
            description="Manage your privacy preferences"
            left={(props) => <List.Icon {...props} icon="shield" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Card>

        <Card style={styles.card}>
          <List.Item
            title="Sign Out"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            titleStyle={{ color: theme.colors.error }}
          />
        </Card>

        <View style={{ height: theme.spacing.lg }} />
      </ScrollView>
    </View>
  );
}
