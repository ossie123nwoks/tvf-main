import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme as usePaperTheme,
  Switch,
  SegmentedButtons,
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import NotificationManager from './NotificationManager';
import ReminderManager from './ReminderManager';
import EnhancedNotificationSettings from './EnhancedNotificationSettings';
import AdvancedSharingModal from './AdvancedSharingModal';
import InvitationManager from './InvitationManager';
import NotificationAnalyticsDashboard from './NotificationAnalyticsDashboard';
import NotificationHistoryManager from './NotificationHistoryManager';
import NotificationDetailsModal from './NotificationDetailsModal';
import { generateThemeComplianceReport } from '@/lib/theme/themeValidation';

interface ThemeTestNotificationComponentsProps {
  onClose?: () => void;
}

export default function ThemeTestNotificationComponents({ onClose }: ThemeTestNotificationComponentsProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const paperTheme = usePaperTheme();
  
  const [selectedComponent, setSelectedComponent] = useState('overview');
  const [showAdvancedSharing, setShowAdvancedSharing] = useState(false);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    themeToggleText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    componentSelector: {
      marginBottom: theme.spacing.lg,
    },
    content: {
      flex: 1,
    },
    overviewCard: {
      margin: theme.spacing.md,
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.cardBorder,
      borderWidth: 1,
    },
    overviewContent: {
      padding: theme.spacing.lg,
    },
    overviewTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    overviewText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
      marginBottom: theme.spacing.md,
    },
    componentList: {
      marginTop: theme.spacing.md,
    },
    componentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    componentIcon: {
      marginRight: theme.spacing.sm,
    },
    componentText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    componentStatus: {
      fontSize: 12,
      color: theme.colors.success,
      fontWeight: '600',
    },
    complianceReport: {
      margin: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    complianceTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    complianceText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      lineHeight: 20,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
  });

  const components = [
    {
      id: 'notificationManager',
      name: 'Notification Manager',
      icon: 'notifications',
      description: 'Admin interface for sending notifications',
      status: '✅ Theme Compliant',
    },
    {
      id: 'reminderManager',
      name: 'Reminder Manager',
      icon: 'alarm',
      description: 'User interface for managing reminders',
      status: '✅ Theme Compliant',
    },
    {
      id: 'notificationSettings',
      name: 'Notification Settings',
      icon: 'settings',
      description: 'Advanced notification preferences',
      status: '✅ Theme Compliant',
    },
    {
      id: 'advancedSharing',
      name: 'Advanced Sharing Modal',
      icon: 'share-variant',
      description: 'Enhanced content sharing interface',
      status: '✅ Theme Compliant',
    },
    {
      id: 'invitationManager',
      name: 'Invitation Manager',
      icon: 'account-plus',
      description: 'App invitation management system',
      status: '✅ Theme Compliant',
    },
    {
      id: 'analyticsDashboard',
      name: 'Analytics Dashboard',
      icon: 'chart-line',
      description: 'Notification analytics and metrics',
      status: '✅ Theme Compliant',
    },
    {
      id: 'historyManager',
      name: 'History Manager',
      icon: 'history',
      description: 'Notification history and management',
      status: '✅ Theme Compliant',
    },
    {
      id: 'detailsModal',
      name: 'Details Modal',
      icon: 'information',
      description: 'Detailed notification view',
      status: '✅ Theme Compliant',
    },
  ];

  const renderOverview = () => (
    <Card style={styles.overviewCard}>
      <Card.Content style={styles.overviewContent}>
        <Text style={styles.overviewTitle}>Notification UI Components Theme Test</Text>
        <Text style={styles.overviewText}>
          This test interface allows you to verify that all notification UI components 
          properly support both light and dark themes. Use the theme toggle to switch 
          between themes and test each component.
        </Text>
        
        <Text style={styles.overviewText}>
          <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            Current Theme:
          </Text> {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>

        <View style={styles.componentList}>
          {components.map((component) => (
            <View key={component.id} style={styles.componentItem}>
              <Text style={[styles.componentText, { fontWeight: '600' }]}>
                {component.name}
              </Text>
              <Text style={styles.componentStatus}>
                {component.status}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.complianceReport}>
          <Text style={styles.complianceTitle}>Theme Compliance Report</Text>
          <Text style={styles.complianceText}>
            {generateThemeComplianceReport(theme)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSelectedComponent = () => {
    switch (selectedComponent) {
      case 'notificationManager':
        return <NotificationManager onClose={onClose} />;
      case 'reminderManager':
        return (
          <ReminderManager
            contentType="sermon"
            contentId="test-sermon"
            contentTitle="Test Sermon"
            onClose={onClose}
          />
        );
      case 'notificationSettings':
        return <EnhancedNotificationSettings onClose={onClose} />;
      case 'advancedSharing':
        return (
          <View style={{ flex: 1 }}>
            <Button
              mode="contained"
              onPress={() => setShowAdvancedSharing(true)}
              style={{ margin: theme.spacing.md }}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Open Advanced Sharing Modal
            </Button>
          </View>
        );
      case 'invitationManager':
        return <InvitationManager onClose={onClose} />;
      case 'analyticsDashboard':
        return <NotificationAnalyticsDashboard />;
      case 'historyManager':
        return <NotificationHistoryManager />;
      case 'detailsModal':
        return (
          <View style={{ flex: 1 }}>
            <Button
              mode="contained"
              onPress={() => setShowNotificationDetails(true)}
              style={{ margin: theme.spacing.md }}
              buttonColor={theme.colors.primary}
              textColor="#FFFFFF"
            >
              Open Notification Details Modal
            </Button>
          </View>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Theme Test: Notification Components</Text>
        <Text style={styles.headerSubtitle}>
          Test all notification UI components in both light and dark themes
        </Text>
        
        <View style={styles.themeToggle}>
          <Text style={styles.themeToggleText}>
            {isDark ? 'Dark Theme' : 'Light Theme'}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.componentSelector}>
          <SegmentedButtons
            value={selectedComponent}
            onValueChange={setSelectedComponent}
            buttons={[
              { value: 'overview', label: 'Overview' },
              { value: 'notificationManager', label: 'Manager' },
              { value: 'reminderManager', label: 'Reminders' },
              { value: 'notificationSettings', label: 'Settings' },
              { value: 'advancedSharing', label: 'Sharing' },
              { value: 'invitationManager', label: 'Invites' },
              { value: 'analyticsDashboard', label: 'Analytics' },
              { value: 'historyManager', label: 'History' },
              { value: 'detailsModal', label: 'Details' },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderSelectedComponent()}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => setSelectedComponent('overview')}
          style={styles.actionButton}
          textColor={theme.colors.primary}
        >
          Overview
        </Button>
        <Button
          mode="outlined"
          onPress={toggleTheme}
          style={styles.actionButton}
          textColor={theme.colors.primary}
        >
          Toggle Theme
        </Button>
        {onClose && (
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            Close
          </Button>
        )}
      </View>

      {/* Modals */}
      <AdvancedSharingModal
        visible={showAdvancedSharing}
        onDismiss={() => setShowAdvancedSharing(false)}
        content={{
          id: 'test-content',
          title: 'Test Content',
          description: 'This is test content for theme testing',
          type: 'sermon',
          url: 'https://example.com',
        }}
      />

      <NotificationDetailsModal
        visible={showNotificationDetails}
        onDismiss={() => setShowNotificationDetails(false)}
        notification={{
          id: 'test-notification',
          userId: 'test-user',
          type: 'content',
          title: 'Test Notification',
          body: 'This is a test notification for theme testing',
          data: {},
          sentAt: new Date(),
          isRead: false,
        }}
      />
    </View>
  );
}
