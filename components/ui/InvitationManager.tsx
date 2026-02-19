import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  useTheme as usePaperTheme,
  Portal,
  Modal,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useInvitations } from '@/lib/hooks/useInvitations';
import { AppInvitation, InvitationInput } from '@/lib/services/invitationService';
import { MaterialIcons } from '@expo/vector-icons';

interface InvitationManagerProps {
  onClose?: () => void;
}

export default function InvitationManager({ onClose }: InvitationManagerProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const {
    invitations,
    stats,
    loading,
    error,
    createInvitation,
    sendInvitation,
    refreshInvitations,
  } = useInvitations();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<AppInvitation | null>(null);
  const [newInvitation, setNewInvitation] = useState<InvitationInput>({
    recipientEmail: '',
    recipientPhone: '',
    recipientName: '',
    message: '',
    platform: 'universal',
    expiresInDays: 30,
  });

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
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsCard: {
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.lg,
    },
    statsContent: {
      padding: theme.spacing.md,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    statItem: {
      backgroundColor: theme.colors.cardBackground,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      minWidth: '45%',
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    invitationCard: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
    },
    invitationContent: {
      padding: theme.spacing.md,
    },
    invitationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    invitationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    invitationMeta: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    invitationCode: {
      fontSize: 12,
      color: theme.colors.primary,
      fontFamily: 'monospace',
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.xs,
      marginBottom: theme.spacing.sm,
    },
    invitationActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
    },
    platformSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    platformChip: {
      marginBottom: theme.spacing.sm,
    },
    button: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      height: 48,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyStateIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'sent':
        return theme.colors.info;
      case 'delivered':
        return theme.colors.primary;
      case 'opened':
        return theme.colors.secondary;
      case 'installed':
        return theme.colors.success;
      case 'expired':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'sent':
        return 'send';
      case 'delivered':
        return 'inbox';
      case 'opened':
        return 'visibility';
      case 'installed':
        return 'check-circle';
      case 'expired':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleCreateInvitation = async () => {
    if (!newInvitation.recipientEmail && !newInvitation.recipientPhone) {
      Alert.alert('Error', 'Please provide either an email address or phone number.');
      return;
    }

    try {
      const invitation = await createInvitation(newInvitation);
      setShowCreateModal(false);
      setNewInvitation({
        recipientEmail: '',
        recipientPhone: '',
        recipientName: '',
        message: '',
        platform: 'universal',
        expiresInDays: 30,
      });
      Alert.alert('Success', 'Invitation created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create invitation. Please try again.');
    }
  };

  const handleSendInvitation = async (invitation: AppInvitation, method: 'email' | 'sms' | 'whatsapp' | 'telegram') => {
    try {
      await sendInvitation(invitation, method);
      setShowSendModal(false);
      setSelectedInvitation(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleCopyInvitationCode = (code: string) => {
    // In a real app, you'd use Clipboard.setStringAsync
    Alert.alert('Invitation Code', `Code: ${code}\n\nCopy this code to share with others.`);
  };

  if (loading && invitations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
          Loading invitations...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Friends</Text>
          <Text style={styles.subtitle}>
            Share TRUEVINE FELLOWSHIP Church with your friends and family.
          </Text>
        </View>

        {/* Statistics */}
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <Text style={styles.statsTitle}>Your Invitation Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalInvitations}</Text>
                  <Text style={styles.statLabel}>Total Sent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.installedInvitations}</Text>
                  <Text style={styles.statLabel}>Installed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.conversionRate.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.pendingInvitations}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Create Invitation Button */}
        <Button
          mode="contained"
          onPress={() => setShowCreateModal(true)}
          style={[styles.button, styles.primaryButton]}
          buttonColor={theme.colors.primary}
          textColor="#FFFFFF"
          icon="plus"
        >
          Create New Invitation
        </Button>

        {/* Invitations List */}
        <Text style={styles.sectionTitle}>Your Invitations</Text>
        
        {invitations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="person-add"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>
              You haven't sent any invitations yet.
            </Text>
            <Text style={[styles.emptyStateText, { marginTop: theme.spacing.sm }]}>
              Create your first invitation to get started!
            </Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} style={styles.invitationCard}>
              <Card.Content style={styles.invitationContent}>
                <View style={styles.invitationHeader}>
                  <Text style={styles.invitationTitle}>
                    {invitation.recipientName || invitation.recipientEmail || invitation.recipientPhone}
                  </Text>
                  <Chip
                    icon={getStatusIcon(invitation.status)}
                    textStyle={{ color: getStatusColor(invitation.status) }}
                    style={{ backgroundColor: getStatusColor(invitation.status) + '20' }}
                  >
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </Chip>
                </View>
                
                <Text style={styles.invitationMeta}>
                  Platform: {invitation.platform} • Expires: {formatDate(invitation.expiresAt)}
                </Text>
                
                <Text style={styles.invitationCode}>
                  Code: {invitation.invitationCode}
                </Text>
                
                {invitation.message && (
                  <Text style={styles.invitationMeta}>
                    Message: {invitation.message}
                  </Text>
                )}
                
                <View style={styles.invitationActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleCopyInvitationCode(invitation.invitationCode)}
                    style={styles.actionButton}
                    textColor={theme.colors.primary}
                    icon="content-copy"
                    compact
                  >
                    Copy Code
                  </Button>
                  
                  {invitation.status === 'pending' && (
                    <Button
                      mode="contained"
                      onPress={() => {
                        setSelectedInvitation(invitation);
                        setShowSendModal(true);
                      }}
                      style={styles.actionButton}
                      buttonColor={theme.colors.primary}
                      textColor="#FFFFFF"
                      icon="send"
                      compact
                    >
                      Send
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Refresh Button */}
        <Button
          mode="outlined"
          onPress={refreshInvitations}
          style={[styles.button, styles.secondaryButton]}
          textColor={theme.colors.primary}
          icon="refresh"
        >
          Refresh
        </Button>

        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={[styles.button, styles.secondaryButton]}
            textColor={theme.colors.primary}
          >
            Close
          </Button>
        )}
      </ScrollView>

      {/* Create Invitation Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Create New Invitation</Text>
          
          <TextInput
            label="Recipient Name (optional)"
            value={newInvitation.recipientName}
            onChangeText={(text) => setNewInvitation({ ...newInvitation, recipientName: text })}
            style={styles.input}
            mode="outlined"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <TextInput
            label="Email Address"
            value={newInvitation.recipientEmail}
            onChangeText={(text) => setNewInvitation({ ...newInvitation, recipientEmail: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <TextInput
            label="Phone Number (optional)"
            value={newInvitation.recipientPhone}
            onChangeText={(text) => setNewInvitation({ ...newInvitation, recipientPhone: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <TextInput
            label="Personal Message (optional)"
            value={newInvitation.message}
            onChangeText={(text) => setNewInvitation({ ...newInvitation, message: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            theme={{
              ...paperTheme,
              colors: {
                ...paperTheme.colors,
                primary: theme.colors.primary,
                onSurface: theme.colors.text,
              },
            }}
          />

          <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: theme.spacing.sm }]}>
            Target Platform
          </Text>
          <View style={styles.platformSelector}>
            {['universal', 'ios', 'android', 'web'].map((platform) => (
              <Chip
                key={platform}
                selected={newInvitation.platform === platform}
                onPress={() => setNewInvitation({ ...newInvitation, platform: platform as any })}
                style={styles.platformChip}
                textStyle={{ color: theme.colors.text }}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Chip>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateModal(false)}
              style={[styles.button, { flex: 1 }]}
              textColor={theme.colors.primary}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateInvitation}
              style={[styles.button, { flex: 1 }]}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Send Invitation Modal */}
      <Portal>
        <Modal
          visible={showSendModal}
          onDismiss={() => setShowSendModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Send Invitation</Text>
          
          {selectedInvitation && (
            <>
              <Text style={styles.invitationMeta}>
                To: {selectedInvitation.recipientName || selectedInvitation.recipientEmail || selectedInvitation.recipientPhone}
              </Text>
              
              <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: theme.spacing.sm }]}>
                Choose how to send
              </Text>
              
              <View style={{ gap: theme.spacing.sm }}>
                {selectedInvitation.recipientEmail && (
                  <Button
                    mode="outlined"
                    onPress={() => handleSendInvitation(selectedInvitation, 'email')}
                    textColor={theme.colors.primary}
                    icon="email"
                  >
                    Send via Email
                  </Button>
                )}
                
                {selectedInvitation.recipientPhone && (
                  <Button
                    mode="outlined"
                    onPress={() => handleSendInvitation(selectedInvitation, 'sms')}
                    textColor={theme.colors.primary}
                    icon="message"
                  >
                    Send via SMS
                  </Button>
                )}
                
                <Button
                  mode="outlined"
                  onPress={() => handleSendInvitation(selectedInvitation, 'whatsapp')}
                  textColor={theme.colors.primary}
                  icon="whatsapp"
                >
                  Send via WhatsApp
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={() => handleSendInvitation(selectedInvitation, 'telegram')}
                  textColor={theme.colors.primary}
                  icon="telegram"
                >
                  Send via Telegram
                </Button>
              </View>
              
              <Button
                mode="outlined"
                onPress={() => setShowSendModal(false)}
                style={[styles.button, { marginTop: theme.spacing.lg }]}
                textColor={theme.colors.primary}
              >
                Cancel
              </Button>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}
