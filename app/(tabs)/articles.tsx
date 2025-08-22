import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Searchbar, Chip, Button, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function ArticlesScreen() {
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
    { id: 'devotional', name: 'Devotional', color: theme.colors.primary },
    { id: 'bible-study', name: 'Bible Study', color: theme.colors.secondary },
    { id: 'testimony', name: 'Testimony', color: theme.colors.success },
    { id: 'ministry', name: 'Ministry', color: theme.colors.warning },
  ];

  const mockArticles = [
    {
      id: '1',
      title: 'Walking in Faith',
      author: 'Sarah Wilson',
      excerpt: 'A reflection on daily spiritual practices and how they strengthen our relationship with God...',
      publishedAt: '1 week ago',
      category: 'devotional',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
    },
    {
      id: '2',
      title: 'Understanding God\'s Grace',
      author: 'Pastor Johnson',
      excerpt: 'An exploration of Ephesians 2:8-9 and what it means to live in God\'s grace...',
      publishedAt: '2 weeks ago',
      category: 'bible-study',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
    },
    {
      id: '3',
      title: 'My Journey to Christ',
      author: 'Michael Chen',
      excerpt: 'A personal testimony of how God transformed my life through difficult circumstances...',
      publishedAt: '3 weeks ago',
      category: 'testimony',
      thumbnailUrl: 'https://via.placeholder.com/300x200',
    },
  ];

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Articles</Text>
        </View>

        <Searchbar
          placeholder="Search articles..."
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

        {filteredArticles.map((article) => (
          <Card key={article.id} style={styles.card}>
            <Card.Cover source={{ uri: article.thumbnailUrl }} />
            <Card.Content>
              <Text variant="titleMedium">{article.title}</Text>
              <Text variant="bodyMedium">{article.author}</Text>
              <Text variant="bodySmall">{article.publishedAt}</Text>
              <Text variant="bodyMedium" style={{ marginTop: theme.spacing.sm }}>
                {article.excerpt}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button icon="book-open" mode="text">Read</Button>
              <Button icon="share" mode="text">Share</Button>
              <Button icon="bookmark" mode="text">Save</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
