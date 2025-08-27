# Database Quick Reference
## TRUEVINE FELLOWSHIP Church App

## Table Names
- `users` - Extended user profiles
- `categories` - Content categories
- `tags` - Content tags
- `sermons` - Sermon recordings
- `articles` - Spiritual articles
- `user_preferences` - User app settings
- `user_content` - User interactions (saves, favorites)
- `user_reminders` - Scheduled reminders
- `user_downloads` - Offline content
- `content_views` - View analytics
- `content_downloads` - Download analytics
- `push_tokens` - Notification tokens
- `notifications` - Notification history
- `app_invitations` - App invitations

## Common Queries

### 1. Get Published Sermons
```sql
SELECT 
    s.*,
    c.name as category_name,
    c.color as category_color
FROM sermons s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.is_published = true
ORDER BY s.date DESC;
```

### 2. Get Featured Content
```sql
SELECT 
    'sermon' as content_type,
    id, title, preacher as author, date, description, thumbnail_url
FROM sermons 
WHERE is_featured = true AND is_published = true

UNION ALL

SELECT 
    'article' as content_type,
    id, title, author, published_at as date, excerpt as description, thumbnail_url
FROM articles 
WHERE is_featured = true AND is_published = true

ORDER BY date DESC;
```

### 3. Get User's Saved Content
```sql
SELECT 
    uc.content_type,
    uc.content_id,
    CASE 
        WHEN uc.content_type = 'sermon' THEN s.title
        WHEN uc.content_type = 'article' THEN a.title
    END as title,
    CASE 
        WHEN uc.content_type = 'sermon' THEN s.description
        WHEN uc.content_type = 'article' THEN a.excerpt
    END as description
FROM user_content uc
LEFT JOIN sermons s ON uc.content_type = 'sermon' AND uc.content_id = s.id
LEFT JOIN articles a ON uc.content_type = 'article' AND uc.content_id = a.id
WHERE uc.user_id = $1 AND uc.action_type = 'save';
```

### 4. Search Content
```sql
-- Search sermons and articles
SELECT * FROM search_content('faith', NULL, NULL, 20, 0);

-- Search only sermons
SELECT * FROM search_content('faith', 'sermon', NULL, 20, 0);

-- Search in specific category
SELECT * FROM search_content('faith', NULL, 'category_uuid_here', 20, 0);
```

### 5. Get Content with Tags
```sql
SELECT 
    s.*,
    array_agg(t.name) as tags,
    array_agg(t.color) as tag_colors
FROM sermons s
LEFT JOIN sermon_tags st ON s.id = st.sermon_id
LEFT JOIN tags t ON st.tag_id = t.id
WHERE s.is_published = true
GROUP BY s.id
ORDER BY s.date DESC;
```

### 6. Get User Preferences
```sql
SELECT * FROM user_preferences WHERE user_id = $1;
```

### 7. Get User's Active Reminders
```sql
SELECT 
    ur.*,
    CASE 
        WHEN ur.content_type = 'sermon' THEN s.title
        WHEN ur.content_type = 'article' THEN a.title
    END as content_title
FROM user_reminders ur
LEFT JOIN sermons s ON ur.content_type = 'sermon' AND ur.content_id = s.id
LEFT JOIN articles a ON ur.content_type = 'article' AND ur.content_id = a.id
WHERE ur.user_id = $1 AND ur.is_active = true
ORDER BY ur.reminder_time ASC;
```

### 8. Get Content Analytics
```sql
-- Get sermon views and downloads
SELECT 
    title,
    views,
    downloads,
    ROUND((downloads::float / NULLIF(views, 0)) * 100, 2) as download_rate
FROM sermons 
WHERE is_published = true
ORDER BY views DESC;

-- Get popular tags
SELECT 
    t.name,
    COUNT(st.sermon_id) as sermon_count,
    COUNT(at.article_id) as article_count
FROM tags t
LEFT JOIN sermon_tags st ON t.id = st.tag_id
LEFT JOIN article_tags at ON t.id = at.tag_id
GROUP BY t.id, t.name
ORDER BY (COUNT(st.sermon_id) + COUNT(at.article_id)) DESC;
```

### 9. Get Categories with Content Counts
```sql
SELECT 
    c.*,
    COUNT(s.id) as sermon_count,
    COUNT(a.id) as article_count
FROM categories c
LEFT JOIN sermons s ON c.id = s.category_id AND s.is_published = true
LEFT JOIN articles a ON c.id = a.category_id AND a.is_published = true
WHERE c.is_active = true
GROUP BY c.id
ORDER BY c.sort_order;
```

