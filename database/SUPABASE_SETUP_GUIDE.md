# Supabase Database Setup Guide
## TRUEVINE FELLOWSHIP Church App

This guide will walk you through setting up the complete database schema for the TRUEVINE FELLOWSHIP Church App in Supabase.

## Prerequisites

1. **Supabase Account**: You need a Supabase account and project
2. **Project Access**: Access to your Supabase project dashboard
3. **Database Knowledge**: Basic understanding of SQL and database concepts

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `truevine-fellowship-app` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project setup to complete (5-10 minutes)

## Step 2: Access SQL Editor

1. In your Supabase dashboard, go to **SQL Editor** in the left sidebar
2. Click **New Query**
3. You'll see a blank SQL editor where you can run commands

## Step 3: Execute Schema Creation

### Option A: Run Complete Schema (Recommended)

1. Copy the entire contents of `database/schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** button
4. Wait for all commands to execute successfully

### Option B: Run Schema in Parts (For Debugging)

If you encounter issues, you can run the schema in sections:

#### Part 1: Extensions and Core Tables
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Core tables (users, categories, tags, sermons, articles)
-- Copy the core tables section from schema.sql
```

#### Part 2: Relationship and User Tables
```sql
-- Relationship tables and user interaction tables
-- Copy the relationship and user interaction sections
```

#### Part 3: Analytics and Notifications
```sql
-- Analytics, notification, and app invitation tables
-- Copy the remaining sections
```

## Step 4: Verify Schema Creation

1. Go to **Table Editor** in the left sidebar
2. Verify these tables exist:
   - `users`
   - `categories`
   - `tags`
   - `sermons`
   - `articles`
   - `user_preferences`
   - `user_content`
   - `user_reminders`
   - `user_downloads`
   - `content_views`
   - `content_downloads`
   - `push_tokens`
   - `notifications`
   - `app_invitations`

## Step 5: Check Row Level Security (RLS)

1. Go to **Authentication** → **Policies** in the left sidebar
2. Verify RLS is enabled on all tables
3. Check that policies are created correctly

## Step 6: Test Database Functions

1. Go back to **SQL Editor**
2. Test the search function:

```sql
-- Test search functionality
SELECT * FROM search_content('faith', 'sermon', NULL, 5, 0);

-- Test view increment function
SELECT increment_content_views('sermon', '00000000-0000-0000-0000-000000000000', NULL);

-- Test download increment function
SELECT increment_content_downloads('sermon', '00000000-0000-0000-0000-000000000000', NULL, 1024000);
```

## Step 7: Update Environment Variables

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL**
   - **Anon (public) key**
3. Update your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 8: Generate TypeScript Types

1. Install Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```

2. Generate types:
   ```bash
   supabase gen types typescript --project-id your_project_id > types/database.ts
   ```

3. Update your `lib/supabase/client.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   import { Database } from '../types/database';

   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Missing Supabase environment variables');
   }

   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: false,
     },
   });
   ```

## Step 9: Test Authentication

1. Go to **Authentication** → **Users** in Supabase
2. Try creating a test user
3. Verify the user appears in your `users` table

## Step 10: Insert Sample Data

1. Go to **SQL Editor**
2. Insert sample content:

```sql
-- Insert sample sermon
INSERT INTO public.sermons (
    title, 
    preacher, 
    date, 
    duration, 
    audio_url, 
    description, 
    category_id,
    is_published
) VALUES (
    'Walking in Faith',
    'Pastor John Smith',
    '2024-12-01',
    3600,
    'https://example.com/sermon1.mp3',
    'A powerful message about walking in faith through difficult times',
    (SELECT id FROM public.categories WHERE name = 'Sermons'),
    true
);

-- Insert sample article
INSERT INTO public.articles (
    title,
    author,
    content,
    excerpt,
    category_id,
    is_published
) VALUES (
    'Daily Prayer Guide',
    'Pastor John Smith',
    'This is the full content of the daily prayer guide...',
    'A comprehensive guide to daily prayer practices',
    (SELECT id FROM public.categories WHERE name = 'Articles'),
    true
);
```

## Troubleshooting Common Issues

### Issue: "Extension already exists"
- **Solution**: This is normal, extensions are created only if they don't exist

### Issue: "Permission denied"
- **Solution**: Make sure you're using the correct database role (usually `postgres`)

### Issue: "Table already exists"
- **Solution**: Drop existing tables first or use `CREATE TABLE IF NOT EXISTS`

### Issue: "Function already exists"
- **Solution**: Use `CREATE OR REPLACE FUNCTION` (already in the schema)

### Issue: RLS policies not working
- **Solution**: Verify RLS is enabled and policies are created correctly

## Database Schema Overview

### Core Tables
- **`users`**: Extended user profiles
- **`categories`**: Content categorization
- **`tags`**: Content tagging
- **`sermons`**: Sermon recordings
- **`articles`**: Spiritual articles

### User Interaction Tables
- **`user_preferences`**: App settings
- **`user_content`**: Saves, favorites
- **`user_reminders`**: Scheduled reminders
- **`user_downloads`**: Offline content

### Analytics Tables
- **`content_views`**: View tracking
- **`content_downloads`**: Download tracking

### Notification Tables
- **`push_tokens`**: Device tokens
- **`notifications`**: Notification history

### App Features
- **`app_invitations`**: Invitation system

## Security Features

1. **Row Level Security (RLS)**: Enabled on all tables
2. **User Isolation**: Users can only access their own data
3. **Public Content**: Published content is publicly readable
4. **Admin Access**: Admins can manage all content
5. **Input Validation**: Check constraints on critical fields

## Performance Features

1. **Indexes**: Optimized for common queries
2. **Full-Text Search**: PostgreSQL text search capabilities
3. **Efficient Joins**: Proper foreign key relationships
4. **Query Optimization**: Functions for common operations

## Next Steps

After setting up the database:

1. **Test the API**: Use Supabase's built-in API testing tools
2. **Set up Storage**: Configure Supabase Storage for audio files
3. **Configure Auth**: Set up authentication providers if needed
4. **Monitor Performance**: Use Supabase's built-in analytics
5. **Backup Strategy**: Set up regular database backups

## Support

If you encounter issues:

1. Check Supabase documentation
2. Review error messages in the SQL Editor
3. Check Supabase logs in the dashboard
4. Verify your database connection and permissions

## Database Maintenance

### Regular Tasks
- Monitor table sizes and performance
- Check for unused indexes
- Review RLS policies
- Backup important data

### Performance Monitoring
- Use Supabase's built-in query performance tools
- Monitor slow queries
- Check index usage statistics

---

**Note**: This schema is designed for production use but should be tested thoroughly in a development environment first. Consider creating a development branch in Supabase for testing before applying to production.
