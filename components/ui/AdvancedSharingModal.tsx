import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Text,
  Button,
  IconButton,
  TextInput,
  useTheme as usePaperTheme,
  Divider,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useSharing } from '@/lib/hooks/useSharing';
import { ShareContent, ShareOptions } from '@/lib/services/sharingService';
import { MaterialIcons } from '@expo/vector-icons';

interface AdvancedSharingModalProps {
  visible: boolean;
  onDismiss: () => void;
  content: ShareContent;
  onShareSuccess?: (result: any) => void;
}

interface SharingMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  requiresInput?: boolean;
  inputType?: 'email' | 'phone';
  inputPlaceholder?: string;
}

export default function AdvancedSharingModal({
  visible,
  onDismiss,
  content,
  onShareSuccess,
}: AdvancedSharingModalProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { sharing, availableMethods, shareContent, loadAvailableMethods } = useSharing();
  
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);

  const sharingMethods: SharingMethod[] = [
    {
      id: 'native',
      name: 'Share',
      icon: 'share-variant',
      color: theme.colors.primary,
      description: 'Use your device\'s built-in sharing options',
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: 'content-copy',
      color: theme.colors.secondary,
      description: 'Copy the link to your clipboard',
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'email',
      color: '#EA4335',
      description: 'Send via email',
      requiresInput: true,
      inputType: 'email',
      inputPlaceholder: 'Enter email address (optional)',
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: 'message-text',
      color: '#34A853',
      description: 'Send via text message',
      requiresInput: true,
      inputType: 'phone',
      inputPlaceholder: 'Enter phone number (optional)',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      description: 'Share on WhatsApp',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'telegram',
      color: '#0088CC',
      description: 'Share on Telegram',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      description: 'Share on Twitter',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      description: 'Share on Facebook',
    },
  ];

  const styles = StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      padding: theme.spacing.lg,
    },
    contentPreview: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    contentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    contentMeta: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    contentDescription: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    methodsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    methodCard: {
      width: '48%',
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      alignItems: 'center',
    },
    selectedMethodCard: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      backgroundColor: theme.colors.primaryContainer,
    },
    methodIcon: {
      marginBottom: theme.spacing.sm,
    },
    methodName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    methodDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    inputSection: {
      marginBottom: theme.spacing.lg,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    textInput: {
      backgroundColor: theme.colors.cardBackground,
      marginBottom: theme.spacing.sm,
    },
    customMessageToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    toggleText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
    },
  });

  // Load available methods when modal opens
  useEffect(() => {
    if (visible) {
      loadAvailableMethods();
    }
  }, [visible, loadAvailableMethods]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedMethod('');
      setCustomMessage('');
      setRecipientInput('');
      setShowCustomMessage(false);
    }
  }, [visible]);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleShare = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Method', 'Please select a sharing method first.');
      return;
    }

    const selectedMethodInfo = sharingMethods.find(m => m.id === selectedMethod);
    if (!selectedMethodInfo) {
      Alert.alert('Error', 'Invalid sharing method selected.');
      return;
    }

    const shareOptions: ShareOptions = {
      method: selectedMethod as any,
      customMessage: showCustomMessage ? customMessage : undefined,
    };

    // Add recipient information if required
    if (selectedMethodInfo.requiresInput && recipientInput.trim()) {
      if (selectedMethodInfo.inputType === 'email') {
        shareOptions.recipientEmail = recipientInput.trim();
      } else if (selectedMethodInfo.inputType === 'phone') {
        shareOptions.recipientPhone = recipientInput.trim();
      }
    }

    try {
      const result = await shareContent(content, shareOptions);
      
      if (result.success && onShareSuccess) {
        onShareSuccess(result);
      }
      
      if (result.success) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const getMethodIcon = (iconName: string) => {
    // Map icon names to MaterialIcons
    const iconMap: Record<string, string> = {
      'share-variant': 'share',
      'content-copy': 'content-copy',
      'email': 'email',
      'message-text': 'message',
      'whatsapp': 'whatsapp',
      'telegram': 'telegram',
      'twitter': 'twitter',
      'facebook': 'facebook',
    };
    
    return iconMap[iconName] || 'share';
  };

  const filteredMethods = sharingMethods.filter(method => 
    availableMethods.includes(method.id)
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Content</Text>
          <IconButton
            icon="close"
            size={24}
            iconColor={theme.colors.text}
            onPress={onDismiss}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Content Preview */}
          <View style={styles.contentPreview}>
            <Text style={styles.contentTitle}>{content.title}</Text>
            <Text style={styles.contentMeta}>
              {content.type === 'sermon' ? 'Sermon' : 'Article'}
              {content.author && ` • by ${content.author}`}
              {content.date && ` • ${content.date}`}
            </Text>
            {content.description && (
              <Text style={styles.contentDescription} numberOfLines={3}>
                {content.description}
              </Text>
            )}
          </View>

          {/* Custom Message Toggle */}
          <View style={styles.customMessageToggle}>
            <IconButton
              icon={showCustomMessage ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => setShowCustomMessage(!showCustomMessage)}
            />
            <Text style={styles.toggleText}>Add a custom message</Text>
          </View>

          {/* Custom Message Input */}
          {showCustomMessage && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Custom Message</Text>
              <TextInput
                mode="outlined"
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="Add your personal message..."
                multiline
                numberOfLines={3}
                style={styles.textInput}
                theme={{
                  ...paperTheme,
                  colors: {
                    ...paperTheme.colors,
                    primary: theme.colors.primary,
                    onSurface: theme.colors.text,
                  },
                }}
              />
            </View>
          )}

          {/* Sharing Methods */}
          <Text style={styles.sectionTitle}>Choose how to share</Text>
          <View style={styles.methodsGrid}>
            {filteredMethods.map((method) => (
              <Card
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.selectedMethodCard,
                ]}
                onPress={() => handleMethodSelect(method.id)}
              >
                <MaterialIcons
                  name={getMethodIcon(method.icon) as any}
                  size={32}
                  color={method.color}
                  style={styles.methodIcon}
                />
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </Card>
            ))}
          </View>

          {/* Recipient Input */}
          {selectedMethod && 
           sharingMethods.find(m => m.id === selectedMethod)?.requiresInput && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {sharingMethods.find(m => m.id === selectedMethod)?.inputType === 'email' 
                  ? 'Email Address' 
                  : 'Phone Number'
                } (Optional)
              </Text>
              <TextInput
                mode="outlined"
                value={recipientInput}
                onChangeText={setRecipientInput}
                placeholder={sharingMethods.find(m => m.id === selectedMethod)?.inputPlaceholder}
                keyboardType={
                  sharingMethods.find(m => m.id === selectedMethod)?.inputType === 'email'
                    ? 'email-address'
                    : 'phone-pad'
                }
                style={styles.textInput}
                theme={{
                  ...paperTheme,
                  colors: {
                    ...paperTheme.colors,
                    primary: theme.colors.primary,
                    onSurface: theme.colors.text,
                  },
                }}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.secondaryButton}
              textColor={theme.colors.text}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleShare}
              disabled={!selectedMethod || sharing}
              style={styles.primaryButton}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {sharing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: '#FFFFFF', marginTop: theme.spacing.sm }}>
              Sharing...
            </Text>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
