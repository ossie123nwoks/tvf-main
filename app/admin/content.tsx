import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { HeaderBar } from '@/components/admin/ui';

const CONTENT_SECTIONS = [
  {
    id: 'sermons',
    title: 'Manage Sermons',
    description: 'Create, edit, publish, and delete sermon recordings',
    icon: 'headset' as const,
    color: '#10B981',
    route: '/admin/sermons',
    stats: 'Audio sermons & messages',
  },
  {
    id: 'articles',
    title: 'Manage Articles',
    description: 'Create, edit, publish, and delete written articles',
    icon: 'article' as const,
    color: '#8B5CF6',
    route: '/admin/articles',
    stats: 'Blog posts & devotionals',
  },
];

export default function ContentPage() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <AdminAuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title="Content Management"
          subtitle="Manage your church content"
          backButton
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={[styles.introCard, {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            ...theme.shadows.small,
          }]}>
            <MaterialIcons name="library-books" size={32} color={theme.colors.primary} />
            <Text style={{
              ...theme.typography.titleMedium,
              color: theme.colors.text,
              marginTop: theme.spacing.sm,
            }}>
              Church Content Library
            </Text>
            <Text style={{
              ...theme.typography.bodySmall,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xxs,
            }}>
              Select a content type below to manage your sermons or articles.
            </Text>
          </View>

          {/* Content Type Cards */}
          {CONTENT_SECTIONS.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => router.push(section.route)}
              style={({ pressed }) => [
                styles.sectionCard,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: pressed ? section.color : theme.colors.cardBorder,
                  marginBottom: theme.spacing.md,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                  ...theme.shadows.small,
                },
              ]}
            >
              {/* Colored accent strip */}
              <View style={[styles.accentStrip, {
                backgroundColor: section.color,
                borderTopLeftRadius: theme.borderRadius.lg,
                borderBottomLeftRadius: theme.borderRadius.lg,
              }]} />

              <View style={styles.cardBody}>
                {/* Icon + Title Row */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: section.color + '15' }]}>
                    <MaterialIcons name={section.icon} size={28} color={section.color} />
                  </View>
                  <View style={styles.titleBlock}>
                    <Text
                      style={{ ...theme.typography.titleLarge, color: theme.colors.text }}
                      numberOfLines={1}
                    >
                      {section.title}
                    </Text>
                    <Text
                      style={{
                        ...theme.typography.bodySmall,
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {section.description}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />
                </View>

                {/* Footer tag */}
                <View style={[styles.cardFooter, { borderTopColor: theme.colors.borderLight }]}>
                  <MaterialIcons name="info-outline" size={14} color={theme.colors.textTertiary} />
                  <Text style={{
                    ...theme.typography.caption,
                    color: theme.colors.textTertiary,
                    marginLeft: 6,
                  }}>
                    {section.stats}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  introCard: {
    alignItems: 'center',
  },
  sectionCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStrip: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
