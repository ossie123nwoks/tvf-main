import React from 'react';
import { Share, Alert, ShareAction } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { generateDeepLink } from '@/lib/utils/deepLinking';

export interface QuickShareButtonProps {
  type: 'sermon' | 'article';
  id: string;
  title: string;
  author?: string;
  date?: string;
  size?: number;
  onShare?: (shareResult: ShareAction) => void;
}

export const QuickShareButton: React.FC<QuickShareButtonProps> = ({
  type,
  id,
  title,
  author,
  date,
  size = 24,
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
      const shareMessage = `Check out this ${type} from TRUEVINE FELLOWSHIP Church!\n\n"${title}"${author ? `\nby ${author}` : ''}${date ? `\n${date}` : ''}\n\nOpen in the TRUEVINE FELLOWSHIP app:\n${deepLink}`;

      const result = await Share.share({
        message: shareMessage,
        title: `TRUEVINE FELLOWSHIP - ${title}`,
        url: deepLink,
      });

      if (onShare) {
        onShare(result);
      }

      // Log successful share for analytics
      console.log('Content shared via quick share:', { type, id, action: result.action });
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Share Error', 'Unable to share this content. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <IconButton
      icon="share-variant"
      size={size}
      iconColor={theme.colors.primary}
      onPress={handleShare}
      accessibilityLabel={`Share ${type}`}
      accessibilityHint={`Opens share dialog to share this ${type}`}
    />
  );
};
