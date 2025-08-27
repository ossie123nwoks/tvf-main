import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Searchbar, Chip, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  showSuggestions?: boolean;
  filters?: Array<{
    id: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  }>;
  showFilters?: boolean;
}

export default function SearchBar({
  placeholder = 'Search content...',
  value,
  onChangeText,
  onSearch,
  suggestions = [],
  onSuggestionPress,
  showSuggestions = false,
  filters = [],
  showFilters = false
}: SearchBarProps) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    searchBar: {
      backgroundColor: theme.colors.surface,
      borderColor: isFocused ? theme.colors.primary : theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      ...(isFocused ? theme.shadows.medium : theme.shadows.small),
    },
    searchInput: {
      color: theme.colors.text,
      fontSize: 16,
    },
    placeholder: {
      color: theme.colors.textSecondary,
    },
    suggestions: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.xs,
      maxHeight: 200,
      ...theme.shadows.medium,
    },
    suggestion: {
      padding: theme.spacing.sm,
      borderBottomColor: theme.colors.borderLight,
      borderBottomWidth: 1,
    },
    suggestionText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    filterChip: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
    },
    selectedFilterChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.textSecondary,
    },
    selectedFilterChipText: {
      color: '#FFFFFF',
    },
  });

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSubmit = useCallback(() => {
    if (onSearch && value.trim()) {
      onSearch(value.trim());
    }
  }, [onSearch, value]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    onChangeText(suggestion);
    if (onSuggestionPress) {
      onSuggestionPress(suggestion);
    }
  }, [onChangeText, onSuggestionPress]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        onSubmitEditing={handleSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        placeholderTextColor={theme.colors.textSecondary}
        iconColor={theme.colors.textSecondary}
        theme={{
          ...paperTheme,
          colors: {
            ...paperTheme.colors,
            primary: theme.colors.primary,
            surface: theme.colors.surface,
            onSurface: theme.colors.text,
          },
        }}
      />

      {showSuggestions && suggestions.length > 0 && isFocused && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestion}>
              <MaterialIcons
                name="search"
                size={16}
                color={theme.colors.textSecondary}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text 
                style={styles.suggestionText}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}

      {showFilters && filters.length > 0 && (
        <View style={styles.filters}>
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              selected={filter.selected}
              onPress={filter.onPress}
              style={[
                styles.filterChip,
                filter.selected && styles.selectedFilterChip
              ]}
              textStyle={[
                styles.filterChipText,
                filter.selected && styles.selectedFilterChipText
              ]}
              compact
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}
