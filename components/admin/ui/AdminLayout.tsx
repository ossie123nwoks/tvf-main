import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeProvider';
import AdminSidebar from '../AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function AdminLayout({ children, scrollable = true }: AdminLayoutProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Global layout wrapper
  const content = (
    <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContentContainer]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.innerContainer}>{children}</View>
      )}
    </View>
  );

  if (isTablet) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <AdminSidebar />
        {content}
      </View>
    );
  }

  // Mobile layout
  return <View style={[styles.root, { backgroundColor: theme.colors.background }]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
  },
});
