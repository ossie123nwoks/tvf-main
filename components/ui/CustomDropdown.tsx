import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme as useCustomTheme } from '@/lib/theme/ThemeProvider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DropdownOption {
  id: string;
  label: string;
  value: any;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue?: any;
  onSelect?: (value: any) => void;
  placeholder: string;
  icon?: string;
  variant?: 'light' | 'dark';
  multiSelect?: boolean;
  selectedValues?: any[];
  onMultiSelect?: (values: any[]) => void;
}

export default function CustomDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder,
  icon,
  variant = 'light',
  multiSelect = false,
  selectedValues = [],
  onMultiSelect
}: CustomDropdownProps) {
  const paperTheme = useTheme();
  const { theme } = useCustomTheme();
  const [isVisible, setIsVisible] = useState(false);

  const isSelected = (value: any) => {
    if (multiSelect) {
      return selectedValues.includes(value);
    }
    return selectedValue === value;
  };

  const getSelectedLabel = () => {
    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option?.label || placeholder;
      }
      return `${selectedValues.length} selected`;
    }
    
    const option = options.find(opt => opt.value === selectedValue);
    return option?.label || placeholder;
  };

  const handleSelect = (value: any) => {
    if (multiSelect && onMultiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onMultiSelect(newValues);
    } else if (onSelect) {
      onSelect(value);
      setIsVisible(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginRight: 8,
    },
    button: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: variant === 'dark' ? '#374151' : '#FFFFFF',
      borderColor: variant === 'dark' ? '#4B5563' : '#E5E7EB',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      color: variant === 'dark' ? '#FFFFFF' : '#374151',
      flex: 1,
    },
    icon: {
      marginRight: 8,
      color: variant === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    chevron: {
      color: variant === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.md,
      width: '80%',
      maxWidth: 300,
      maxHeight: screenHeight * 0.6,
    },
    dropdownContent: {
      maxHeight: screenHeight * 0.5,
    },
    dropdownItem: {
      padding: theme.spacing.md,
      borderRadius: 8,
    },
    dropdownItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    dropdownItemText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    clearButton: {
      padding: theme.spacing.md,
      borderRadius: 8,
      marginTop: theme.spacing.xs,
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: 14,
      color: theme.colors.error,
      fontWeight: '500',
    },
  });

  return (
    <>
      <TouchableOpacity
        style={[styles.container]}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.button}>
          {icon && (
            <MaterialIcons 
              name={icon as any} 
              size={20} 
              style={styles.icon} 
            />
          )}
          <Text style={styles.buttonText} numberOfLines={1}>
            {getSelectedLabel()}
          </Text>
          <MaterialIcons 
            name="keyboard-arrow-down" 
            size={20} 
            style={styles.chevron} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <TouchableOpacity 
            style={styles.dropdownContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView 
              style={styles.dropdownContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    isSelected(option.value) && styles.dropdownItemSelected
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={styles.dropdownItemText}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {multiSelect && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  onMultiSelect?.([]);
                  setIsVisible(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
