import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme as usePaperTheme,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
  Badge,
  FAB,
  Menu,
  List,
  Dialog,
  Portal,
  TextInput,
  SegmentedButtons,
  Switch,
  Searchbar
} from 'react-native-paper';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { CategorizationService, CategoryHierarchy } from '@/lib/services/categorization';
import { Category } from '@/types/content';

interface CategoryManagerProps {
  onCategorySelect?: (categoryId: string) => void;
  showCreateButton?: boolean;
  showAnalytics?: boolean;
  maxDepth?: number;
}

export default function CategoryManager({
  onCategorySelect,
  showCreateButton = true,
  showAnalytics = true,
  maxDepth = 3
}: CategoryManagerProps) {
  const { theme } = useTheme();
  const [categories, setCategories] = useState<CategoryHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [analyticsDialogVisible, setAnalyticsDialogVisible] = useState(false);
  
  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196F3',
    icon: 'folder',
    parentId: '',
    sortOrder: 0,
    is_active: true
  });

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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    categoryList: {
      padding: theme.spacing.lg,
    },
    categoryCard: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    categoryInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    categoryName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    categoryDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    categoryMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    categoryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    subcategories: {
      marginLeft: theme.spacing.lg,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.border,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: theme.spacing.md,
      right: 0,
      bottom: 0,
    },
    dialogContent: {
      padding: theme.spacing.md,
    },
    formField: {
      marginBottom: theme.spacing.md,
    },
    colorPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    iconSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    iconOption: {
      padding: theme.spacing.sm,
      borderRadius: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
    },
    selectedIcon: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    selectedIconText: {
      color: '#FFFFFF',
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      lineHeight: 20,
    },
    metaText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoryHierarchy = await CategorizationService.getCategoryHierarchy();
      setCategories(categoryHierarchy);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
    setSelectedCategory(categoryId);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = () => {
    setFormData({
      name: '',
      description: '',
      color: '#2196F3',
      icon: 'folder',
      parentId: '',
      sortOrder: 0,
      is_active: true
    });
    setCreateDialogVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId || '',
      sortOrder: category.sortOrder,
      is_active: category.is_active
    });
    setEditDialogVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setEditingCategory(category);
    setDeleteDialogVisible(true);
  };

  const handleViewAnalytics = (category: Category) => {
    setEditingCategory(category);
    setAnalyticsDialogVisible(true);
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        // Update existing category
        await CategorizationService.updateCategory(editingCategory.id, formData);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        // Create new category
        await CategorizationService.createCategory(formData);
        Alert.alert('Success', 'Category created successfully');
      }
      
      setCreateDialogVisible(false);
      setEditDialogVisible(false);
      loadCategories(); // Reload categories
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    }
  };

  const deleteCategory = async () => {
    if (!editingCategory) return;
    
    try {
      await CategorizationService.deleteCategory(editingCategory.id);
      Alert.alert('Success', 'Category deleted successfully');
      setDeleteDialogVisible(false);
      loadCategories(); // Reload categories
    } catch (error) {
      console.error('Failed to delete category:', error);
      Alert.alert('Error', 'Failed to delete category. Please try again.');
    }
  };

  const renderCategory = (category: CategoryHierarchy, depth = 0): React.ReactNode => {
    if (depth > maxDepth) return null;
    
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;
    const isSelected = selectedCategory === category.id;

    return (
      <View key={category.id}>
        <Card
          style={[
            styles.categoryCard,
            isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
          ]}
          onPress={() => handleCategoryPress(category.id)}
        >
          <View style={styles.categoryHeader}>
            <MaterialIcons
              name={category.icon as any}
              size={24}
              color={category.color}
            />
            
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {category.description}
              </Text>
              
              <View style={styles.categoryMeta}>
                <Chip icon="content-copy">
                  {category.contentCount} items
                </Chip>
                {category.subcategoryCount > 0 && (
                  <Chip icon="folder">
                    {category.subcategoryCount} subcategories
                  </Chip>
                )}
                {!category.is_active && (
                  <Badge size={16}>Inactive</Badge>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {hasChildren && (
                <IconButton
                  icon={isExpanded ? 'expand-less' : 'expand-more'}
                  onPress={() => toggleCategoryExpansion(category.id)}
                />
              )}
              
              <Menu
                visible={false}
                onDismiss={() => {}}
                anchor={
                  <IconButton
                    icon="more-vert"
                    onPress={() => {}}
                  />
                }
              >
                <Menu.Item
                  leadingIcon="edit"
                  title="Edit"
                  onPress={() => handleEditCategory(category)}
                />
                <Menu.Item
                  leadingIcon="analytics"
                  title="Analytics"
                  onPress={() => handleViewAnalytics(category)}
                />
                <Menu.Item
                  leadingIcon="delete"
                  title="Delete"
                  onPress={() => handleDeleteCategory(category)}
                />
              </Menu>
            </View>
          </View>

          {showAnalytics && (
            <View style={styles.categoryStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{category.contentCount}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {category.children.length}
                </Text>
                <Text style={styles.statLabel}>Subcategories</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="content-copy"
              onPress={() => handleCategoryPress(category.id)}
              style={styles.actionButton}
            >
              View Content
            </Button>
            <Button
              mode="outlined"
              icon="edit"
              onPress={() => handleEditCategory(category)}
              style={styles.actionButton}
            >
              Edit
            </Button>
          </View>
        </Card>

        {/* Render subcategories */}
        {hasChildren && isExpanded && (
          <View style={styles.subcategories}>
            {category.children.map(child => renderCategory(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Also check children
    const childrenMatch = category.children.some(child =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return matchesSearch || childrenMatch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.metaText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons 
          name="error" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadCategories}>
          Retry
        </Button>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons 
          name="folder-open" 
          size={64} 
          color={theme.colors.textSecondary} 
        />
        <Text style={styles.emptyText}>No categories found</Text>
        {showCreateButton && (
          <Button mode="contained" onPress={handleCreateCategory}>
            Create First Category
          </Button>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          Organize and manage your content categories
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search categories..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          icon="magnify"
        />
      </View>

      <ScrollView style={styles.categoryList}>
        {filteredCategories.map(category => renderCategory(category))}
      </ScrollView>

      {/* Create Category Dialog */}
      <Portal>
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>Create New Category</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Category Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.formField}
            />
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              style={styles.formField}
            />
            <TextInput
              label="Sort Order"
              value={formData.sortOrder.toString()}
              onChangeText={(text) => setFormData({ ...formData, sortOrder: parseInt(text) || 0 })}
              keyboardType="numeric"
              style={styles.formField}
            />
            <View style={styles.formField}>
              <Text>Active</Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData({ ...formData, is_active: value })}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveCategory}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Category Dialog */}
      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
        >
          <Dialog.Title>Edit Category</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Category Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.formField}
            />
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              style={styles.formField}
            />
            <TextInput
              label="Sort Order"
              value={formData.sortOrder.toString()}
              onChangeText={(text) => setFormData({ ...formData, sortOrder: parseInt(text) || 0 })}
              keyboardType="numeric"
              style={styles.formField}
            />
            <View style={styles.formField}>
              <Text>Active</Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData({ ...formData, is_active: value })}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveCategory}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{editingCategory?.name}"? 
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={deleteCategory} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Analytics Dialog */}
      <Portal>
        <Dialog
          visible={analyticsDialogVisible}
          onDismiss={() => setAnalyticsDialogVisible(false)}
        >
          <Dialog.Title>Category Analytics</Dialog.Title>
          <Dialog.Content>
            <Text>Analytics for {editingCategory?.name}</Text>
            {/* TODO: Implement analytics display */}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAnalyticsDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showCreateButton && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreateCategory}
        />
      )}
    </View>
  );
}
