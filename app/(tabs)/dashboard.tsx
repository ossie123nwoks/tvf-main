import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

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
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      minWidth: 150,
    },
    featuredSection: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    card: {
      marginBottom: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TRUEVINE</Text>
          <Text style={styles.subtitle}>Fellowship Church</Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="headphones" size={24} color="white" />}
            onPress={() => {}}
          >
            Listen to Sermons
          </Button>
          <Button
            mode="outlined"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="article" size={24} color={theme.colors.primary} />}
            onPress={() => {}}
          >
            Read Articles
          </Button>
          <Button
            mode="outlined"
            style={styles.actionButton}
            icon={() => <MaterialIcons name="language" size={24} color={theme.colors.primary} />}
            onPress={() => {}}
          >
            Visit Website
          </Button>
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Sermon</Text>
          <Card style={styles.card}>
            <Card.Cover source={{ uri: 'https://via.placeholder.com/300x200' }} />
            <Card.Content>
              <Text variant="titleMedium">Sunday Service - Faith & Grace</Text>
              <Text variant="bodyMedium">Pastor Johnson</Text>
              <Text variant="bodySmall">45 minutes • 2 days ago</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained">Play</Button>
              <Button mode="outlined">Download</Button>
            </Card.Actions>
          </Card>
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Latest Articles</Text>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Walking in Faith</Text>
              <Text variant="bodyMedium">A reflection on daily spiritual practices</Text>
              <Text variant="bodySmall">By Sarah Wilson • 1 week ago</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined">Read More</Button>
            </Card.Actions>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