### 10. Get Recent Activity
```sql
SELECT 
    'view' as activity_type,
    cv.content_type,
    cv.content_id,
    cv.view_date as activity_date,
    CASE 
        WHEN cv.content_type = 'sermon' THEN s.title
        WHEN cv.content_type = 'article' THEN a.title
    END as content_title
FROM content_views cv
LEFT JOIN sermons s ON cv.content_type = 'sermon' AND cv.content_id = s.id
LEFT JOIN articles a ON cv.content_type = 'article' AND cv.content_id = a.id
WHERE cv.user_id = $1

UNION ALL

SELECT 
    'download' as activity_type,
    cd.content_type,
    cd.content_id,
    cd.download_date as activity_date,
    CASE 
        WHEN cd.content_type = 'sermon' THEN s.title
        WHEN cd.content_type = 'article' THEN a.title
    END as content_title
FROM content_downloads cd
LEFT JOIN sermons s ON cd.content_type = 'sermon' AND cd.content_id = s.id
LEFT JOIN articles a ON cd.content_type = 'article' AND cd.content_id = a.id
WHERE cd.user_id = $1

ORDER BY activity_date DESC
LIMIT 20;
```

## Database Functions

### 1. Increment Content Views
```sql
SELECT increment_content_views('sermon', 'sermon_uuid_here', 'user_uuid_here');
SELECT increment_content_views('article', 'article_uuid_here', 'user_uuid_here');
```

### 2. Increment Content Downloads
```sql
SELECT increment_content_downloads('sermon', 'sermon_uuid_here', 'user_uuid_here', 1024000);
```

### 3. Search Content
```sql
SELECT * FROM search_content(query, content_type, category_id, limit, offset);
```

## Insert Operations

### 1. Create New User Profile
```sql
INSERT INTO users (id, email, first_name, last_name, role)
VALUES ($1, $2, $3, $4, 'member');
```

### 2. Add User Preferences
```sql
INSERT INTO user_preferences (user_id, theme, audio_quality, auto_download)
VALUES ($1, 'auto', 'medium', false);
```

### 3. Save Content
```sql
INSERT INTO user_content (user_id, content_type, content_id, action_type)
VALUES ($1, 'sermon', $2, 'save');
```

### 4. Schedule Reminder
```sql
INSERT INTO user_reminders (user_id, content_type, content_id, reminder_time, message)
VALUES ($1, 'sermon', $2, $3, 'Time to listen to this sermon');
```

### 5. Add Push Token
```sql
INSERT INTO push_tokens (user_id, token, platform)
VALUES ($1, $2, 'ios');
```

## Update Operations

### 1. Update User Profile
```sql
UPDATE users 
SET first_name = $2, last_name = $3, avatar_url = $4
WHERE id = $1;
```

### 2. Update User Preferences
```sql
UPDATE user_preferences 
SET theme = $2, audio_quality = $3
WHERE user_id = $1;
```

### 3. Mark Notification as Read
```sql
UPDATE notifications 
SET is_read = true, read_at = NOW()
WHERE id = $1 AND user_id = $2;
```

### 4. Deactivate Reminder
```sql
UPDATE user_reminders 
SET is_active = false
WHERE id = $1 AND user_id = $2;
```

## Delete Operations

### 1. Remove Saved Content
```sql
DELETE FROM user_content 
WHERE user_id = $1 AND content_type = $2 AND content_id = $3;
```

### 2. Remove Push Token
```sql
DELETE FROM push_tokens 
WHERE user_id = $1 AND token = $2;
```

### 3. Cancel Reminder
```sql
DELETE FROM user_reminders 
WHERE id = $1 AND user_id = $2;
```

## Row Level Security (RLS) Policies

### Public Access
- Published sermons and articles
- Active categories and tags
- User registration and authentication

### Authenticated User Access
- Own profile and preferences
- Own content interactions
- Own reminders and downloads
- Own notifications and push tokens

### Admin Access
- All users and content
- Content management
- Analytics and reporting

## Performance Tips

### 1. Use Indexes
- All foreign keys are indexed
- Full-text search indexes on content
- Composite indexes for common queries

### 2. Efficient Joins
- Use LEFT JOIN for optional relationships
- Use INNER JOIN when relationship is required
- Avoid unnecessary table scans

### 3. Query Optimization
- Use LIMIT for pagination
- Use OFFSET for large datasets
- Use the search_content function for text search

### 4. Connection Management
- Use connection pooling
- Close connections properly
- Monitor query performance

## Error Handling

### Common Errors
- **Foreign Key Violation**: Check if referenced record exists
- **Unique Constraint**: Check for duplicate values
- **Check Constraint**: Validate data meets requirements
- **RLS Policy**: Ensure user has proper permissions

### Debugging
- Check Supabase logs
- Verify RLS policies
- Test queries with proper user context
- Use EXPLAIN ANALYZE for slow queries

---

**Note**: Always test queries in a development environment before using in production. Use parameterized queries to prevent SQL injection.
