import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

export default function SermonsScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    searchBar: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    categories: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
  });

  const categories = [
    { id: 'sunday', name: 'Sunday Service', color: theme.colors.primary },
    { id: 'bible-study', name: 'Bible Study', color: theme.colors.secondary },
    { id: 'prayer', name: 'Prayer', color: theme.colors.success },
    { id: 'youth', name: 'Youth Ministry', color: theme.colors.warning },
  ];

  const mockSermons = [
    {
      id: '1',
      title: 'Sunday Service - Faith & Grace',
      preacher: 'Pastor Johnson',
      date: '2 days ago',
      duration: '45 min',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
      category: 'sunday',
    },
    {
      id: '2',
      title: 'Bible Study - Romans Chapter 8',
      preacher: 'Pastor Smith',
      date: '1 week ago',
      duration: '60 min',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
      category: 'bible-study',
    },
    {
      id: '3',
      title: 'Prayer Meeting - Intercessory Prayer',
      preacher: 'Deacon Williams',
      date: '2 weeks ago',
      duration: '30 min',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
      category: 'prayer',
    },
  ];

  const filteredSermons = mockSermons.filter(sermon => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sermon.preacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || sermon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Sermons</Text>
        </View>

        <Searchbar
          placeholder="Search sermons..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.categories}>
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={{ marginRight: theme.spacing.sm }}
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={{ marginRight: theme.spacing.sm }}
            >
              {category.name}
            </Chip>
          ))}
        </View>

        {filteredSermons.map((sermon) => (
          <Card key={sermon.id} style={styles.card}>
            <Card.Cover source={{ uri: sermon.thumbnailUrl }} />
            <Card.Content>
              <Text variant="titleMedium">{sermon.title}</Text>
              <Text variant="bodyMedium">{sermon.preacher}</Text>
              <Text variant="bodySmall">{sermon.date} • {sermon.duration}</Text>
            </Card.Content>
            <Card.Actions>
              <Button icon="play" mode="text">Play</Button>
              <Button icon="download" mode="text">Download</Button>
              <Button icon="share" mode="text">Share</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
