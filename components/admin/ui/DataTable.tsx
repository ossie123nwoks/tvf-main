import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import EmptyState from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  key: string;
  title: string;
  flex?: number;
  width?: number;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  onRowPress?: (item: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRefresh,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display right now.',
  emptyIcon = 'inbox',
  onRowPress,
}: DataTableProps<T>) {
  const { theme } = useTheme();

  if (loading && (!data || data.length === 0)) {
    return <TableSkeleton rows={5} />;
  }

  const renderHeader = () => (
    <View
      style={[
        styles.headerRow,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {columns.map(col => (
        <View
          key={col.key}
          style={[styles.headerCell, col.flex ? { flex: col.flex } : { width: col.width }]}
        >
          <Text style={{ ...theme.typography.labelSmall, color: theme.colors.textSecondary }}>
            {col.title.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRow = ({ item, index }: { item: T; index: number }) => {
    const isLast = index === data.length - 1;

    const rowContent = (
      <View
        style={[
          styles.row,
          {
            borderBottomColor: theme.colors.borderLight,
            borderBottomWidth: isLast ? 0 : 1,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {columns.map(col => (
          <View
            key={col.key}
            style={[styles.cell, col.flex ? { flex: col.flex } : { width: col.width }]}
          >
            {col.render ? (
              col.render(item)
            ) : (
              <Text
                style={{ ...theme.typography.bodyMedium, color: theme.colors.text }}
                numberOfLines={1}
              >
                {String((item as any)[col.key] || '')}
              </Text>
            )}
          </View>
        ))}
      </View>
    );

    if (onRowPress) {
      return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => onRowPress(item)}>
          {rowContent}
        </TouchableOpacity>
      );
    }

    return rowContent;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
      ]}
    >
      {renderHeader()}

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 ? { flex: 1, justifyContent: 'center' } : {},
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={loading && data.length > 0}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              icon={emptyIcon as any}
              style={{ paddingVertical: 40 }}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    justifyContent: 'center',
    paddingRight: 16,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cell: {
    paddingRight: 16,
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
});
