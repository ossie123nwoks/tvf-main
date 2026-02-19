import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
  Divider,
  ActivityIndicator,
  FAB,
  Switch,
  Dialog,
  Portal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { AdminService } from '@/lib/supabase/admin';
import { ImageUploadService } from '@/lib/services/imageUploadService';

interface CarouselImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const CarouselManagementSection: React.FC = () => {
  const { theme } = useTheme();
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    loadCarouselImages();
  }, []);

  const loadCarouselImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const images = await AdminService.getCarouselImages();
      setCarouselImages(images);
    } catch (err) {
      console.error('Failed to load carousel images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load carousel images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingImage(null);
    setImageUrl('');
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setIsActive(true);
    setDisplayOrder(carouselImages.length);
    setShowDialog(true);
  };

  const handleEdit = (image: CarouselImage) => {
    setEditingImage(image);
    setImageUrl(image.image_url);
    setTitle(image.title || '');
    setDescription(image.description || '');
    setLinkUrl(image.link_url || '');
    setIsActive(image.is_active);
    setDisplayOrder(image.display_order);
    setShowDialog(true);
  };

  const handleImagePick = async () => {
    try {
      setUploading(true);
      
      // Pick image from library
      const pickResult = await ImageUploadService.pickImage({
        quality: 0.9,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      if (pickResult.canceled || !pickResult.assets || !pickResult.assets[0]) {
        setUploading(false);
        return;
      }

      const asset = pickResult.assets[0];
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = `carousel_${timestamp}.jpg`;

      // Upload image
      const uploadResult = await ImageUploadService.uploadImage(asset.uri, fileName, {
        folder: 'carousel',
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.9,
      });

      if (uploadResult.success && uploadResult.url) {
        setImageUrl(uploadResult.url);
        Alert.alert('Success', 'Image uploaded successfully');
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      Alert.alert('Error', 'Please upload an image');
      return;
    }

    try {
      if (editingImage) {
        await AdminService.updateCarouselImage(editingImage.id, {
          image_url: imageUrl,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          link_url: linkUrl.trim() || undefined,
          display_order: displayOrder,
          is_active: isActive,
        });
        Alert.alert('Success', 'Carousel image updated successfully');
      } else {
        await AdminService.createCarouselImage({
          image_url: imageUrl,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          link_url: linkUrl.trim() || undefined,
          display_order: displayOrder,
          is_active: isActive,
        });
        Alert.alert('Success', 'Carousel image created successfully');
      }
      setShowDialog(false);
      loadCarouselImages();
    } catch (err) {
      console.error('Failed to save carousel image:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save carousel image');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Carousel Image',
      'Are you sure you want to delete this carousel image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deleteCarouselImage(id);
              Alert.alert('Success', 'Carousel image deleted successfully');
              loadCarouselImages();
            } catch (err) {
              console.error('Failed to delete carousel image:', err);
              Alert.alert('Error', 'Failed to delete carousel image');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (image: CarouselImage) => {
    try {
      await AdminService.updateCarouselImage(image.id, {
        is_active: !image.is_active,
      });
      loadCarouselImages();
    } catch (err) {
      console.error('Failed to toggle carousel image:', err);
      Alert.alert('Error', 'Failed to update carousel image');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = carouselImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= carouselImages.length) return;

    const reordered = [...carouselImages];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    try {
      const ids = reordered.map(img => img.id);
      await AdminService.reorderCarouselImages(ids);
      loadCarouselImages();
    } catch (err) {
      console.error('Failed to reorder carousel images:', err);
      Alert.alert('Error', 'Failed to reorder carousel images');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl * 2,
    },
    loadingContainer: {
      padding: theme.spacing.xl * 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    errorContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: theme.spacing.md,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    imageCard: {
      width: '100%',
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 2,
    },
    imageCardContent: {
      padding: theme.spacing.md,
    },
    imageContainer: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.md,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imageActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    imageInfo: {
      flex: 1,
    },
    imageTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      lineHeight: 22,
    },
    imageMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs / 2,
      lineHeight: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      marginRight: theme.spacing.xs,
    },
    actionButtonLast: {
      marginRight: 0,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      elevation: 1,
    },
    emptyCardContent: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      lineHeight: 24,
    },
    dialogContent: {
      paddingVertical: theme.spacing.md,
    },
    formField: {
      marginBottom: theme.spacing.md,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    uploadButton: {
      marginBottom: theme.spacing.md,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading carousel images...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadCarouselImages}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button mode="contained" icon="plus" onPress={handleAddNew}>
          Add Image
        </Button>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {carouselImages.length === 0 ? (
          <Card style={styles.emptyCard} elevation={1}>
            <View style={styles.emptyCardContent}>
              <MaterialIcons
                name="image"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                No carousel images yet. Add your first image to get started.
              </Text>
            </View>
          </Card>
        ) : (
          carouselImages.map((image, index) => (
            <Card key={image.id} style={styles.imageCard} elevation={2}>
              <View style={styles.imageCardContent}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: image.image_url }}
                    style={styles.image}
                  />
                </View>
                <View style={styles.imageInfo}>
                  <Text style={styles.imageTitle}>
                    {image.title || `Image ${index + 1}`}
                  </Text>
                  {image.description && (
                    <Text style={styles.imageMeta}>{image.description}</Text>
                  )}
                  <Text style={styles.imageMeta}>
                    Order: {image.display_order} •{' '}
                    {image.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.imageActions}>
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="chevron-up"
                      size={20}
                      disabled={index === 0}
                      onPress={() => handleReorder(image.id, 'up')}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="chevron-down"
                      size={20}
                      disabled={index === carouselImages.length - 1}
                      onPress={() => handleReorder(image.id, 'down')}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon={image.is_active ? 'eye' : 'eye-off'}
                      size={20}
                      onPress={() => handleToggleActive(image)}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEdit(image)}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleDelete(image.id)}
                      style={styles.actionButtonLast}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>
            {editingImage ? 'Edit Carousel Image' : 'Add Carousel Image'}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.formField}>
              <Button
                mode="outlined"
                icon="image"
                onPress={handleImagePick}
                loading={uploading}
                disabled={uploading}
                style={styles.uploadButton}
              >
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageUrl ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.previewImage}
                  />
                </View>
              ) : null}
            </View>

            <TextInput
              label="Title (Optional)"
              value={title}
              onChangeText={setTitle}
              style={styles.formField}
              mode="outlined"
            />

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              style={styles.formField}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Link URL (Optional)"
              value={linkUrl}
              onChangeText={setLinkUrl}
              style={styles.formField}
              mode="outlined"
              placeholder="https://example.com"
            />

            <TextInput
              label="Display Order"
              value={displayOrder.toString()}
              onChangeText={(text) => setDisplayOrder(parseInt(text) || 0)}
              style={styles.formField}
              mode="outlined"
              keyboardType="numeric"
            />

            <View style={styles.formField}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Active</Text>
                <Switch value={isActive} onValueChange={setIsActive} />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSave}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.primary,
        }}
        onPress={handleAddNew}
      />
    </View>
  );
};

export default CarouselManagementSection;

