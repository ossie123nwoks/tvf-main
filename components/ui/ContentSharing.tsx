import React from 'react';
import { View, Share, Alert } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { generateDeepLink } from '@/lib/utils/deepLinking';

export interface ContentSharingProps {
  type: 'sermon' | 'article';
  id: string;
  title: string;
  description?: string;
  author?: string;
  date?: string;
  onShare?: (shareResult: Share.ShareResult) => void;
}

export const ContentSharing: React.FC<ContentSharingProps> = ({
  type,
  id,
  title,
  description,
  author,
  date,
  onShare,
}) => {
  const theme = useTheme();

  const handleShare = async () => {
    try {
      // Generate deep link for the content
      const deepLink = generateDeepLink(type, id, {
        title: title,
        author: author || '',
        date: date || '',
      });

      // Create share message
      const shareMessage = `Check out this ${type} from TRUEVINE FELLOWSHIP Church!\n\n"${title}"${author ? `\nby ${author}` : ''}${date ? `\n${date}` : ''}\n\n${description ? `\n${description}\n\n` : ''}Open in the TRUEVINE FELLOWSHIP app:\n${deepLink}\n\nOr visit our website: https://tvffellowship.com`;

      const result = await Share.share({
        message: shareMessage,
        title: `TRUEVINE FELLOWSHIP - ${title}`,
        url: deepLink, // This will be used on platforms that support URL sharing
      });

      if (onShare) {
        onShare(result);
      }

      // Log successful share for analytics
      console.log('Content shared successfully:', { type, id, action: result.action });
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Share Error', 'Unable to share this content. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleCopyLink = async () => {
    try {
      const deepLink = generateDeepLink(type, id);

      // Copy to clipboard (you might want to add a clipboard library for better UX)
      // For now, we'll just show an alert with the link
      Alert.alert('Deep Link Copied', `Here's the deep link for this ${type}:\n\n${deepLink}`, [
        { text: 'Copy to Clipboard', onPress: () => console.log('Copy to clipboard:', deepLink) },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Unable to copy the link.');
    }
  };

  const getShareIcon = () => {
    switch (type) {
      case 'sermon':
        return 'microphone';
      case 'article':
        return 'book-open-variant';
      default:
        return 'share-variant';
    }
  };

  const getContentTypeLabel = () => {
    return type === 'sermon' ? 'Sermon' : 'Article';
  };

  return (
    <Card style={{ margin: 16, backgroundColor: theme.colors.surface }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MaterialCommunityIcons name={getShareIcon()} size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            Share {getContentTypeLabel()}
          </Text>
        </View>

        <Text variant="titleLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
          {title}
        </Text>

        {author && (
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}
          >
            by {author}
          </Text>
        )}

        {date && (
          <Text
            variant="bodySmall"
            style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}
          >
            {date}
          </Text>
        )}

        {description && (
          <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurface }}>
            {description}
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            mode="contained"
            onPress={handleShare}
            icon="share-variant"
            style={{ flex: 1 }}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Share
          </Button>

          <Button
            mode="outlined"
            onPress={handleCopyLink}
            icon="link-variant"
            style={{ flex: 1 }}
            textColor={theme.colors.primary}
            outlineColor={theme.colors.primary}
          >
            Copy Link
          </Button>
        </View>

        <Text
          variant="bodySmall"
          style={{ marginTop: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          When someone opens this link, they'll be taken directly to this {type} in the TRUEVINE
          FELLOWSHIP app.
        </Text>
      </Card.Content>
    </Card>
  );
};
