# Image Upload Setup Guide

This guide will help you set up image uploads to Supabase Storage for your TRUEVINE FELLOWSHIP Church App.

## Prerequisites

- Supabase project set up
- Admin access to your Supabase dashboard
- React Native app with Expo

## Step 1: Run the Storage Migration

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration file: `database/migrations/001_create_storage_bucket.sql`

This will:
- Create an `images` bucket in Supabase Storage
- Set up proper RLS policies for public read access
- Allow authenticated users to upload images
- Allow admins to manage all images

## Step 2: Configure Storage Bucket (Optional)

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Click on the `images` bucket
3. Configure settings:
   - **File size limit**: 5MB (already set)
   - **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
   - **Public bucket**: ✅ (enabled for public URLs)

## Step 3: Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to the admin panel (`/admin`)
3. Try creating a new sermon or article
4. Use the image upload component to select an image
5. The image should upload to Supabase and display a public URL

## Step 4: Verify Public URLs

After uploading an image, you should see:
- A public URL like: `https://your-project.supabase.co/storage/v1/object/public/images/content/image_1234567890.jpg`
- The image should be accessible without authentication
- The image should display in your app

## Features Included

### ImageUploadService
- **Pick from library**: Select images from device photo library
- **Take photo**: Capture new photos with camera
- **Upload to Supabase**: Automatic upload to your storage bucket
- **Public URLs**: Generate public URLs for immediate use
- **File validation**: Check file type and size
- **Error handling**: Comprehensive error handling

### ImageUpload Component
- **Drag & drop interface**: Easy-to-use upload area
- **Image preview**: See selected image before upload
- **Progress indicator**: Shows upload progress
- **Remove functionality**: Delete uploaded images
- **Responsive design**: Works on all screen sizes

### Admin Forms Integration
- **SermonCreateForm**: Upload sermon thumbnails
- **ArticleCreateForm**: Upload article thumbnails
- **Organized folders**: Images stored in `sermons/` and `articles/` folders
- **Consistent aspect ratio**: 16:9 aspect ratio for all thumbnails

## File Structure

```
lib/services/
  └── imageUploadService.ts    # Core upload functionality

components/ui/
  └── ImageUpload.tsx          # Reusable upload component

database/migrations/
  └── 001_create_storage_bucket.sql  # Storage setup migration
```

## Usage Examples

### Basic Image Upload
```tsx
import ImageUpload from '@/components/ui/ImageUpload';

<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  placeholder="Upload an image"
  folder="content"
/>
```

### Advanced Configuration
```tsx
<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  placeholder="Upload sermon thumbnail"
  folder="sermons"
  aspectRatio={[16, 9]}
  maxWidth={800}
  maxHeight={600}
  disabled={false}
/>
```

## Troubleshooting

### Common Issues

1. **Permission denied**: Make sure you've run the storage migration
2. **Upload fails**: Check your Supabase project URL and anon key
3. **Images not displaying**: Verify the bucket is set to public
4. **File too large**: Check file size (max 5MB)

### Debug Steps

1. Check Supabase logs in the dashboard
2. Verify RLS policies are correctly set
3. Test with a small image first
4. Check network connectivity

## Security Notes

- Images are stored in a public bucket
- RLS policies control access
- File size and type validation prevents abuse
- Users can only manage their own uploads (except admins)

## Next Steps

1. Test the image upload functionality
2. Upload some sample images for sermons and articles
3. Verify images display correctly on the dashboard and content pages
4. Consider adding image compression for better performance

## Support

If you encounter any issues:
1. Check the Supabase dashboard for error logs
2. Verify your migration was applied correctly
3. Test with different image types and sizes
4. Check the React Native console for JavaScript errors
