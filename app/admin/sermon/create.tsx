import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Appbar } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { SermonCreateForm } from '@/components/admin/SermonCreateForm';
import { useRouter } from 'expo-router';

export default function CreateSermonPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    content: {
      flex: 1,
    },
  });

  const handleSuccess = (sermon: any) => {
    // Navigate back to admin dashboard
    router.back();
  };

  const handleCancel = () => {
    // Navigate back to admin dashboard
    router.back();
  };

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Create Sermon" />
        </Appbar.Header>
        <ScrollView style={styles.content}>
          <SermonCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}
