import React from 'react';
import { View, Alert } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateDeepLink } from '@/lib/utils/deepLinking';

export const DeepLinkDemo: React.FC = () => {
  const theme = useTheme();

  const handleTestDeepLink = (
    type: 'sermon' | 'article' | 'category',
    id: string,
    label: string
  ) => {
    const deepLink = generateDeepLink(type, id);

    Alert.alert(
      'Deep Link Generated',
      `${label}\n\n${deepLink}\n\nThis link would open the ${type} directly in the app when shared or opened.`,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy to clipboard:', deepLink) },
        { text: 'OK' },
      ]
    );
  };

  const demoLinks = [
    {
      type: 'sermon' as const,
      id: 'demo-sermon-123',
      label: 'Sample Sermon: "Walking in Faith"',
      icon: 'microphone',
    },
    {
      type: 'article' as const,
      id: 'demo-article-456',
      label: 'Sample Article: "Daily Devotion Guide"',
      icon: 'book-open-variant',
    },
    {
      type: 'category' as const,
      id: 'sermons',
      label: 'Sermons Category',
      icon: 'folder-multiple',
    },
  ];

  return (
    <Card style={{ margin: 16, backgroundColor: theme.colors.surface }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MaterialCommunityIcons name="link-variant" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            Deep Linking Demo
          </Text>
        </View>

        <Text
          variant="bodyMedium"
          style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}
        >
          Test the deep linking functionality by generating sample links for different content
          types.
        </Text>

        {demoLinks.map((link, index) => (
          <Button
            key={index}
            mode="outlined"
            onPress={() => handleTestDeepLink(link.type, link.id, link.label)}
            icon={link.icon}
            style={{ marginBottom: 8 }}
            textColor={theme.colors.primary}
          >
            {link.label}
          </Button>
        ))}

        <Text
          variant="bodySmall"
          style={{ marginTop: 16, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          These deep links can be shared via messaging, email, or social media. When opened, they
          will take users directly to the specific content in the TRUEVINE FELLOWSHIP app.
        </Text>
      </Card.Content>
    </Card>
  );
};
