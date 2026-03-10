import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const MANAGEMENT_CARDS = [
  {
    id: 'topics',
    title: 'Topics',
    description: 'Create and manage content categories and topics',
    icon: 'label' as const,
    route: '/admin/topics-management',
    color: '#8B5CF6',
    features: [
      'Create custom topics',
      'Assign colors and icons',
      'Set display order',
    ],
  },
  {
    id: 'series',
    title: 'Series',
    description: 'Group sermons and articles into structured series',
    icon: 'collections-bookmark' as const,
    route: '/admin/series-management',
    color: '#3B82F6',
    features: [
      'Create sermon series',
      'Set date ranges',
      'Add series artwork',
    ],
  },
];

export default function TopicsSeriesPage() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <AdminAuthGuard>
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        <AdminPageHeader title="Topics & Series" />

        <ScrollView
          style={staticStyles.scrollView}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <Text style={{ ...theme.typography.headlineSmall, color: theme.colors.text, marginBottom: theme.spacing.xs }}>
            Topics & Series
          </Text>
          <Text style={{ ...theme.typography.bodyMedium, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }}>
            Organize your content to help users discover related material.
          </Text>

          {/* Management Cards */}
          {MANAGEMENT_CARDS.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => router.push(card.route)}
              style={({ pressed }) => [
                staticStyles.card,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: pressed ? card.color + '40' : theme.colors.cardBorder,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  opacity: pressed ? 0.92 : 1,
                  ...theme.shadows.small,
                },
              ]}
            >
              {/* Header */}
              <View style={staticStyles.cardHeader}>
                <View
                  style={[
                    staticStyles.cardIcon,
                    {
                      backgroundColor: card.color + '15',
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                >
                  <MaterialIcons name={card.icon} size={28} color={card.color} />
                </View>
                <View style={staticStyles.cardTitleArea}>
                  <Text style={{ ...theme.typography.titleLarge, color: theme.colors.text }}>
                    {card.title}
                  </Text>
                  <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {card.description}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />
              </View>

              {/* Features */}
              <View style={[staticStyles.featuresContainer, { marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.borderLight }]}>
                {card.features.map((feature, idx) => (
                  <View key={idx} style={staticStyles.featureRow}>
                    <MaterialIcons name="check-circle" size={16} color={card.color} />
                    <Text style={{ ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginLeft: 8 }}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Button */}
              <Button
                mode="contained"
                onPress={() => router.push(card.route)}
                buttonColor={card.color}
                textColor="#FFFFFF"
                style={{ marginTop: theme.spacing.md, borderRadius: theme.borderRadius.md }}
                icon={card.icon}
              >
                Manage {card.title}
              </Button>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </AdminAuthGuard>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleArea: {
    flex: 1,
    marginRight: 8,
  },
  featuresContainer: {},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
