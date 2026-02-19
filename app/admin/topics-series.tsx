import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function TopicsSeriesPage() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 2,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      marginTop: 0,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    button: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    buttonLast: {
      marginRight: 0,
    },
    descriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    featuresCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    featuresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    listItem: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      lineHeight: 22,
    },
  });

  return (
    <AdminAuthGuard>
      <View style={styles.container}>
        <AdminPageHeader title="Topics & Series" />
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Topics & Series Management</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => router.push('/admin/topics-management')}
              icon="label"
              style={styles.button}
            >
              Manage Topics
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/admin/series-management')}
              icon="book"
              style={[styles.button, styles.buttonLast]}
            >
              Manage Series
            </Button>
          </View>

          <Card style={styles.descriptionCard} elevation={1}>
            <Text style={styles.description}>
              Organize your content with topics and series to help users discover related content.
            </Text>
          </Card>

          <Card style={styles.featuresCard} elevation={1}>
            <Text style={styles.featuresTitle}>Features</Text>
            <Text style={styles.listItem}>• Create and manage content topics</Text>
            <Text style={styles.listItem}>• Create and manage sermon/article series</Text>
            <Text style={styles.listItem}>• Organize content relationships</Text>
            <Text style={styles.listItem}>• Assign content to topics and series</Text>
          </Card>
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

