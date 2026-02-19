import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Banner } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';

interface VerificationBannerProps {
  visible?: boolean;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({ visible }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = React.useState(false);

  // Only show if user is authenticated but not verified
  const shouldShow = visible !== false && user && !user.isEmailVerified && !dismissed;

  if (!shouldShow) {
    return null;
  }

  return (
    <Banner
      visible={shouldShow}
      actions={[
        {
          label: 'Verify Email',
          onPress: () => router.push('/email-verification'),
        },
        {
          label: 'Dismiss',
          onPress: () => setDismissed(true),
        },
      ]}
      icon="email-alert"
      style={styles.banner}
    >
      Please verify your email address to access all features. Check your inbox for the verification link.
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginBottom: 0,
  },
});


