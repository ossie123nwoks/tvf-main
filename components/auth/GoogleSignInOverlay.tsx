import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface GoogleSignInOverlayProps {
  visible: boolean;
}

export const GoogleSignInOverlay: React.FC<GoogleSignInOverlayProps> = ({ visible }) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 280,
      maxWidth: '80%',
      ...theme.shadows.large,
    },
    iconContainer: {
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <MaterialIcons 
                name="account-circle" 
                size={48} 
                color={theme.colors.primary} 
              />
            </View>
          </View>
          <Text style={styles.title}>Signing in with Google</Text>
          <Text style={styles.message}>
            Please wait while we authenticate your account...
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GoogleSignInOverlay;


